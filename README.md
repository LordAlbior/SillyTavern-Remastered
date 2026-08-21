# SillyTavern: Remastered

> [!NOTE]
> **Work in Progress.** This project is a work in progress. A list of brand-new features will be added once the rewrite is complete.

LLM Frontend for Power Users

## Repository Structure

Monorepo (Bun workspaces). Runtime user data (`data/`, `backups/`, user `plugins/`, root `config.yaml`) stays at the repo root; source lives under `app/`.

- `app/` — server, client, default config, launchers, Dockerfile (`@sillytavern/app` workspace member)
- `extensions/` — built-in UI extension packages (`@sillytavern/ext-*`, one per extension); served at `/scripts/extensions/<name>/`
- `docs/` — documentation submodule (pinned to the fork)
- `data/`, `backups/` — runtime-generated user data (git-ignored)
- `tests/toolchain/` — contract/parity tests (`bun test tests/toolchain`)

Run from the repo root: `bun install` links all workspace members; `bun run start` boots `app/server.js`.

## Resources

- GitHub: <https://github.com/LordAlbior/SillyTavern-Remastered>
- Docs: <https://docs.sillytavern.app/>
- Discord: <https://discord.gg/sillytavern>
- Reddit: <https://reddit.com/r/SillyTavernAI>

## License

AGPL-3.0
