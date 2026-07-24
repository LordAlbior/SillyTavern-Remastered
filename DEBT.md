# Technical Debt Ledger

Constitution Principle IX: technical debt is tracked, not carried. Every
`TODO/FIXME/HACK/WORKAROUND/KLUDGE` and every deliberate deviation from a
Constitution MUST becomes a ticket here.

## Carried from Step 0 (001)

- **DEV-001 — TDD order deviation.** Contract/parity tests written and run green
  before implementation rather than observed-to-fail-first in some slices.
  Same pattern as Constitution Principle II expects. Tracked; not blocking.
- **DEV-002 — `no-csrf` retained.** `start:no-csrf` script kept from upstream ST.
  See DEBT-004 for the Constitution conflict.
- **DEV-003 — missing doc comments.** ~165k LOC of legacy JS lacks TSDoc/JSDoc on
  public APIs (Constitution Principle IX). Addressed incrementally during the
  per-package strictification (features 003+).

## From feature 002 (monorepo)

- **DEBT-004 — `start:no-csrf` violates Constitution Principle IV (CRITICAL).**
  Principle IV mandates `--disableCsrf` be **removed or gated behind explicit
  non-default config**. The fork retains `start:no-csrf` (inherited from Step 0 /
  upstream ST), leaving an unsafe mode as a default-adjacent script.
  - Scope: pre-existing, NOT introduced by feature 002. Feature 002 must not
    merge in a way that silently normalizes it.
  - Fix (separate Step-0 follow-up, NOT in the 002 PR): gate the flag — add a
    `security.csrf.disabled` key to `config.yaml` defaulting `false`, and have
    `server.js` only honor `--disableCsrf` when that key is explicitly `true`.
    Do not delete the escape hatch; gate it (per Principle IV wording).
  - Discovered by: `/speckit-analyze` on 002 (finding F4).
