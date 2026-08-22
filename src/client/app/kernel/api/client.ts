// Kernel HTTP seam. The shell's request helpers are re-exported here so
// systems import HTTP from the kernel instead of reaching into script.ts.
// The global CSRF prefilter ($.ajaxPrefilter) stays in script.ts as a
// one-time bootstrap side-effect.
export { getRequestHeaders } from "/app/script";
