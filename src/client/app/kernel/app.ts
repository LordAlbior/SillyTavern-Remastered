// Kernel bootstrap seam.
//
// The heavy DOM-wiring jQuery block (the app's event handlers) intentionally
// stays in the shell (script.ts): per design.md the kernel is a thin seam with
// no UI handlers. `firstLoadInit` is the kernel-side bootstrap (CSRF token,
// client version, settings, macros) and is exposed here so the shell and the
// unified-extension-system host share one bootstrap entry point.
export { firstLoadInit } from "../../script";
