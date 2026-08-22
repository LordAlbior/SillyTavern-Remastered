import path from "node:path";
import fs from "node:fs";
import { readdirSync, cpSync } from "node:fs";

const publicDir = path.join(import.meta.dir, "client");
const distDir = path.join(publicDir, "dist");
const publicScripts = path.join(publicDir, "scripts");
// Extension SOURCE lives in src/client/extensions (tracked). The build rewrites
// their /scripts/X.js imports to /script.js, then emits built index.js into the
// same dir (gitignored; served at /scripts/extensions by server-main.ts).
const extSrc = path.join(publicDir, "extensions");
const extOut = path.join(publicDir, "extensions");
// Temporary copy of extSrc where imports are rewritten to the monolith before
// bundling (see rewriteExtensionImports).
const extBuild = path.join(publicDir, ".extensions_build");

fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(extOut, { recursive: true });

console.log("===== Frontend Build → client/dist/ =====");

// Resolves absolute specifiers used inside the client source:
//   /scripts/X.js | /scripts/X.ts  -> src/client/scripts/X.ts (bundled in)
//   /script.ts  | /script.js      -> the shell entrypoint itself (self-reference)
//   /lib.js                        -> external shared module
// Without this, Bun cannot resolve the absolute /script.ts and /scripts/*.ts
// imports that exist in the codebase.
const shellResolve = {
  name: "shell-resolve" as const,
  setup(build: Bun.PluginBuilder) {
    build.onResolve({ filter: /^JSZip$/ }, () => ({ path: "JSZip", external: true }));
    build.onResolve({ filter: /^\// }, (args: Bun.OnResolveArgs) => {
      const p = args.path;
      if (p === "/lib" || p === "/lib.ts" || p === "/lib.js") return { path: "/lib.js", external: true };
      if (p === "/script" || p === "/script.ts" || p === "/script.js") {
        return { path: path.join(publicDir, "script.ts") };
      }
      const base = path.join(publicDir, p.slice(1).replace(/\.(ts|js)$/, ""));
      const tsPath = `${base}.ts`;
      if (fs.existsSync(tsPath)) return { path: tsPath };
      const jsPath = `${base}.js`;
      if (fs.existsSync(jsPath)) return { path: jsPath };
      const idxTs = path.join(base, "index.ts");
      if (fs.existsSync(idxTs)) return { path: idxTs };
      const idxJs = path.join(base, "index.js");
      if (fs.existsSync(idxJs)) return { path: idxJs };
      if (fs.existsSync(base)) return { path: base };
      return undefined;
    });
  },
};

// Extensions import shared state from /script.js and /lib.js. Those are
// absolute specifiers; Bun's config `external` does not intercept absolute
// paths, so we mark them external via a plugin (catch-all `/^\//` filter is
// the one proven to fire for absolute specifiers).
const extResolve = {
  name: "ext-resolve" as const,
  setup(build: Bun.PluginBuilder) {
    build.onResolve({ filter: /^JSZip$/ }, () => ({ path: "JSZip", external: true }));
    build.onResolve({ filter: /^\// }, (args: Bun.OnResolveArgs) => {
      if (args.path === "/lib" || args.path === "/lib.ts" || args.path === "/lib.js") return { path: "/lib.js", external: true };
      if (args.path === "/script" || args.path === "/script.ts" || args.path === "/script.js") return { path: "/script.js", external: true };
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

// Copy every non-TS file from an extension's source dir into its build output
// (manifest.json, css, html, icons, bundled .js libs, …). The bundler only
// emits index.js; these static assets are served alongside it.
function copyStatic(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyStatic(s, d);
    else if (!ent.name.endsWith(".ts")) fs.copyFileSync(s, d);
  }
}

// Extensions import shared state (oai_settings, eventSource, getContext, …) from
// the app shell. We rewrite their `/scripts/X.js` imports to `/script.js` so
// there is exactly ONE instance of every stateful module — bundling those
// modules per-extension duplicates state and re-binds eventSource/DOM handlers,
// which caused the infinite change-event loop. Bun does not consult onResolve
// plugins for absolute `/`-prefixed specifiers, so this is a source rewrite.
function rewriteExtensionImports(srcDir: string) {
  for (const ent of readdirSync(srcDir, { withFileTypes: true })) {
    const p = path.join(srcDir, ent.name);
    if (ent.isDirectory()) {
      rewriteExtensionImports(p);
    } else if (ent.name.endsWith(".ts")) {
      let src = fs.readFileSync(p, "utf8");
      // /scripts/X.js  -> /script.js   (shared monolith, single instance)
      src = src.replace(/(["'])\/scripts\/[\w\-/]+\.?(?:js|ts)?\1/g, "$1/script$1");
      // ../lib/X (if unresolved in tree) -> /lib.js (shared)
      src = src.replace(/(["'])\.\.\/lib(?:[\w\-/]*)?\.?(?:js|ts)?\1/g, "$1/lib$1");
      fs.writeFileSync(p, src);
    }
  }
}

async function main() {
  // [1/4] third-party libs → dist/lib.js (shared module, external to everything)
  const libRes = await buildOrFail("[1/4] Bundling lib.ts → dist/lib.js", {
    entrypoints: [path.join(publicDir, "lib.ts")],
    outdir: distDir,
    target: "browser",
    format: "esm",
    minify: { identifiers: false, whitespace: true },
    plugins: [shellResolve],
    external: [/^\/(lib|script)(\.js|\.ts)?$/],
  });
  console.log(`  → dist/lib.js (${(libRes.outputs[0].size / 1024).toFixed(0)} KB)`);

  // [2/4] app shell → dist/script.js. Bundles every ./scripts/* and /scripts/*
  // module into ONE monolith. Only /lib.js is external (separate shared file).
  // Every stateful module therefore exists exactly once and is shared with
  // extensions (script.ts re-exports them).
  const scriptRes = await buildOrFail("[2/4] Bundling script.ts → dist/script.js", {
    entrypoints: [path.join(publicDir, "script.ts")],
    outdir: distDir,
    target: "browser",
    format: "esm",
    minify: { identifiers: false, whitespace: true },
    plugins: [shellResolve],
    external: [/^\/(lib|script)(\.js|\.ts)?$/],
  });
  console.log(`  → dist/script.js (${(scriptRes.outputs[0].size / 1024).toFixed(0)} KB)`);

  // [3/4] login page → dist/scripts/login.js (standalone, self-contained)
  const loginEntry = path.join(publicScripts, "login.ts");
  if (fs.existsSync(loginEntry)) {
    await buildOrFail("[3/4] Bundling login.ts → dist/scripts/login.js", {
      entrypoints: [loginEntry],
      outdir: path.join(distDir, "scripts"),
      target: "browser",
      format: "esm",
      minify: { identifiers: false, whitespace: true },
      plugins: [shellResolve],
    external: [/^\/(lib|script)(\.js|\.ts)?$/],
    });
    console.log("  → dist/scripts/login.js");
  }

  // [4/4] built-in extensions → client/extensions/<name>/index.js. They import
  // shared state from /script.js (rewritten from /scripts/X.js) — single
  // instance, no duplication.
  fs.rmSync(extBuild, { recursive: true, force: true });
  cpSync(extSrc, extBuild, { recursive: true });
  rewriteExtensionImports(extBuild);

  const extDirs = readdirSync(extBuild, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  let built = 0;
  let skipped = 0;
  for (const name of extDirs) {
    const ep = path.join(extBuild, name, "index.ts");
    if (!fs.existsSync(ep)) {
      skipped++;
      continue;
    }
    await buildOrFail(`[4/4] Extension: ${name}`, {
      entrypoints: [ep],
      outdir: path.join(extOut, name),
      target: "browser",
      format: "esm",
      minify: { identifiers: false, whitespace: true },
      plugins: [extResolve],
    external: [/^\/(lib|script)(\.js|\.ts)?$/],
    });
    copyStatic(path.join(extSrc, name), path.join(extOut, name));
    built++;
    console.log(`  → extensions/${name}/index.js`);
  }
  console.log(`Extensions: ${built} built, ${skipped} skipped (no index.ts)`);

  fs.rmSync(extBuild, { recursive: true, force: true });
  console.log("===== Frontend Build complete =====");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
