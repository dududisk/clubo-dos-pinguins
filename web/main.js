import { MAP, TILE } from './map.js';
import { drawTile, drawPenguin, drawSeated, drawPcOn } from './art.js';
import { penguins, slots, setState, update, pos } from './town.js';

const $ = (id) => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
cv.width = MAP[0].length * TILE;
cv.height = MAP.length * TILE;

// Cenário estático desenhado uma vez; o loop só copia a imagem e desenha os pinguins.
const bg = document.createElement('canvas');
bg.width = cv.width; bg.height = cv.height;
MAP.forEach((row, ty) => [...row].forEach((ch, tx) => drawTile(bg.getContext('2d'), ch, tx, ty)));

// Escala inteira (pixel nítido) quando cabe; fracionária só se a janela for menor que o mapa.
let scale = 1;
function fit() {
  const k = Math.min(innerWidth / cv.width, innerHeight / cv.height);
  scale = k >= 1 ? Math.floor(k) : k;
  cv.style.width = cv.width * scale + 'px';
  cv.style.height = cv.height * scale + 'px';
}
addEventListener('resize', fit);
fit();

// Etiquetas em HTML sobre o canvas (texto nítido em qualquer escala): nome + balão com a ferramenta.
const ST = { working: 'trabalhando', thinking: 'pensando', idle: 'ocioso' };
const tags = new Map();
let selected = null, connected = true;
const text = (el, s) => { if (el.textContent !== s) el.textContent = s; };

function tagOf(p) {
  let t = tags.get(p.id);
  if (!t) {
    const el = document.createElement('div'), bubble = document.createElement('div'), name = document.createElement('div');
    const dot = document.createElement('i'), label = document.createElement('span');
    el.className = 'tag'; bubble.className = 'bubble'; name.className = 'name'; dot.style.background = p.color;
    name.append(dot, label); el.append(bubble, name); $('labels').append(el);
    tags.set(p.id, t = { el, bubble, label });
  }
  return t;
}

function drawTags(list) {
  for (const [id, t] of tags) if (!penguins.has(id)) { t.el.remove(); tags.delete(id); }
  for (const { p, xy: [x, y] } of list) {
    const t = tagOf(p), b = p.want === 'working' ? p.tool.replace(/^mcp__.*__/, '') || 'trabalhando' : p.want === 'thinking' ? '…' : '';
    // Quem trabalha na mesa leva a etiqueta embaixo, para não esconder o PC aceso.
    const below = p.sitting && p.slot.ch === 'c';
    t.el.style.transform = `translate(${(x * TILE + 8) * scale}px, ${(y * TILE + (below ? 15 : -2)) * scale}px) translate(-50%, ${below ? 0 : -100}%)`;
    text(t.bubble, b); t.bubble.hidden = !b;
    text(t.label, p.name);
    t.el.classList.toggle('sel', p.id === selected);
  }
}

// Clique num pinguim mostra os detalhes (texto vindo dos agentes: sempre textContent, nunca innerHTML).
cv.onclick = (e) => {
  const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / scale / TILE - 0.5, my = (e.clientY - r.top) / scale / TILE - 0.5;
  let best = null, bd = 1.5;
  for (const p of penguins.values()) {
    const [x, y] = pos(p), d = Math.hypot(x - mx, y - my);
    if (d < bd) { bd = d; best = p.id; }
  }
  selected = best;
};

function drawCard() {
  const p = penguins.get(selected);
  if (!p) { selected = null; $('card').hidden = true; return; }
  const s = [p.name, `Estado: ${ST[p.want] ?? p.want}`, p.tool && `Ferramenta: ${p.tool}`, p.detail && `Detalhe: ${p.detail}`,
    `Último sinal: há ${Math.round((Date.now() - p.seen) / 1000)}s`].filter(Boolean).join('\n');
  text($('card'), s); $('card').hidden = false;
}

let last = performance.now();
requestAnimationFrame(function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1); // aba oculta não faz ninguém teleportar
  last = now;
  update(dt);
  ctx.drawImage(bg, 0, 0);
  for (const s of slots) if (s.ch === 'c' && s.owner?.sitting) drawPcOn(ctx, s.x, s.y - 1, (now / 300) | 0);
  const list = [...penguins.values()].map((p) => ({ p, xy: pos(p) })).sort((a, b) => a.xy[1] - b.xy[1]);
  for (const { p, xy: [x, y] } of list) {
    if (p.sitting) { // a pose segue a vaga (na mesa digitando, no banco lendo), não o estado, por causa da espera na mesa
      const desk = p.slot.ch === 'c';
      drawSeated(ctx, x * TILE, y * TILE, desk ? 'working' : 'thinking', (now / (desk ? 200 : 900)) | 0, p.color);
    }
    else drawPenguin(ctx, x * TILE, y * TILE, p.t < 1 ? (now / 150) | 0 : 0, p.color);
  }
  drawTags(list);
  drawCard();
  const st = !connected ? 'Sem conexão com o servidor, tentando de novo…' : penguins.size ? '' : 'Aguardando agentes… abra o Claude Code';
  text($('status'), st); $('status').hidden = !st;
  requestAnimationFrame(loop);
});

const panel = $('panel');
if (location.search.includes('debug')) {
  // Modo teste (?debug): pinguins falsos para trocar de estado na mão, sem servidor de eventos.
  const NAMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê', 'Gui', 'Hana', 'Igor', 'Júlia', 'Kiko', 'Lia'];
  const TOOLS = ['Bash', 'Edit', 'Read', 'Grep', 'Write'];
  let n = 0;
  const btn = (label, on, active) => {
    const b = document.createElement('button');
    b.textContent = label; b.disabled = !!active; b.onclick = () => { on(); render(); };
    return b;
  };
  const render = () => {
    panel.replaceChildren(btn('+ Pinguim', () => setState('p' + ++n, NAMES[(n - 1) % NAMES.length], 'idle')));
    for (const p of penguins.values()) {
      if (p.leaving) continue;
      const row = document.createElement('div'), dot = document.createElement('span'), name = document.createElement('b');
      dot.className = 'dot'; dot.style.background = p.color; name.textContent = p.name;
      row.append(dot, name);
      for (const [st, label] of [['working', 'Trabalhar'], ['thinking', 'Pensar'], ['idle', 'Ocioso'], ['gone', '✕']])
        row.append(btn(label, () => setState(p.id, p.name, st, st === 'working' ? TOOLS[(Math.random() * TOOLS.length) | 0] : ''), p.want === st));
      panel.append(row);
    }
  };
  setState('p' + ++n, NAMES[0], 'idle');
  setState('p' + ++n, NAMES[1], 'idle');
  render();
  setInterval(render, 1500); // some da lista quem já foi embora
} else if (location.search.includes('demo') || location.hostname.endsWith('github.io')) {
  panel.remove(); // demo pública: sem servidor, agentes fictícios
  import('./demo.js').then((m) => m.run(setState));
} else {
  panel.remove();
  // Eventos reais (server.js). O EventSource reconecta sozinho e, a cada conexão, o servidor reenvia o estado completo.
  const es = new EventSource('/stream');
  es.onopen = () => { connected = true; };
  es.onerror = () => { connected = false; };
  es.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (!m.snapshot) return setState(m.id, m.name, m.state, m.tool, m.detail);
    const ids = new Set(m.snapshot.map((e) => e.id));
    for (const id of [...penguins.keys()]) if (!ids.has(id)) setState(id, '', 'gone'); // saiu enquanto estávamos desconectados
    for (const e of m.snapshot) setState(e.id, e.name, e.state, e.tool, e.detail);
  };
}
