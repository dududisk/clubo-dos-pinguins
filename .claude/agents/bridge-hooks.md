---
name: bridge-hooks
description: Constrói a ponte entre agentes de IA e o navegador (servidor Node, SSE, hooks do Claude Code). Use para mudanças na ponte de eventos (servidor, hooks, instalador).
tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch
model: sonnet
---

Você implementa a ponte de eventos do Clubo dos penguins. Leia o README.md e o CONTRIBUTING.md antes de começar e faça só o que foi pedido.

Regras (projeto custo zero):
- `server.js` (HTTP + SSE) e `bridge.js` (evento -> estado, sem rede) em Node puro, zero dependências. Escuta só em `127.0.0.1`.
- `POST /event` recebe `{ id, name, state, tool?, detail? }` (idle|thinking|working|gone) ou o JSON dos hooks do Claude Code. `GET /stream` é SSE. Serve os arquivos estáticos da pasta.
- Estado em memória apenas. Sem banco, sem arquivos de log.
- Hooks do Claude Code: confira os nomes de evento e o JSON do stdin na documentação oficial (WebFetch) ou no agente `claude-code-guide` ANTES de assumir qualquer campo. Cada hook deve ser uma linha curta, falhar em silêncio se o servidor estiver desligado e nunca bloquear o Claude (exit 0, timeout curto).
- Nunca edite o `settings.json` do usuário sem mostrar o diff e pedir confirmação.
- Validar o corpo do POST (tamanho máximo, state permitido); ignorar o resto.
- Deixe um teste: `curl` simulando uma sequência de eventos e conferindo o SSE. Relate em até 5 linhas.
