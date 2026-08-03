/**
 * Parity contract test for the 002 monorepo `app/` move (C-002).
 *
 * RED before the move: `app/server.js` does not exist yet, so the structural
 * precondition fails. GREEN after T001-T010: the server lives under `app/` and
 * boots with identical HTTP behavior to the pre-move flat layout.
 *
 * Principle II (TDD): this test is written and observed to FAIL before the
 * implementation that makes it pass. DEBT-002 (carried from Step 0).
 */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { spawn, type Subprocess } from "bun";

const BASE = "http://127.0.0.1:8000";
let server: Subprocess | null = null;
let booted = false;

async function waitForListen(timeoutMs = 20000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return true;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

describe("002 monorepo app/ move — output parity", () => {
  it("structural: app/server.js exists after the move", () => {
    // RED before move, GREEN after T001/T003.
    expect(existsSync("app/server.js")).toBe(true);
  });

  beforeAll(async () => {
    if (!existsSync("app/server.js")) return; // skip boot if structure missing
    server = spawn(["bun", "run", "start"], {
      stdout: "ignore",
      stderr: "ignore",
      env: { ...process.env, NODE_ENV: "production" },
    });
    booted = await waitForListen();
  }, 25000);

  afterAll(() => {
    if (server) server.kill();
  });

  it("runtime: server boots and serves the app HTML with parity", async () => {
    if (!booted) throw new Error("server did not boot (app/ move incomplete)");
    const res = await fetch(`${BASE}/`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("SillyTavern");
  });

  it("runtime: API endpoint responds (ST 1.18.0 contract)", async () => {
    if (!booted) throw new Error("server did not boot (app/ move incomplete)");
    // /csrf-token is an unauthenticated ST endpoint returning JSON.
    const res = await fetch(`${BASE}/csrf-token`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.token).toBe("string");
  });

  it("runtime: default extension static asset served from app/public", async () => {
    if (!booted) throw new Error("server did not boot (app/ move incomplete)");
    // Default UI extensions live in app/public/scripts/extensions/<name>/.
    const res = await fetch(`${BASE}/scripts/extensions/assets/index.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") ?? "").toContain("javascript");
  });
});
