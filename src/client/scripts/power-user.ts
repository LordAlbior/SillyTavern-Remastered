// Re-export shim for the legacy global script `power-user.ts`.
// Real implementation moved to `app/systems/power-user/index.ts` (client-monolith-decomposition).
// Modern `src/client/extensions/` runtime and other `scripts/*.ts` files import this via the
// `/scripts/power-user` alias or relative `./power-user`; this shim preserves those paths.
export * from "../app/systems/power-user/index";
