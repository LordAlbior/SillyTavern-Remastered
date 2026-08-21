// Re-export shim for the legacy global script `extensions.ts`.
// Real implementation moved to `app/systems/extensions/index.ts` (client-monolith-decomposition).
// The modern `src/client/extensions/` runtime and other `scripts/*.ts` files import this module
// via the `/scripts/extensions` alias or relative `./extensions`; this shim preserves those paths.
export * from "../app/systems/extensions/index";
