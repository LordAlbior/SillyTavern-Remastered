import fetch from 'node-fetch';
import { SECRET_KEYS, readSecret } from '../endpoints/secrets.ts';
import type { UserDirectoryList } from '../users.ts';

const SOURCES = {
    'nomicai': {
        secretKey: SECRET_KEYS.NOMICAI,
        url: 'api-atlas.nomic.ai/v1/embedding/text',
        model: 'nomic-embed-text-v1.5',
    },
} as const;

type NomicAISource = keyof typeof SOURCES;

/**
 * Gets the vector for the given text batch from an OpenAI compatible endpoint.
 */
export async function getNomicAIBatchVector(texts: string[], source: string, directories: UserDirectoryList): Promise<number[][]> {
    const config = SOURCES[source as NomicAISource];

    if (!config) {
        console.error('Unknown source', source);
        throw new Error('Unknown source');
    }

    const key = readSecret(directories, config.secretKey);

    if (!key) {
        console.warn('No API key found');
        throw new Error('No API key found');
    }

    const url = config.url;
    let response;
    response = await fetch(`https://${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            texts: texts,
            model: config.model,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        console.warn('API request failed', response.statusText, text);
        throw new Error('API request failed');
    }

    const data = await response.json() as { embeddings?: number[][] };
    if (!Array.isArray(data?.embeddings)) {
        console.warn('API response was not an array');
        throw new Error('API response was not an array');
    }

    return data.embeddings;
}

/**
 * Gets the vector for the given text from an OpenAI compatible endpoint.
 */
export async function getNomicAIVector(text: string, source: string, directories: UserDirectoryList): Promise<number[]> {
    const vectors = await getNomicAIBatchVector([text], source, directories);
    return vectors[0];
}
