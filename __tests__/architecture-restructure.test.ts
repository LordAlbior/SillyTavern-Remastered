import { describe, it, expect } from "bun:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

describe("architecture restructure", () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  it("has src/server/server-main.ts", () => {
    expect(existsSync(path.join(repoRoot, "src", "server", "server-main.ts"))).toBeTrue();
  });

  it("has src/pages/index.html", () => {
    expect(existsSync(path.join(repoRoot, "src", "pages", "index.html"))).toBeTrue();
  });

  it("has src/client/extensions", () => {
    expect(existsSync(path.join(repoRoot, "src", "client", "extensions"))).toBeTrue();
  });

  it("has compatibility/current.ts", () => {
    expect(existsSync(path.join(repoRoot, "compatibility", "current.ts"))).toBeTrue();
  });
});
