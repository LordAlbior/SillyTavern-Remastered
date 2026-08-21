import { test, expect } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";

const SRC = resolve(import.meta.dir, "../../src");

// Same specifiers the codemod rewrites. Relative only; absolute "/..." excluded.
const reFromTs = /((?:\bimport\b|\bexport\b)[^;]*?\bfrom\s*)(['"])(\.\.?\/[^'"]*?)(?<!\.d)\.tsx?\2/g;
const reDynTs = /(\bimport\s*\(\s*)(['"])(\.\.?\/[^'"]*?)(?<!\.d)\.tsx?\2(\s+as\s+[^)]*)?(\s*\))/g;
const reSideTs = /(\bimport\s+)(['"])(\.\.?\/[^'"]*?)(?<!\.d)\.tsx?\2/g;
const reFromJs = /((?:\bimport\b|\bexport\b)[^;]*?\bfrom\s*)(['"])(\.\.?\/[^'"]*?\.jsx?)\2/g;
const reDynJs = /(\bimport\s*\(\s*)(['"])(\.\.?\/[^'"]*?\.jsx?)\2(\s+as\s+[^)]*)?(\s*\))/g;
const reSideJs = /(\bimport\s+)(['"])(\.\.?\/[^'"]*?\.jsx?)\2/g;
// Absolute "/..." shell-specifiers. Strip .js/.ts too (resolved via tsconfig paths + bundler plugin).
const reFromAbs = /((?:\bimport\b|\bexport\b)[^;]*?\bfrom\s*)(['"])(\/(?!\*|\/)[^'"]*?)\.(?:tsx?|jsx?)\2/g;
const reDynAbs = /(\bimport\s*\(\s*)(['"])(\/(?!\*|\/)[^'"]*?)\.(?:tsx?|jsx?)\2(\s+as\s+[^)]*)?(\s*\))/g;
const reSideAbs = /(\bimport\s+)(['"])(\/(?!\*|\/)[^'"]*?)\.(?:tsx?|jsx?)\2/g;
// Build tool + server route/response strings intentionally keep ".js" (served at /script.js).
const absSkip: Record<string, true> = { "build-frontend.ts": true, "server-main.ts": true };

function hasTsSource(dir: string, spec: string): boolean {
  const base = spec.replace(/\.jsx?$/, "").replace(/\.tsx?$/, "");
  return existsSync(resolve(dir, `${base}.ts`)) || existsSync(resolve(dir, `${base}.tsx`));
}

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkTs(p));
    else if (/\.tsx?$/.test(e.name) && !/\.d\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}

function lineAt(s: string, idx: number): number {
  return s.slice(0, idx).split("\n").length;
}

test("relative import specifiers are extensionless in src", () => {
  const violations: string[] = [];
  for (const f of walkTs(SRC)) {
    const dir = dirname(f);
    const s = readFileSync(f, "utf8");
    const rel = f.replace(SRC, "<src>");
    const add = (idx: number | undefined, spec: string) =>
      violations.push(`${rel}:${lineAt(s, idx ?? 0)}: ${spec}`);
    for (const m of s.matchAll(reFromTs)) add(m.index, m[3]);
    for (const m of s.matchAll(reDynTs)) add(m.index, m[3]);
    for (const m of s.matchAll(reSideTs)) add(m.index, m[3]);
    for (const m of s.matchAll(reFromJs)) if (hasTsSource(dir, m[3])) add(m.index, m[3]);
    for (const m of s.matchAll(reDynJs)) if (hasTsSource(dir, m[3])) add(m.index, m[3]);
    for (const m of s.matchAll(reSideJs)) if (hasTsSource(dir, m[3])) add(m.index, m[3]);
  }
  expect(violations).toEqual([]);
});

test("/-absolute import specifiers are extensionless in src", () => {
  const violations: string[] = [];
  for (const f of walkTs(SRC)) {
    const base = f.split(/[\\/]/).pop();
    if (base && absSkip[base]) continue;
    const s = readFileSync(f, "utf8");
    const rel = f.replace(SRC, "<src>");
    const add = (idx: number | undefined, spec: string) =>
      violations.push(`${rel}:${lineAt(s, idx ?? 0)}: ${spec}`);
    for (const m of s.matchAll(reFromAbs)) add(m.index, m[3]);
    for (const m of s.matchAll(reDynAbs)) add(m.index, m[3]);
    for (const m of s.matchAll(reSideAbs)) add(m.index, m[3]);
  }
  expect(violations).toEqual([]);
});
