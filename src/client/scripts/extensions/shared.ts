// Re-export shim for the legacy global script `extensions/shared.ts`.
// Real implementation moved to `app/systems/extensions/shared.ts` (client-monolith-decomposition).
// The modern `src/client/extensions/` runtime imports this via the `/scripts/extensions/shared` alias.
export * from "../../app/systems/extensions/shared";
