// Thin kernel seam wrapping getContext for the unified-extension-system
// client host. The host injects its own context implementation by overriding
// this module's export; everything else imports the context from here so the
// seam has exactly one definition point.
export * from "/app/systems/shared/st-context";
import { getContext } from "/app/systems/shared/st-context";

export type AppContext = ReturnType<typeof getContext>;

/** Typed alias used by systems and the unified-extension-system host. */
export const ctx = getContext as () => AppContext;
