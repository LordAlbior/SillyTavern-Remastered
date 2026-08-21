// Re-export shim for the legacy global script `world-info.ts`.
// Real implementation moved to `app/systems/world-info/index.ts` (client-monolith-decomposition).
// Modern `src/client/extensions/` runtime and other `scripts/*.ts` files import this via the
// `/scripts/world-info` alias or relative `./world-info`; this shim preserves those paths.
export * from "../app/systems/world-info/index";
