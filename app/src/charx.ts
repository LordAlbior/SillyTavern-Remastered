import fs from 'node:fs';
import path from 'node:path';
import _ from 'lodash';
import sanitize from 'sanitize-filename';
import { sync as writeFileAtomicSync } from 'write-file-atomic';
import { extractFileFromZipBuffer, extractFilesFromZipBuffer, normalizeZipEntryPath, ensureDirectory } from './util.ts';
import { DEFAULT_AVATAR_PATH } from './constants.ts';

// 'embeded://' is intentional - RisuAI exports use this misspelling
const CHARX_EMBEDDED_URI_PREFIXES = ['embeded://', 'embedded://', '__asset:'];
const CHARX_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'apng', 'avif', 'bmp', 'jfif']);
const CHARX_SPRITE_TYPES = new Set(['emotion', 'expression']);
const CHARX_BACKGROUND_TYPES = new Set(['background']);

// ZIP local file header signature: PK\x03\x04
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4B, 0x03, 0x04]);

interface CharXAsset {
    type: string;
    name: string;
    ext: string;
    zipPath: string;
    order: number;
    storageCategory?: 'sprite' | 'background' | 'misc';
    baseName?: string;
}

interface CharXParseResult {
    card: Record<string, unknown>;
    avatar: string | Buffer;
    auxiliaryAssets: CharXAsset[];
    extractedBuffers: Map<string, Buffer>;
}

interface CharXPersistSummary {
    sprites: number;
    backgrounds: number;
    misc: number;
}

interface UserDirectoriesForCharX {
    characters: string;
    userImages: string;
    [key: string]: string;
}

/**
 * Find ZIP data start in buffer (handles SFX/self-extracting archives).
 */
function findZipStart(buffer: ArrayBufferLike | Uint8Array): Buffer {
    const buf = Buffer.isBuffer(buffer) ? (buffer as Buffer) : Buffer.from(buffer as ArrayBufferLike);
    const index = buf.indexOf(ZIP_SIGNATURE);
    if (index > 0) {
        return buf.slice(index);
    }
    return buf;
}

export class CharXParser {
    #data: ArrayBufferLike;

    constructor(data: ArrayBufferLike | Uint8Array) {
        // Handle SFX (self-extracting) ZIP archives by finding the actual ZIP start
        this.#data = findZipStart(Buffer.isBuffer(data) ? (data as Buffer) : Buffer.from(data as ArrayBufferLike)) as unknown as ArrayBufferLike;
    }

    /**
     * Parse the CharX archive and extract card data and assets.
     */
    async parse(): Promise<CharXParseResult> {
        console.info('Importing from CharX');
        const cardBuffer = await extractFileFromZipBuffer(this.#data, 'card.json');

        if (!cardBuffer) {
            throw new Error('Failed to extract card.json from CharX file');
        }

        const card = JSON.parse(cardBuffer.toString());

        if (card.spec === undefined) {
            throw new Error('Invalid CharX card file: missing spec field');
        }

        const embeddedAssets = this.collectCharXAssets(card);
        const iconAsset = this.pickCharXIconAsset(embeddedAssets);
        const auxiliaryAssets = this.mapCharXAssetsForStorage(embeddedAssets);

        const archivePaths = new Set<string>();

        if (iconAsset?.zipPath) {
            archivePaths.add(iconAsset.zipPath);
        }
        for (const asset of auxiliaryAssets) {
            if (asset?.zipPath) {
                archivePaths.add(asset.zipPath);
            }
        }

        let extractedBuffers = new Map<string, Buffer>();
        if (archivePaths.size > 0) {
            extractedBuffers = await extractFilesFromZipBuffer(this.#data, [...archivePaths]) as Map<string, Buffer>;
        }

        let avatar: string | Buffer = DEFAULT_AVATAR_PATH;
        if (iconAsset?.zipPath) {
            const iconBuffer = extractedBuffers.get(iconAsset.zipPath);
            if (iconBuffer) {
                avatar = iconBuffer;
            }
        }

        return { card, avatar, auxiliaryAssets, extractedBuffers };
    }

    getEmbeddedZipPathFromUri(uri: unknown): string | null {
        if (typeof uri !== 'string') {
            return null;
        }

        const trimmed = uri.trim();
        if (!trimmed) {
            return null;
        }

        const lower = trimmed.toLowerCase();
        for (const prefix of CHARX_EMBEDDED_URI_PREFIXES) {
            if (lower.startsWith(prefix)) {
                const rawPath = trimmed.slice(prefix.length);
                return normalizeZipEntryPath(rawPath);
            }
        }

        return null;
    }

    /**
     * Normalize extension string: lowercase, strip leading dot.
     */
    normalizeExtString(ext: unknown): string {
        if (typeof ext !== 'string') return '';
        return ext.trim().toLowerCase().replace(/^\./, '');
    }

    /**
     * Strip trailing image extension from asset name if present.
     * Handles cases like "image.png" with ext "png" → "image" (avoids "image.png.png")
     */
    stripTrailingImageExtension(name: string | undefined | null, expectedExt: string): string {
        if (!name || !expectedExt) return name ?? '';
        const lower = name.toLowerCase();
        // Check if name ends with the expected extension
        if (lower.endsWith(`.${expectedExt}`)) {
            return name.slice(0, -(expectedExt.length + 1));
        }
        // Also check for any known image extension at the end
        for (const ext of CHARX_IMAGE_EXTENSIONS) {
            if (lower.endsWith(`.${ext}`)) {
                return name.slice(0, -(ext.length + 1));
            }
        }
        return name;
    }

    deriveCharXAssetExtension(assetExt: unknown, zipPath: string | undefined): string {
        const metaExt = this.normalizeExtString(assetExt);
        const pathExt = this.normalizeExtString(path.extname(zipPath || ''));
        return metaExt || pathExt;
    }

    collectCharXAssets(card: Record<string, unknown>): CharXAsset[] {
        const assets = _.get(card, 'data.assets') as unknown;
        if (!Array.isArray(assets)) {
            return [];
        }

        return assets.map((asset: unknown, index: number): CharXAsset | null => {
            if (!asset || typeof asset !== 'object') {
                return null;
            }

            const assetObj = asset as Record<string, unknown>;
            const zipPath = this.getEmbeddedZipPathFromUri(assetObj.uri);
            if (!zipPath) {
                return null;
            }

            const ext = this.deriveCharXAssetExtension(assetObj.ext, zipPath);
            const type = typeof assetObj.type === 'string' ? assetObj.type.toLowerCase() : '';
            const name = typeof assetObj.name === 'string' ? assetObj.name : '';

            return {
                type,
                name,
                ext,
                zipPath,
                order: index,
            };
        }).filter((x): x is CharXAsset => x !== null);
    }

    pickCharXIconAsset(assets: CharXAsset[]): CharXAsset | null {
        const iconAssets = assets.filter(asset => asset.type === 'icon' && CHARX_IMAGE_EXTENSIONS.has(asset.ext) && asset.zipPath);
        if (iconAssets.length === 0) {
            return null;
        }

        const mainIcon = iconAssets.find(asset => asset.name?.toLowerCase() === 'main');
        return mainIcon || iconAssets[0];
    }

    /**
     * Normalize asset name for filesystem storage.
     */
    getCharXAssetBaseName(name: string | null | undefined, fallback: string, useHyphens = false): string {
        const cleaned = (String(name ?? '').trim() || '');
        if (!cleaned) {
            return fallback.toLowerCase();
        }

        const separator = useHyphens ? '-' : '_';
        // Convert to lowercase, collapse non-alphanumeric runs to separator, trim edges
        const base = cleaned
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, separator)
            .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');

        if (!base) {
            return fallback.toLowerCase();
        }

        const sanitized = sanitize(base);
        return (sanitized || fallback).toLowerCase();
    }

    mapCharXAssetsForStorage(assets: CharXAsset[]): CharXAsset[] {
        return assets.reduce<CharXAsset[]>((acc, asset) => {
            if (!asset?.zipPath) {
                return acc;
            }

            const ext = (asset.ext || '').toLowerCase();
            if (!CHARX_IMAGE_EXTENSIONS.has(ext)) {
                return acc;
            }

            if (asset.type === 'icon' || asset.type === 'user_icon') {
                return acc;
            }

            let storageCategory: 'sprite' | 'background' | 'misc';
            if (CHARX_SPRITE_TYPES.has(asset.type)) {
                storageCategory = 'sprite';
            } else if (CHARX_BACKGROUND_TYPES.has(asset.type)) {
                storageCategory = 'background';
            } else {
                storageCategory = 'misc';
            }

            // Use hyphens for sprites so ST's expression label extraction works correctly
            // (sprites.js extracts label via regex that splits on dash or dot)
            const useHyphens = storageCategory === 'sprite';
            // Strip trailing extension from name if present (e.g., "image.png" with ext "png")
            const nameWithoutExt = this.stripTrailingImageExtension(asset.name, ext);
            acc.push({
                ...asset,
                ext,
                storageCategory,
                baseName: this.getCharXAssetBaseName(nameWithoutExt, `${storageCategory}-${asset.order ?? 0}`, useHyphens),
            });

            return acc;
        }, []);
    }
}

/**
 * Delete existing file with same base name (any extension) before overwriting.
 * Matches ST's sprite upload behavior in sprites.js.
 */
function deleteExistingByBaseName(dirPath: string, baseName: string): void {
    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true }).filter(f => f.isFile()).map(f => f.name);
        for (const file of files) {
            if (path.parse(file).name === baseName) {
                fs.unlinkSync(path.join(dirPath, file));
            }
        }
    } catch {
        // Directory doesn't exist yet or other error, that's fine
    }
}

/**
 * Persist extracted CharX assets to appropriate ST directories.
 * Note: Uses sync writes consistent with ST's existing file handling.
 */
export function persistCharXAssets(assets: CharXAsset[], bufferMap: Map<string, Buffer>, directories: UserDirectoriesForCharX, characterFolder: string): CharXPersistSummary {
    const summary: CharXPersistSummary = { sprites: 0, backgrounds: 0, misc: 0 };
    if (!Array.isArray(assets) || assets.length === 0) {
        return summary;
    }

    let spritesPath: string | null = null;
    let miscPath: string | null = null;

    const ensureSpritesPath = (): string | null => {
        if (spritesPath) {
            return spritesPath;
        }
        const candidate = path.join(directories.characters, characterFolder);
        if (!ensureDirectory(candidate)) {
            return null;
        }
        spritesPath = candidate;
        return spritesPath;
    };

    const ensureMiscPath = (): string | null => {
        if (miscPath) {
            return miscPath;
        }
        // Use the image gallery path: user/images/{characterName}/
        const candidate = path.join(directories.userImages, characterFolder);
        if (!ensureDirectory(candidate)) {
            return null;
        }
        miscPath = candidate;
        return miscPath;
    };

    for (const asset of assets) {
        if (!asset?.zipPath) {
            continue;
        }
        const buffer = bufferMap.get(asset.zipPath);
        if (!buffer) {
            console.warn(`CharX: Asset ${asset.zipPath} missing or unsupported, skipping.`);
            continue;
        }

        try {
            if (asset.storageCategory === 'sprite') {
                const targetDir = ensureSpritesPath();
                if (!targetDir) {
                    continue;
                }
                // Delete existing sprite with same base name (any extension) - matches sprites.js behavior
                deleteExistingByBaseName(targetDir, asset.baseName ?? '');
                const filePath = path.join(targetDir, `${asset.baseName}.${asset.ext || 'png'}`);
                writeFileAtomicSync(filePath, buffer);
                summary.sprites += 1;
                continue;
            }

            if (asset.storageCategory === 'background') {
                // Store in character-specific backgrounds folder: characters/{charName}/backgrounds/
                const backgroundDir = path.join(directories.characters, characterFolder, 'backgrounds');
                if (!ensureDirectory(backgroundDir)) {
                    continue;
                }
                // Delete existing background with same base name
                deleteExistingByBaseName(backgroundDir, asset.baseName ?? '');
                const fileName = `${asset.baseName}.${asset.ext || 'png'}`;
                const filePath = path.join(backgroundDir, fileName);
                writeFileAtomicSync(filePath, buffer);
                summary.backgrounds += 1;
                continue;
            }

            if (asset.storageCategory === 'misc') {
                const miscDir = ensureMiscPath();
                if (!miscDir) {
                    continue;
                }
                // Overwrite existing misc asset with same name
                const filePath = path.join(miscDir, `${asset.baseName}.${asset.ext || 'png'}`);
                writeFileAtomicSync(filePath, buffer);
                summary.misc += 1;
            }
        } catch (error) {
            console.warn(`CharX: Failed to save asset "${asset.name}": ${(error as Error).message}`);
        }
    }

    return summary;
}
