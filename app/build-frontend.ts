import path from "node:path";
import fs from "node:fs";
import { Glob } from "bun";

const publicDir = path.join(import.meta.dir, "public");
const distDir = path.join(publicDir, "dist");

console.log("===== Frontend Build =====");
fs.mkdirSync(distDir, { recursive: true });

// Edge cases: JSZip (referenced via require in epub.min.js)
const edgeCases = {
  name: "edge-cases",
  setup(build: any) {
    // /lib.js (npm bundle) stays external — browser loads it as its own module
    build.onResolve({ filter: /^\/lib\.js$/ }, () => ({
      path: "/lib.js",
      external: true,
    }));
    build.onResolve({ filter: /^JSZip$/ }, () => ({
      path: "JSZip",
      external: true,
    }));
  },
};

// Step 1: Bundle lib.ts (npm deps)
const libResult = await Bun.build({
  entrypoints: [path.join(publicDir, "lib.ts")],
  outdir: distDir,
  target: "browser",
  plugins: [edgeCases],
});
if (!libResult.success) {
  for (const log of libResult.logs) console.error(log);
  process.exit(1);
}

// Step 2: Transpile all frontend .ts files (except lib.ts) as individual ESM modules
// external: ['*'] keeps imports as external ESM imports — browser handles circular deps
const scriptDir = path.join(publicDir, "scripts");
const glob = new Glob("**/*.ts");
const scriptFiles = Array.from(glob.scanSync({ cwd: scriptDir, absolute: false })).map((f) => path.join(scriptDir, f));

const scriptResult = await Bun.build({
  entrypoints: [path.join(publicDir, "script.ts"), ...scriptFiles],
  root: publicDir,
  outdir: distDir,
  target: "browser",
  external: ["*"],
  plugins: [edgeCases],
});
if (!scriptResult.success) {
  for (const log of scriptResult.logs) console.error(log);
  process.exit(1);
}

// Step 3: Rewrite .ts → .js in all transpiled output files' imports
// Static imports, dynamic imports, and re-exports (export { x } from './y.ts')
let rewritten = 0;
for (const output of scriptResult.outputs) {
  const code = await Bun.file(output.path).text();
  const updated = code
    .replace(/(import\s+[^'"]*?['"])(\.\.?\/[^'"]+)\.ts(['"])/g, "$1$2.js$3")
    .replace(/(import\s*\(['"])(\.\.?\/[^'"]+)\.ts(['"]\s*\))/g, "$1$2.js$3")
    .replace(/(import\s+[^'"]*?['"])(\/[^'"]+)\.ts(['"])/g, "$1$2.js$3")
    .replace(/(import\s*\(['"])(\/[^'"]+)\.ts(['"]\s*\))/g, "$1$2.js$3")
    .replace(/(export\s*\{[^}]*\}\s*from\s*['"])(\.\.?\/[^'"]+)\.ts(['"])/g, "$1$2.js$3")
    .replace(/(export\s*\{[^}]*\}\s*from\s*['"])(\/[^'"]+)\.ts(['"])/g, "$1$2.js$3")
    .replace(/(export\s*\*\s*from\s*['"])(\.\.?\/[^'"]+)\.ts(['"])/g, "$1$2.js$3")
    .replace(/(export\s*\*\s*from\s*['"])(\/[^'"]+)\.ts(['"])/g, "$1$2.js$3");
  if (updated !== code) {
    await Bun.write(output.path, updated);
    rewritten++;
  }
}

// Step 4: Bundle login.ts separately for the login page
const loginResult = await Bun.build({
  entrypoints: [path.join(publicDir, "scripts", "login.ts")],
  root: publicDir,
  outdir: distDir,
  target: "browser",
  external: ["*"],
  plugins: [edgeCases],
});
if (!loginResult.success) {
  for (const log of loginResult.logs) console.error(log);
  process.exit(1);
}

// Rewrite .ts → .js in login bundle output too
for (const output of loginResult.outputs) {
  const code = await Bun.file(output.path).text();
  const updated = code
    .replace(/(import\s+[^'"]*?['"])(\.\.?\/[^'"]+)\.ts(['"])/g, "$1$2.js$3")
    .replace(/(import\s*\(['"])(\.\.?\/[^'"]+)\.ts(['"]\s*\))/g, "$1$2.js$3")
    .replace(/(import\s+[^'"]*?['"])(\/[^'"]+)\.ts(['"])/g, "$1$2.js$3")
    .replace(/(import\s*\(['"])(\/[^'"]+)\.ts(['"]\s*\))/g, "$1$2.js$3");
  if (updated !== code) {
    await Bun.write(output.path, updated);
    rewritten++;
  }
}

// Report
for (const output of libResult.outputs)
  console.log(`  → ${path.relative(distDir, output.path)} (${(output.size / 1024).toFixed(0)} KB)`);
for (const output of scriptResult.outputs) {
  const rel = path.relative(distDir, output.path);
  if (rel === "script.js")
    console.log(`  → ${rel} (${(output.size / 1024).toFixed(0)} KB, ${scriptResult.outputs.length - 1} modules)`);
}
console.log(`  → scripts/ (${scriptResult.outputs.length - 1} transpiled files)`);
for (const output of loginResult.outputs)
  console.log(`  → ${path.relative(distDir, output.path)} (${(output.size / 1024).toFixed(0)} KB)`);
console.log(`Rewrote ${rewritten} files (imports: .ts → .js)`);
console.log("===== Build complete =====");
