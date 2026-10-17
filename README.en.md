# 🐧 Clubo dos penguins

English · [Português](https://github.com/dududisk/clubo-dos-pinguins/blob/main/README.md)

An island in your browser where **every AI agent becomes a penguin**. Open Claude Code and a penguin is born in the plaza:

| The agent is... | The penguin... |
|---|---|
| **Working** (running a tool: `Bash`, `Edit`...) | sits at a desk with a lit-up PC and a bubble showing the tool |
| **Thinking** (the model is generating) | sits on a plaza bench reading a book |
| **Idle** (turn finished) | wanders around the island |
| **Done** (session or subagent ended) | walks to the sea and leaves |

Each session shows up under its project folder name and each subagent gets its own penguin. Click a penguin to see the tool and details. The light follows your computer's clock (day, dusk and night, with lamps and windows lit up) and there are optional sounds, off by default; the buttons in the corner switch the time of day and turn the sound on.

**Demo (fake agents):** https://dududisk.github.io/clubo-dos-pinguins/

## Quick start

Needs **Node 20.11+** and `curl`.

```bash
npx clubo-dos-pinguins
```

On first run it shows what it would change in your `~/.claude/settings.json` (it only **adds** hooks, with a backup at `settings.json.bak-pinguins`) and asks before installing. Then open **http://127.0.0.1:8787** and start a Claude Code session (already-open sessions must be restarted).

- Undo: `npx clubo-dos-pinguins hooks --remove --yes`
- From source: `git clone https://github.com/dududisk/clubo-dos-pinguins.git && cd clubo-dos-pinguins && npm start`

## Privacy

- Everything runs on your machine (`127.0.0.1`); nothing is sent out and state is kept in memory only.
- The command or file an agent is using is shown only when you click its penguin; be careful when sharing your screen.
- Hooks are async and silent: they never slow Claude down and never error if the server is off.

## Other AI tools

Anything that can `POST` shows up in the plaza (`state`: `idle`, `thinking`, `working` or `gone`; `tool` and `detail` are optional):

```bash
curl -X POST http://127.0.0.1:8787/event -d '{"id":"my-agent","name":"Codex","state":"working","tool":"Bash"}'
```

## Contributing

`npm run check` runs the tests. See [CONTRIBUTING.md](https://github.com/dududisk/clubo-dos-pinguins/blob/main/CONTRIBUTING.md) (Portuguese).

## Notice

Inspired by the look of Club Penguin's town. **Independent project, not affiliated with Disney**: all art is original and no game assets, logos or maps are included. Font: Pixelify Sans (SIL OFL 1.1, in `web/fonts/OFL.txt`). [MIT](https://github.com/dududisk/clubo-dos-pinguins/blob/main/LICENSE) license.
