import path from 'node:path';
import fs from 'node:fs';
import { readdirSync } from 'node:fs';

const publicDir = path.join(import.meta.dir, 'client');
const distDir = path.join(publicDir, 'dist');
const extRoot = path.join(publicDir, 'extensions');
const publicScripts = path.join(publicDir, 'scripts');

fs.mkdirSync(distDir, { recursive: true });

console.log('===== Frontend Build → client/dist/ =====');

// Shared framework plugin.
// - Absolute `/lib.js` and `/script.js` are the singleton hosts: left external
//   so every built-in extension resolves to the SAME module instance (stateful
//   eventSource / getContext live in /script.js; third-party libs in /lib.js).
// - Absolute `/scripts/**` and `/lib/**` are resolved to their TypeScript
//   source and bundled (stateless helpers; per-extension copies are fine).
// - Relative imports (used inside the app shell) resolve natively.
const sharedFramework = {
  name: 'shared-framework' as const,
  setup(build: Bun.PluginBuilder) {
    build.onResolve({ filter: /^\// }, (args: Bun.OnResolveArgs) => {
      const p = args.path;
      if (p === '/lib.js' || p === '/script.js') {
        return { path: p, external: true };
      }
      const rel = p.slice(1);
      const candidateTs = path.join(publicDir, rel.replace(/\.js$/, '') + '.ts');
      const candidate = fs.existsSync(candidateTs) ? candidateTs : path.join(publicDir, rel);
      return { path: candidate };
    });
    build.onResolve({ filter: /^JSZip$/ }, () => ({ path: 'JSZip', external: true }));
  },
};
// Redirect extension-local `../lib/X` to the global `src/client/lib/X`.
// This fork relocated shared extension libs there; deps still import the
// legacy `../lib/...` path. Only fires when the local path is missing, so
// genuine local files are never touched.
const redirectExtensionLib = {
  name: 'redirect-extension-lib' as const,
  setup(build: Bun.PluginBuilder) {
    build.onResolve({ filter: /^\.{1,2}\// }, (args: Bun.OnResolveArgs) => {
      const isLib = args.path === '../lib' || args.path.startsWith('../lib/');
      if (!isLib) return undefined;
      const resolved = path.resolve(args.resolveDir, args.path);
      if (fs.existsSync(resolved)) return undefined;
      const rel = args.path.slice('../lib'.length).replace(/^\//, '');
      const globalPath = path.join(publicDir, 'lib', rel);
      if (fs.existsSync(globalPath)) return { path: globalPath };
      return undefined;
    });
  },
};

async function buildOrFail(label: string, opts: Bun.BuildConfig) {
  const res = await Bun.build(opts);
  if (!res.success) {
    console.error(`FAILED: ${label}`);
    for (const log of res.logs) console.error(log);
    process.exit(1);
  }
  return res;
}

async function main() {
  // [1/4] lib bundle → dist/lib.js (third-party libs, served as a shared module)
  const libRes = await buildOrFail('[1/4] Bundling lib.ts → dist/lib.js', {
    entrypoints: [path.join(publicDir, 'lib.ts')],
    outdir: distDir,
    target: 'browser',
    format: 'esm',
    minify: { identifiers: false, whitespace: true },
    plugins: [sharedFramework, redirectExtensionLib],
  });
  console.log(`  → dist/lib.js (${(libRes.outputs[0].size / 1024).toFixed(0)} KB)`);

  // [2/4] app shell → dist/script.js (monolith; /lib.js + /script.js stay external hosts)
  const scriptRes = await buildOrFail('[2/4] Bundling script.ts → dist/script.js', {
    entrypoints: [path.join(publicDir, 'script.ts')],
    outdir: distDir,
    target: 'browser',
    format: 'esm',
    minify: { identifiers: false, whitespace: true },
    plugins: [sharedFramework, redirectExtensionLib],
    external: [/^\/(lib|script)\.js$/],
  });
  console.log(`  → dist/script.js (${(scriptRes.outputs[0].size / 1024).toFixed(0)} KB)`);

  // [3/4] login page module → dist/scripts/login.js (loaded standalone by login.html)
  const loginEntry = path.join(publicScripts, 'login.ts');
  if (fs.existsSync(loginEntry)) {
    await buildOrFail('[3/4] Bundling login.ts → dist/scripts/login.js', {
      entrypoints: [loginEntry],
      outdir: path.join(distDir, 'scripts'),
      target: 'browser',
      format: 'esm',
    minify: { identifiers: false, whitespace: true },
    plugins: [sharedFramework, redirectExtensionLib],
      external: [/^\/(lib|script)\.js$/],
    });
    console.log('  → dist/scripts/login.js');
  }

  // [4/4] built-in extensions → client/extensions/<name>/index.js (served from source)
  const extDirs = readdirSync(extRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  let built = 0;
  let skipped = 0;
  for (const name of extDirs) {
    const ep = path.join(extRoot, name, 'index.ts');
    if (!fs.existsSync(ep)) {
      skipped++;
      continue;
    }
    await buildOrFail(`[4/4] Extension: ${name}`, {
      entrypoints: [ep],
      outdir: path.join(extRoot, name),
      target: 'browser',
      format: 'esm',
    minify: { identifiers: false, whitespace: true },
    plugins: [sharedFramework, redirectExtensionLib],
      external: [/^\/(lib|script)\.js$/],
    });
    built++;
    console.log(`  → extensions/${name}/index.js`);
  }
  console.log(`Extensions: ${built} built, ${skipped} skipped (no index.ts)`);

  console.log('===== Frontend Build complete =====');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
