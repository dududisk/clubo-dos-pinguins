# 🐧 Clube dos Pinguins ("Penguin Club")

English · [Português](README.md)

An island in your browser where **every AI agent becomes a penguin**. Open Claude Code and a penguin is born in the plaza:

| The agent is... | The penguin... |
|---|---|
| **Working** (running a tool: `Bash`, `Edit`...) | sits at a desk with a lit-up PC and a bubble showing the tool |
| **Thinking** (the model is generating) | sits on a plaza bench reading a book |
| **Idle** (turn finished) | wanders around the island |
| **Done** (session or subagent ended) | walks to the sea and leaves |

Each session shows up under its project folder name; each subagent (`Explore`, `Plan`...) gets its own penguin. Click a penguin to see state, tool, command/file and last signal.

> Demo (fake agents, nothing to install): `https://dududisk.github.io/clubo-dos-pinguins/`, also at `http://127.0.0.1:8787/?demo`.

## Quick start

Needs **Node 20.11+** and `curl`.

```bash
npx clubo-dos-pinguins
```

On first run it shows what it would change in your `~/.claude/settings.json` (it only **adds** hooks, with a backup at `settings.json.bak-pinguins`) and asks before installing. Then open **http://127.0.0.1:8787** and start a Claude Code session (already-open sessions only pick up the hooks after a restart).

From source: `git clone https://github.com/dududisk/clubo-dos-pinguins.git && cd clubo-dos-pinguins && npm start`.
Hooks by hand: `npx clubo-dos-pinguins hooks` (preview) · `--yes` (apply) · `--remove` (undo) · optional file argument, e.g. `.claude/settings.local.json` for one project only.

## Privacy and security

- Everything runs **on your machine**: the server listens on `127.0.0.1` only, rejects odd `Origin`/`Host` headers and keeps state in memory. Nothing leaves your computer.
- The bubble shows only the tool name; the command/file (`detail`) is shown only when you click a penguin.
- Hooks are async and silent: they never slow Claude down and never error if the server is off.
- Agent-provided text is always rendered as text, never HTML.

## Other AI tools

Anything that can `POST` can show up in the plaza:

```bash
curl -X POST http://127.0.0.1:8787/event -d '{"id":"my-agent","name":"Codex","state":"working","tool":"Bash","detail":"npm test"}'
```

`state`: `idle` | `thinking` | `working` | `gone`; `tool` and `detail` are optional. Claude Code hook payloads are understood too (see `bridge.js`).

## Notes

- Workers stay at the desk ~10 s after stopping, because the state flips between consecutive tool calls.
- 4 desks and 4 benches; whoever finds no free seat keeps wandering. Max 12 penguins; agents silent for 30 min are removed.
- Known limit: async hooks can arrive out of order for very fast tools; the next event fixes the state.
- Cost: $0. Local only, zero dependencies, no build, art drawn in code.
- Develop: `npm run check`; map = text in `web/map.js`; see [CONTRIBUTING.md](CONTRIBUTING.md) (Portuguese).

## Credits

Inspired by the look of Club Penguin's town. **Independent project, not affiliated with Disney.** All art is original and drawn in code; no game assets, logos or maps are included. [MIT](LICENSE).
