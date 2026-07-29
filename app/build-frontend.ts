import { $ } from 'bun';
import { Glob } from 'bun';
import path from 'node:path';
import fs from 'node:fs';

const publicDir = path.join(import.meta.dir, 'public');
const distDir = path.join(publicDir, 'dist');
const scriptsDir = path.join(publicDir, 'scripts');

// Ensure dist directory exists
fs.mkdirSync(distDir, { recursive: true });

console.log('===== Frontend Build → public/dist/ =====');

// Step 1: Bundle lib.ts → dist/lib.js (npm dependencies, replaces webpack)
console.log('[1/4] Bundling lib.ts...');
await $`bun build ${path.join(publicDir, 'lib.ts')} --outfile ${path.join(distDir, 'lib.js')} --format esm --target browser`.quiet();

// Step 2: Transpile script.ts → dist/script.js
console.log('[2/4] Transpiling script.ts...');
await $`bun build ${path.join(publicDir, 'script.ts')} --outfile ${path.join(distDir, 'script.js')} --target browser --format esm --no-bundle`.quiet();

// Step 3: Transpile scripts/login.ts → dist/scripts/login.js
console.log('[3/4] Transpiling login.ts...');
const distScriptsDir = path.join(distDir, 'scripts');
fs.mkdirSync(distScriptsDir, { recursive: true });
await $`bun build ${path.join(scriptsDir, 'login.ts')} --outfile ${path.join(distScriptsDir, 'login.js')} --target browser --format esm --no-bundle`.quiet();

// Step 4: Transpile all scripts/**/*.ts → dist/scripts/**/*.js
console.log('[4/4] Transpiling scripts/ files...');
const tsFiles: string[] = [];
for await (const file of new Glob('**/*.ts').scan(scriptsDir)) {
    if (file.endsWith('.d.ts')) continue;
    if (file === 'login.ts') continue; // already done
    tsFiles.push(file);
}

tsFiles.sort();
let count = 0;
for (const file of tsFiles) {
    const fullPath = path.join(scriptsDir, file);
    const outPath = path.join(distDir, 'scripts', file.replace(/\.ts$/, '.js'));
    // Create subdirectories as needed
    const outDir = path.dirname(outPath);
    fs.mkdirSync(outDir, { recursive: true });
    await $`bun build ${fullPath} --outfile ${outPath} --target browser --format esm --no-bundle`.quiet();
    count++;
    if (count % 20 === 0) console.log(`  ${count}/${tsFiles.length}...`);
}
console.log(`  ${count} scripts transpiled.`);

console.log('===== Build complete → public/dist/ =====');
