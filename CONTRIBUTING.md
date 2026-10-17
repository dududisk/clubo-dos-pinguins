# Contribuindo

Obrigado por querer ajudar! O projeto é pequeno de propósito: Node sem dependências, Canvas 2D puro, sem build.

## Rodando

```bash
git clone https://github.com/dududisk/clubo-dos-pinguins.git && cd clubo-dos-pinguins
npm start            # http://127.0.0.1:8787
npm run check        # mapa, pinguins, ponte de eventos e instalador de hooks
```

- `http://127.0.0.1:8787/?debug` abre pinguins falsos com botões para trocar o estado.
- `http://127.0.0.1:8787/?demo` roda a demo sem servidor de eventos.
- `?hora=22` (qualquer hora de 0 a 24) força a luz do dia/noite, útil para testar a arte em cada horário.

## O que é bem-vindo

- **Mapa:** edite as linhas de `web/map.js` (o tamanho do canvas e a escala se ajustam sozinhos) e rode `npm run check`: ele recusa linhas de tamanhos diferentes, áreas isoladas e vagas inalcançáveis.
- **Arte:** tudo é desenhado por código em `web/art.js`. **Só arte original**: não envie assets, mapas ou logos do Club Penguin/Disney.
- **Outras ferramentas de IA:** basta mandar `POST /event` com `{ id, name, state, tool?, detail? }` (veja o README). Hooks prontos para outras ferramentas são ótimos PRs.
- **Ideias em aberto:** ciclo dia/noite, sons, mais mesas e bancos, visual da ilha.

## Regras do projeto

1. **Custo zero:** nada de servidor pago, banco, CDN ou dependência nova para algo que poucas linhas resolvem.
2. **A lógica fica fora do DOM:** `web/town.js` e `bridge.js` não tocam em navegador nem rede; por isso são testáveis em `check.js`. Lógica nova leva um teste curto lá.
3. **Texto vindo de agentes é dado, não HTML:** na página use sempre `textContent`.
4. PRs pequenos e focados.

## Com o Claude Code

A pasta `.claude/agents/` tem três subagentes (`town-engine`, `bridge-hooks`, `pixel-artist`) com as regras acima, caso você use o Claude Code para contribuir.
