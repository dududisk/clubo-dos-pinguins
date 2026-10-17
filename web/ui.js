// Camada de HTML sobre o canvas: etiquetas, cartão de detalhes, resumo e avisos.
// Todo texto vindo dos agentes entra por textContent, nunca por innerHTML.
import { drawPenguin } from './art.js';

const $ = (id) => document.getElementById(id);
const STATE = { working: 'trabalhando', thinking: 'pensando', idle: 'ocioso' };
const text = (el, s) => { if (el.textContent !== s) el.textContent = s; };
const tags = new Map();
let selected = null, faceKey = '';

export const select = (id) => { selected = id; };

function tagOf(p) {
  let t = tags.get(p.id);
  if (!t) {
    const el = document.createElement('div'), bubble = document.createElement('div'), name = document.createElement('button');
    const dot = document.createElement('i'), label = document.createElement('span');
    el.className = 'tag'; bubble.className = 'bubble'; name.className = 'name'; name.type = 'button';
    dot.style.background = p.color; name.append(dot, label); el.append(bubble, name);
    name.onclick = () => select(p.id);
    $('labels').append(el);
    tags.set(p.id, t = { el, bubble, label, name });
  }
  return t;
}

// Nome (sempre) e balão (ferramenta ao trabalhar, "…" ao pensar) acima de cada pinguim.
export function drawTags(list, scale, TILE) {
  document.body.classList.toggle('small', scale < 1); // janela pequena: etiquetas menores e sem balões, para não amontoar
  for (const [id, t] of tags) if (!list.some(({ p }) => p.id === id)) { t.el.remove(); tags.delete(id); }
  for (const { p, xy: [x, y] } of list) {
    const t = tagOf(p), b = p.want === 'working' ? p.tool.replace(/^mcp__.*__/, '') || 'trabalhando' : p.want === 'thinking' ? '…' : '';
    const below = p.sitting && p.slot.ch === 'c'; // quem trabalha na mesa leva a etiqueta embaixo, para não esconder o PC
    t.el.style.transform = `translate(${(x * TILE + 8) * scale}px, ${(y * TILE + (below ? 15 : -2)) * scale}px) translate(-50%, ${below ? 0 : -100}%)`;
    text(t.bubble, b); t.bubble.hidden = !b;
    text(t.label, p.name);
    t.name.title = `${p.name}: ver detalhes`;
    t.el.classList.toggle('sel', p.id === selected);
  }
}

export function drawCard(penguins) {
  const p = penguins.get(selected);
  $('card').hidden = !p;
  if (!p) { selected = null; return; }
  const key = p.id + p.color;
  if (key !== faceKey) { // retrato: o mesmo sprite do pinguim, ampliado pelo CSS
    const f = $('face').getContext('2d');
    f.clearRect(0, 0, 16, 16);
    drawPenguin(f, 0, 0, { color: p.color });
    faceKey = key;
  }
  text($('c-name'), p.name);
  text($('c-state'), STATE[p.want] ?? p.want);
  $('c-state').dataset.s = p.want;
  const row = (id, v) => { text($(id), v); $(id).parentElement.hidden = !v; };
  row('c-tool', p.tool); row('c-detail', p.detail);
  row('c-seen', `há ${Math.round((Date.now() - p.seen) / 1000)} s`);
}

// Resumo: quantos agentes em cada estado + aviso de conexão / praça vazia.
export function drawHud(penguins, connected) {
  const n = { working: 0, thinking: 0, idle: 0 };
  for (const p of penguins.values()) if (!p.leaving) n[p.want] = (n[p.want] ?? 0) + 1;
  for (const li of $('chips').children) {
    const k = li.dataset.s, v = n[k] ?? 0;
    text(li.querySelector('b'), String(v));
    text(li.querySelector('span'), k === 'working' ? 'trabalhando' : k === 'thinking' ? 'pensando' : v === 1 ? 'ocioso' : 'ociosos');
  }
  const total = n.working + n.thinking + n.idle;
  const msg = !connected ? 'Sem conexão com o servidor. Tentando reconectar…'
    : total ? '' : 'Nenhum agente por aqui. Inicie uma sessão do Claude Code e o primeiro pinguim chega nadando.';
  text($('status'), msg); $('status').hidden = !msg;
}
