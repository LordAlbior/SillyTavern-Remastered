# Quality tools and quality gate

This is the short version of how we keep this repo from slowly rotting: two automated checks that run on every PR and push to `release`. If you want the gritty details, the workflows and scripts are the real documentation; this is just the map.

## What we use

**Fallow** is our main static analysis tool. It lives in the TypeScript/JavaScript layer and looks for dead code, copied-and-pasted blocks, circular dependencies, places where complexity is sneaking up, and whether the code still respects the boundaries we care about. It also has a security mode that checks whether sensitive code can actually be reached. Think of it as a sweeper that runs while you work.

**Pa11y** handles accessibility. It boots the built frontend, runs the axe engine against the page, and fails the build on real accessibility errors. It is not trying to be a full audit — just a hard gate that keeps the UI from drifting into worse shape over time.

Together they cover the two biggest sources of slow decay: code that nobody uses or understands, and UI that only works for some users.

## Running locally

### Fallow

```bash
bun run quality              # everything at once
bun run quality:audit        # changed files only — faster for PR work
bun run quality:dead-code    # unused code and circular deps
bun run quality:dupes        # duplication report
bun run quality:health       # complexity hotspots and score
bun run quality:security     # security candidate scan
bun run quality:recommend    # suggested config for this repo
bun run quality:type-aware   # type-aware dead code analysis
```

One thing worth knowing: fallow does not replace `tsc --noEmit`. The type-aware mode is a complement, not a replacement. It uses type information to make better guesses about dead code, but it does not emit compiler diagnostics.

### Pa11y

```bash
bun run quality:a11y
```

This needs the app running on `http://localhost:8000` and Chrome available. In CI we take care of both. Locally you either need Chrome installed or you need to set up a headless browser path.

## CI quality gate

The quality gate is split across a few workflows so it is easier to tell what broke and why. Everything runs on PRs and pushes to `release`.

### Main quality gate

File: `.github/workflows/quality-gate.yml`

Two jobs run here:

- **Fallow quality gate** — checks out the repo, installs dependencies with Bun, runs the changed-file audit, then the full pipeline.
- **Accessibility gate** — checks out the repo, installs Node dependencies, installs Chrome, builds the frontend, starts the server, waits for it to come up, runs Pa11y, and uploads an HTML report as an artifact you can download from the workflow run.

### Security scans

File: `.github/workflows/security-scan.yml`

Runs Semgrep for SAST-style issues, Trivy for dependency and filesystem risks, and Spectral for secret leakage and insecure URLs in config files.

File: `.github/workflows/codeql.yml`

Runs GitHub's CodeQL analysis on the JavaScript/TypeScript code. This is the broadest net for security smells.

### Publishing

File: `.github/workflows/npm-publish.yml`

When we cut a release, this workflow publishes the package to npm. It uses Bun for install and publish. It needs the `NPM_TOKEN` secret set in the repository.

### Issue and PR automation

We have a few workflows that keep the repo tidy without manual work:

- `issues-auto-manager.yml` — labels issues based on content and adds or removes progress labels.
- `issues-updates-on-merge.yml` — marks linked issues as done when commits land on `staging` or `release`.
- `job-close-stale.yml` — closes issues and PRs that have been inactive for six months, or that are awaiting user response.
- `on-close-handler.yml` and `on-open-handler.yml` — remove pending labels when issues or PRs are opened or closed.
- `pr-auto-manager.yml` — labels PRs by size, checks for merge conflicts, and posts automatic comments.
- `pr-check-merge-conflicts.yaml` — lightweight check that stops obvious merge conflicts before they get messy.

All of these workflows use `actions/create-github-app-token@v3.2.0`. We moved off `v2` because it was tied to Node 20, and our workflows now use Node 24.

## When something breaks

**Fallow fails.** Read the report. If it is real dead code, duplication, or a circular dependency, fix it. If it is noise from generated code or a framework pattern you cannot change, adjust the config or add an ignore.

**Pa11y fails.** Download the HTML report from the workflow artifacts or run `bun run quality:a11y` locally. Fix the accessibility issue if you can. If the issue is intentional — for example, a custom widget that does not map cleanly to standard ARIA — document the exception so the next person does not spend an hour chasing it.

**Security scan fails.** Treat Semgrep and Trivy findings as actionable unless they are clearly out of scope. Spectral failures mean a secret or plaintext insecure URL was detected somewhere in the scanned config. Those are worth fixing or explicitly whitelisting.

## Adding a new check

If you want to add another tool or script:

1. Add the command to `package.json` scripts with a `quality:*` name.
2. If it belongs in CI, add it to `.github/workflows/quality-gate.yml` as a new job or step.
3. Document it here.
4. If the new tool overlaps with an existing one, remove or deprecate the older one. Two overlapping checks are just noise.

## Troubleshooting

- **Pa11y says Chrome is missing in CI.** The quality gate installs Chrome via Puppeteer before the build. If you change runners, images, or caching, make sure Chrome is still there.
- **Fallow feels slow.** Use `quality:audit` during development; it only checks changed files. Save the full `quality` pipeline for pre-push or CI.
- **npm publish workflow is failing.** Make sure `NPM_TOKEN` is set in GitHub repository secrets. The token needs publish access for this fork's package name, which is different from the upstream `sillytavern` package.
