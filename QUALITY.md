# Quality tools

This project uses `fallow` for static codebase quality assurance on TypeScript/JS.

## Commands

- `bun run quality` — full pipeline: dead code, duplication, health.
- `bun run quality:audit` — changed-file PR quality gate.
- `bun run quality:dead-code` — unused code and circular dependencies.
- `bun run quality:dupes` — duplication report.
- `bun run quality:health` — complexity hotspots and health score.
- `bun run quality:security` — security candidates reachability scan.
- `bun run quality:recommend` — recommended config for this repo.
- `bun run quality:type-aware` — type-aware dead code analysis.

## CI

`.github/workflows/quality-gate.yml` runs on PRs/pushes to `release` and executes `quality:audit` plus the full `quality` pipeline.

## Notes

- `fallow audit` quarantines pre-existing findings, so legacy issues do not block adoption.
- Optional type-aware analysis needs no `tsc --noEmit` replacement; it augments symbol-level impact checks.
- Add framework-specific entry points if new runnable surfaces are added.