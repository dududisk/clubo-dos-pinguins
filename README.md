# 🐧 Clube dos Pinguins

[English](README.en.md) · Português

Uma ilha no navegador onde **cada agente de IA vira um pinguim**. Abra o Claude Code e um pinguim nasce na praça:

| O agente está... | O pinguim... |
|---|---|
| **Trabalhando** (rodando uma ferramenta: `Bash`, `Edit`...) | senta numa mesa com cadeira e PC aceso, com um balão mostrando a ferramenta |
| **Pensando** (o modelo está gerando a resposta) | senta num banco da praça lendo um livro |
| **Ocioso** (terminou o turno) | passeia pela ilha |
| **Terminou** (sessão ou subagente acabou) | caminha até o mar e vai embora |

Cada sessão aparece com o nome da pasta do projeto, e cada subagente (`Explore`, `Plan`...) vira um pinguim próprio. Clique num pinguim para ver estado, ferramenta, comando/arquivo e o último sinal.

> Demo (agentes fictícios, sem instalar nada): `https://dududisk.github.io/clubo-dos-pinguins/` — também em `http://127.0.0.1:8787/?demo`.

## Começar

Precisa de **Node 20.11+** e `curl` (já vêm no Windows 11, macOS e Linux; no Windows o Claude Code usa Git Bash).

```bash
npx clube-dos-pinguins
```

Na primeira vez ele mostra o que mudaria no seu `~/.claude/settings.json` (só **adiciona** hooks, com cópia de segurança em `settings.json.bak-pinguins`) e pergunta se pode instalar. Depois abra **http://127.0.0.1:8787** e inicie uma sessão do Claude Code (sessões já abertas só passam a usar os hooks depois de reiniciadas).

Sem o npm, a partir do código: `git clone https://github.com/dududisk/clubo-dos-pinguins.git && cd clubo-dos-pinguins && npm start`.

Hooks manualmente: `npx clube-dos-pinguins hooks` mostra o que mudaria · `--yes` aplica · `--remove` desfaz · aceita outro arquivo, por exemplo `.claude/settings.local.json` para valer só num projeto.

## Privacidade e segurança

- Tudo roda **na sua máquina**: o servidor escuta só em `127.0.0.1`, recusa requisições com `Origin`/`Host` estranhos e guarda o estado só em memória. Nada é enviado para fora.
- Os hooks mandam ao servidor local o JSON do evento. O **balão** mostra só o nome da ferramenta; o **comando ou arquivo** (`detail`) só aparece ao clicar no pinguim. Se você compartilha a tela, evite clicar com comandos sensíveis visíveis.
- Os hooks são assíncronos e silenciosos: não atrasam o Claude e não dão erro se o servidor estiver desligado.
- Texto vindo dos agentes é sempre exibido como texto, nunca como HTML.

## Outras ferramentas de IA

Qualquer coisa que consiga fazer um `POST` aparece na praça:

```bash
curl -X POST http://127.0.0.1:8787/event -d '{"id":"meu-agente","name":"Codex","state":"working","tool":"Bash","detail":"npm test"}'
```

`state`: `idle` | `thinking` | `working` | `gone`. `tool` e `detail` são opcionais. O servidor também entende o JSON dos hooks do Claude Code (`PreToolUse`, `Stop`, `SubagentStart`...), veja `bridge.js`.

## Detalhes do comportamento

- Quem trabalha **fica na mesa ~10 s depois de parar**: entre uma ferramenta e outra o estado oscila, e sem isso o pinguim viveria indo e voltando do banco.
- Mesas e bancos são limitados (4 de cada): quem não consegue vaga continua passeando e senta quando uma liberar.
- Máximo de 12 pinguins na praça; quem some sem avisar (30 min sem nenhum sinal) é removido.
- A página reconecta sozinha se o servidor reiniciar.
- Limite conhecido: hooks assíncronos podem chegar fora de ordem em ferramentas muito rápidas; o próximo evento corrige o estado.

## Custo: R$ 0

Tudo local, Node sem dependências (`http` + SSE), Canvas 2D puro sem build, sprites desenhados por código, estado em memória. A demo pública é só `web/` em hospedagem estática gratuita (GitHub Pages).

## Personalizar e desenvolver

- **Mapa:** é o texto de `web/map.js` (uma letra por tile); o canvas e a escala se ajustam sozinhos. `npm run check` valida (linhas do mesmo tamanho, nada isolado, vagas alcançáveis) e testa pinguins, ponte de eventos e instalador.
- **Arte:** `web/art.js`. `?debug` abre pinguins falsos com botões; `?demo` roda a demo.
- **Arquivos:** `cli.js` (comando), `server.js` (HTTP + SSE), `bridge.js` (evento → estado), `install.js` (hooks), `web/town.js` (pinguins, vagas, caminhos), `web/main.js` (tela).
- Veja o [CONTRIBUTING.md](CONTRIBUTING.md). Ideias em aberto: ciclo dia/noite, sons, mais mesas e bancos, visual da ilha.

## Créditos e aviso

Inspirado no visual da praça do Club Penguin. **Projeto independente, sem relação com a Disney.** Toda a arte é original e desenhada por código; não há nenhum asset, logo ou mapa do jogo no repositório. Licença [MIT](LICENSE).
