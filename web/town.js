// Lógica da praça (sem DOM, sem rede): pinguins, vagas, caminhos e estados.
// Entrada externa única: setState(id, nome, 'idle'|'thinking'|'working'|'gone', ferramenta?, detalhe?).
import { MAP, SPAWN, walkable } from './map.js';

const MOVE = 0.25; // segundos por tile
const MAX = 12; // pinguins na praça; os que passam disso entram quando alguém sair
const HOLD = 10; // s que quem trabalha segue na mesa depois de parar (entre uma ferramenta e outra o estado oscila)
let clock = 0; // segundos simulados (os testes avançam sem esperar)
const KIND = { thinking: 'b', working: 'c' }; // estado -> tipo de vaga (banco / cadeira)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const COLORS = ['#1f2d4d', '#8e2f3f', '#2f7a4f', '#6a3d9a', '#d98a1f', '#2b8aa6', '#b8527a', '#5b5f66'];
const key = (x, y) => x + ',' + y;
const isSea = (x, y) => MAP[y]?.[x] === '~';

export const penguins = new Map();
export const slots = [];
const slotAt = new Map();
MAP.forEach((row, y) => [...row].forEach((ch, x) => {
  if (ch === 'b' || ch === 'c') { const s = { x, y, ch, owner: null }; slots.push(s); slotAt.set(key(x, y), s); }
}));

export function setState(id, name, state, tool = '', detail = '') {
  let p = penguins.get(id);
  if (state === 'gone') { if (p) { release(p); p.leaving = true; } return; } // vai embora a pé até o mar
  if (!p) {
    if (penguins.size >= MAX) return;
    const color = COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
    p = { id, name: id, color, x: SPAWN.x, y: SPAWN.y, nx: SPAWN.x, ny: SPAWN.y, t: 1, path: [], slot: null, sitting: false, wait: 0, retry: 0, want: 'idle', changed: clock, leaving: false, tool: '', detail: '', seen: 0 };
    penguins.set(id, p);
  }
  if (p.leaving) { p.leaving = false; p.path = []; } // voltou antes de sumir
  if (p.want !== state) p.changed = clock;
  p.name = name || p.name;
  p.want = state; p.tool = tool; p.detail = detail; p.seen = Date.now();
}

export const pos = (p) => [p.x + (p.nx - p.x) * p.t, p.y + (p.ny - p.y) * p.t];

export function update(dt) {
  clock += dt;
  for (const p of penguins.values()) tick(p, dt);
}

function release(p) {
  if (p.slot) p.slot.owner = null;
  p.slot = null; p.path = []; p.sitting = false;
}

function go(p, nx, ny) { p.nx = nx; p.ny = ny; p.t = 0; }

function tick(p, dt) {
  if (p.t < 1) { // no meio de um passo
    p.t = Math.min(1, p.t + dt / MOVE);
    if (p.t < 1) return;
    p.x = p.nx; p.y = p.ny;
    if (!p.slot) p.wait = Math.random() * 1.5;
  }
  // Fronteira de tile: único ponto em que mudamos de ideia.
  if (p.leaving) { // caminha até o mar mais próximo e some
    if (isSea(p.x, p.y)) { penguins.delete(p.id); return; }
    if (!p.path.length) {
      const f = findPath(p.x, p.y, isSea);
      if (!f) { penguins.delete(p.id); return; }
      p.path = f.path;
    }
    const [nx, ny] = p.path.shift(); go(p, nx, ny);
    return;
  }
  const kind = KIND[p.want];
  const hold = p.slot?.ch === 'c' && clock - p.changed < HOLD;
  if (p.slot && p.slot.ch !== kind && !hold) release(p); // estado mudou: levanta e libera a vaga
  if (p.slot && p.x === p.slot.x && p.y === p.slot.y) { p.sitting = true; return; }
  if (kind && !p.slot && (p.retry -= dt) <= 0) {
    p.retry = 0.5; // sem vaga livre: continua passeando e tenta de novo
    const found = findPath(p.x, p.y, (x, y) => { const s = slotAt.get(key(x, y)); return s?.ch === kind && !s.owner ? s : null; });
    if (found) { found.goal.owner = p; p.slot = found.goal; p.path = found.path; }
  }
  if (p.slot) { const [nx, ny] = p.path.shift(); go(p, nx, ny); return; }
  if ((p.wait -= dt) > 0) return;
  const opts = DIRS.filter(([dx, dy]) => walkable(p.x + dx, p.y + dy)); // vale também a partir de uma vaga
  if (opts.length) { const [dx, dy] = opts[(Math.random() * opts.length) | 0]; go(p, p.x + dx, p.y + dy); }
}

// BFS até o tile mais próximo em passos para o qual goal(x, y) devolve algo verdadeiro (vaga livre ou mar:
// o objetivo pode ser um tile não andável, o último passo entra nele). Devolve { goal, path } sem o tile inicial.
function findPath(sx, sy, goal) {
  const prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
  for (const [x, y] of q) for (const [dx, dy] of DIRS) {
    const nx = x + dx, ny = y + dy, k = key(nx, ny);
    if (prev.has(k)) continue;
    const g = goal(nx, ny);
    if (!g && !walkable(nx, ny)) continue;
    prev.set(k, [x, y]);
    if (g) {
      const path = [];
      for (let c = [nx, ny]; prev.get(key(...c)); c = prev.get(key(...c))) path.unshift(c);
      return { goal: g, path };
    }
    q.push([nx, ny]);
  }
  return null;
}
