import path from 'node:path';
import fs from 'node:fs';

const publicDir = path.join(import.meta.dir, 'public');
const distDir = path.join(publicDir, 'dist');

fs.mkdirSync(distDir, { recursive: true });

console.log('===== Frontend Build → public/dist/ =====');

// Minimal plugin for edge-case imports
const resolveEdgeCases = {
    name: 'resolve-edge-cases' as const,
    setup(build: any) {
        // /lib.js → source lib.ts (URL-style absolute import in request-compression.ts)
        build.onResolve({ filter: /^\/lib\.js$/ }, (args: any) => ({
            path: path.join(publicDir, 'lib.ts'),
        }));
        // JSZip global inside vendor epub.min.js — leave as external
        build.onResolve({ filter: /^JSZip$/ }, () => ({
            path: 'JSZip',
            external: true,
        }));
    },
};

// 1. Bundle lib.ts → dist/lib.js (npm deps, window shims for legacy extensions)
console.log('[1/3] Bundling lib.ts...');
const libResult = await Bun.build({
    entrypoints: [path.join(publicDir, 'lib.ts')],
    outdir: distDir,
    target: 'browser',
    format: 'esm',
});

if (!libResult.success) {
    console.error('Lib bundle FAILED:');
    for (const log of libResult.logs) console.error(log);
    process.exit(1);
}
console.log(`  → dist/lib.js (${(libResult.outputs[0].size / 1024).toFixed(0)} KB)`);

// 2. Bundle script.ts → dist/script.js (main app — all static imports inlined)
console.log('[2/3] Bundling script.ts...');
const scriptResult = await Bun.build({
    entrypoints: [path.join(publicDir, 'script.ts')],
    outdir: distDir,
    target: 'browser',
    format: 'esm',
    plugins: [resolveEdgeCases],
});

if (!scriptResult.success) {
    console.error('Script bundle FAILED:');
    for (const log of scriptResult.logs) console.error(log);
    process.exit(1);
}
console.log(`  → dist/script.js (${(scriptResult.outputs[0].size / 1024).toFixed(0)} KB)`);

// 3. Bundle login.ts → dist/scripts/login.js (separate login page entry)
console.log('[3/3] Bundling login.ts...');
fs.mkdirSync(path.join(distDir, 'scripts'), { recursive: true });
const loginResult = await Bun.build({
    entrypoints: [path.join(publicDir, 'scripts', 'login.ts')],
    outdir: path.join(distDir, 'scripts'),
    target: 'browser',
    format: 'esm',
});

if (!loginResult.success) {
    console.error('Login bundle FAILED:');
    for (const log of loginResult.logs) console.error(log);
    process.exit(1);
}
console.log(`  → dist/scripts/login.js (${(loginResult.outputs[0].size / 1024).toFixed(0)} KB)`);

console.log('===== Build complete =====');
