import path from 'node:path';
import fs from 'node:fs';
import { rootDirectory } from './server/server-directory.ts';

const publicDir = path.join(import.meta.dir, 'client');
const distDir = path.join(publicDir, 'dist');

fs.mkdirSync(distDir, { recursive: true });

console.log('===== Frontend Build → public/dist/ =====');

const resolveEdgeCases = {
    name: 'resolve-edge-cases' as const,
    setup(build: any) {
        const publicLib = path.join(publicDir, 'lib') + path.sep;
        build.onResolve({ filter: /^\.{1,2}\/lib\// }, (args: any) => {
            const resolved = path.resolve(args.resolveDir, args.path);
            if (resolved.startsWith(publicLib)) {
                return { path: args.path, external: true };
            }
            return undefined;
        });
        build.onResolve({ filter: /^(\/|\.{1,2}\/)lib\.js$/ }, (args: any) => {
            const resolved = path.resolve(args.resolveDir, args.path);
            if (resolved.startsWith(publicLib) || args.path === '/lib.js') {
                return { path: '/lib.js', external: true };
            }
            return undefined;
        });
        build.onResolve({ filter: /^\/(script\.ts|script\.js|scripts\/.*|lib\/.*|lib\.js)$/ }, (args: unknown) => {
            if (typeof args === 'object' && args && 'path' in args) {
                const p = (args as { path: string }).path;
                if (p === '/lib.js') {
                    return { path: '/lib.js', external: true };
                }
                if (p === '/script.ts' || p === '/script.js') {
                    return { path: path.join(publicDir, 'script.ts') };
                }
                const relative = p.startsWith('/') ? p.slice(1) : p;
                const candidateTs = path.join(publicDir, relative.replace(/\.js$/, '.ts'));
                const candidate = fs.existsSync(candidateTs) ? candidateTs : path.join(publicDir, relative);
                return { path: candidate };
            }
            return undefined;
        });
        build.onResolve({ filter: /^JSZip$/ }, () => ({
            path: 'JSZip',
            external: true,
        }));
    },
};

async function main() {
  console.log('[1/3] Bundling lib.ts...');
  const libResult = await Bun.build({
    entrypoints: [path.join(publicDir, 'lib.ts')],
    outdir: distDir,
    target: 'browser',
    format: 'esm',
    minify: true,
    plugins: [resolveEdgeCases],
  });
  if (!libResult.success) {
    console.error('Lib bundle FAILED:');
    for (const log of libResult.logs) console.error(log);
    process.exit(1);
  }
  console.log(`  → dist/lib.js (${(libResult.outputs[0].size / 1024).toFixed(0)} KB)`);

  console.log('[2/3] Bundling script.ts...');
  const scriptResult = await Bun.build({
    entrypoints: [path.join(publicDir, 'script.ts')],
    root: publicDir,
    outdir: distDir,
    target: 'browser',
    format: 'esm',
    minify: true,
    plugins: [resolveEdgeCases],
  });
  if (!scriptResult.success) {
    console.error('Script bundle FAILED:');
    for (const log of scriptResult.logs) console.error(log);
    process.exit(1);
  }
  console.log(`  → dist/script.js (${(scriptResult.outputs[0].size / 1024).toFixed(0)} KB)`);

  console.log('[3/3] Bundling login.ts...');
  fs.mkdirSync(path.join(distDir, 'scripts'), { recursive: true });
  const loginResult = await Bun.build({
    entrypoints: [path.join(publicDir, 'scripts', 'login.ts')],
    root: publicDir,
    outdir: path.join(distDir, 'scripts'),
    target: 'browser',
    format: 'esm',
    minify: true,
    plugins: [resolveEdgeCases],
  });
  if (!loginResult.success) {
    console.error('Login bundle FAILED:');
    for (const log of loginResult.logs) console.error(log);
    process.exit(1);
  }
  const nestedLogin = path.join(distDir, 'scripts', 'scripts', 'login.js');
  if (fs.existsSync(nestedLogin)) {
    fs.renameSync(nestedLogin, path.join(distDir, 'scripts', 'login.js'));
  }
  console.log(`  → dist/scripts/login.js (${fs.statSync(path.join(distDir, 'scripts', 'login.js')).size} bytes)`);

  console.log('[4/4] Extensions...');
  console.log('Skipping extension bundling; serving built-in extensions from src/client/extensions/');
  console.log('===== Frontend Build complete =====');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
