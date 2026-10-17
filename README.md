# 🐧 Clubo dos penguins

[English](https://github.com/dududisk/clubo-dos-pinguins/blob/main/README.en.md) · Português

Uma ilha no navegador onde **cada agente de IA vira um pinguim**. Abra o Claude Code e um pinguim nasce na praça:

| O agente está... | O pinguim... |
|---|---|
| **Trabalhando** (rodando uma ferramenta: `Bash`, `Edit`...) | senta numa mesa com PC aceso, com um balão mostrando a ferramenta |
| **Pensando** (o modelo está gerando a resposta) | senta num banco da praça lendo um livro |
| **Ocioso** (terminou o turno) | passeia pela ilha |
| **Terminou** (sessão ou subagente acabou) | caminha até o mar e vai embora |

Cada sessão aparece com o nome da pasta do projeto e cada subagente vira um pinguim próprio. Clique num pinguim para ver a ferramenta e o detalhe. A luz segue a hora do seu computador (de dia, fim de tarde e noite, com postes e janelas acesas) e há sons opcionais, desligados por padrão; os botões no canto da tela trocam a hora e ligam o som.

**Demo (agentes fictícios):** https://dududisk.github.io/clubo-dos-pinguins/

## Começar

Precisa de **Node 20.11+** e `curl`.

```bash
npx clubo-dos-pinguins
```

Na primeira vez ele mostra o que mudaria no seu `~/.claude/settings.json` (só **adiciona** hooks, com backup em `settings.json.bak-pinguins`) e pergunta antes de instalar. Depois abra **http://127.0.0.1:8787** e inicie uma sessão do Claude Code (sessões já abertas precisam ser reiniciadas).

- Desfazer: `npx clubo-dos-pinguins hooks --remove --yes`
- A partir do código: `git clone https://github.com/dududisk/clubo-dos-pinguins.git && cd clubo-dos-pinguins && npm start`

## Privacidade

- Tudo roda na sua máquina (`127.0.0.1`), nada é enviado para fora e o estado fica só em memória.
- O comando ou arquivo que o agente está usando só aparece ao clicar no pinguim; cuidado ao compartilhar a tela.
- Os hooks são assíncronos e silenciosos: não atrasam o Claude e não dão erro se o servidor estiver desligado.

## Outras ferramentas de IA

Qualquer coisa que consiga fazer um `POST` aparece na praça (`state`: `idle`, `thinking`, `working` ou `gone`; `tool` e `detail` são opcionais):

```bash
curl -X POST http://127.0.0.1:8787/event -d '{"id":"meu-agente","name":"Codex","state":"working","tool":"Bash"}'
```

## Contribuir

`npm run check` roda os testes. Veja o [CONTRIBUTING.md](https://github.com/dududisk/clubo-dos-pinguins/blob/main/CONTRIBUTING.md).

## Aviso

Inspirado no visual da praça do Club Penguin. **Projeto independente, sem relação com a Disney**: toda a arte é original e não há nenhum asset, logo ou mapa do jogo no repositório. Fonte: Pixelify Sans (SIL OFL 1.1, em `web/fonts/OFL.txt`). Licença [MIT](https://github.com/dududisk/clubo-dos-pinguins/blob/main/LICENSE).
