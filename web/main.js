import { MAP, TILE } from './map.js';
import { renderScene, drawPenguin, drawSeated, drawPcOn, landmarks, WINDOWS, SEA } from './art.js';
import { penguins, slots, setState, update, pos } from './town.js';
import { lightAt, hourFor, glowSprite, mul, MODES } from './light.js';
import * as ui from './ui.js';
import * as sound from './sound.js';

const $ = (id) => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
cv.width = MAP[0].length * TILE;
cv.height = MAP.length * TILE;

// Três imagens prontas do cenário: só a água muda entre elas (espuma e marolas). Nada de redesenhar o mapa a cada quadro.
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scenes = [0, 1, 2].map((f) => {
  const c = document.createElement('canvas');
  c.width = cv.width; c.height = cv.height;
  renderScene(c.getContext('2d'), MAP, f);
  return c;
});

// Pontos de luz do mapa: postes e janelas (acendem à noite) e telas dos PCs com alguém sentado.
const lamps = [], wins = [];
MAP.forEach((row, ty) => [...row].forEach((ch, tx) => { if (ch === 'L') lamps.push([tx * TILE + 8, ty * TILE + 2]); }));
for (const [tx, ty] of WINDOWS) if (MAP[ty]?.[tx] === 'W') wins.push([tx * TILE, ty * TILE]);
const marks = landmarks(MAP); // farol e janelas das lojas
const GLOW = { amber: glowSprite('255,200,90'), cyan: glowSprite('127,233,255') };

const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento: tudo bem */ } },
};
let mode = store.get('clubo.mode', 'auto');
if (!MODES.includes(mode)) mode = 'auto';
const hourParam = parseFloat(new URLSearchParams(location.search).get('hora'));
sound.setOn(store.get('clubo.som', '0') === '1');

$('btn-hora').onclick = () => { mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length]; store.set('clubo.mode', mode); };
$('btn-som').onclick = () => { sound.setOn(!sound.isOn()); store.set('clubo.som', sound.isOn() ? '1' : '0'); };
const label = (id, s) => { if ($(id).textContent !== s) $(id).textContent = s; };

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

// Clique no pinguim mais próximo seleciona; clique no vazio ou Esc limpa.
cv.onclick = (e) => {
  const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / scale / TILE - 0.5, my = (e.clientY - r.top) / scale / TILE - 0.5;
  let best = null, bd = 1.5;
  for (const p of penguins.values()) {
    const [x, y] = pos(p), d = Math.hypot(x - mx, y - my);
    if (d < bd) { bd = d; best = p.id; }
  }
  ui.select(best);
};
addEventListener('keydown', (e) => { if (e.key === 'Escape') ui.select(null); });

let connected = true, last = performance.now(), light = lightAt(12), lightAtMs = -1e9, bg = '';
const prev = new Map(); // por pinguim: já estava sentado / na água? (dispara os sons só na mudança)

requestAnimationFrame(function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1); // aba oculta não faz ninguém teleportar
  last = now;
  update(dt);

  if (now - lightAtMs > 1000) { // a luz muda devagar: uma vez por segundo basta
    lightAtMs = now;
    light = lightAt(hourFor(mode, hourParam));
    const c = mul(SEA, light.rgb);
    if (c !== bg) { bg = c; document.body.style.background = c; }
    label('btn-hora', `Hora: ${mode}`);
    label('btn-som', `Som: ${sound.isOn() ? 'ligado' : 'desligado'}`);
  }

  ctx.drawImage(scenes[calm ? 0 : Math.floor(now / 450) % 3], 0, 0);
  for (const s of slots) if (s.ch === 'c' && s.owner?.sitting) drawPcOn(ctx, s.x, s.y - 1, (now / 300) | 0);

  const list = [...penguins.values()].map((p) => ({ p, xy: pos(p) })).sort((a, b) => a.xy[1] - b.xy[1]);
  for (const { p, xy: [x, y] } of list) {
    const blink = (now + p.seed * 977) % 4200 < 130, was = prev.get(p.id) ?? {};
    const swim = MAP[Math.round(y)]?.[Math.round(x)] === '~';
    if (p.sitting) {
      const desk = p.slot.ch === 'c';
      drawSeated(ctx, x * TILE, y * TILE, desk ? 'working' : 'thinking', { color: p.color, frame: (now / (desk ? 200 : 900)) | 0, blink });
      if (!was.sat) (desk ? sound.sfx.type : sound.sfx.page)();
    } else {
      drawPenguin(ctx, x * TILE, y * TILE, { color: p.color, dir: p.dir, frame: (now / 150) | 0, moving: p.t < 1, blink, swim });
    }
    if (swim && !was.swim) sound.sfx.splash();
    prev.set(p.id, { sat: p.sitting, swim });
  }
  for (const id of prev.keys()) if (!penguins.has(id)) prev.delete(id);

  // Luz do dia por cima de tudo; à noite, halos nos postes, nas janelas e nas telas ligadas.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgb(${light.rgb})`; ctx.fillRect(0, 0, cv.width, cv.height);
  if (light.night > 0.03) {
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = light.night;
    for (const [x, y] of lamps) ctx.drawImage(GLOW.amber, x - 28, y - 28, 56, 56);
    for (const [x, y] of wins) ctx.drawImage(GLOW.amber, x - 12, y - 6, 40, 40);
    for (const [x, y, w, h] of marks.shopWindows) ctx.drawImage(GLOW.amber, x - 12, y - 10, w + 24, h + 24);
    for (const [x, y] of marks.igloos) ctx.drawImage(GLOW.amber, x - 24, y - 24, 48, 48);
    for (const [x, y] of marks.lighthouses) { // farol: halo e dois feixes que giram sobre o mar
      ctx.drawImage(GLOW.amber, x - 40, y - 40, 80, 80);
      for (const d of [0, Math.PI]) {
        const a = now / 2200 + d, g = ctx.createLinearGradient(x, y, x + Math.cos(a) * 120, y + Math.sin(a) * 120);
        g.addColorStop(0, 'rgba(255,230,150,0.5)'); g.addColorStop(1, 'rgba(255,230,150,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 120, a - 0.1, a + 0.1); ctx.closePath(); ctx.fill();
      }
    }
    for (const s of slots) if (s.ch === 'c' && s.owner?.sitting) ctx.drawImage(GLOW.cyan, s.x * TILE - 8, (s.y - 1) * TILE - 12, 32, 32);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffd36b'; ctx.globalAlpha = light.night * 0.9;
    for (const [x, y] of lamps) ctx.fillRect(x - 3, y - 2, 6, 5);
    for (const [x, y] of wins) ctx.fillRect(x + 4, y + 11, 8, 3);
    for (const [x, y] of marks.lighthouses) ctx.fillRect(x - 5, y - 4, 10, 8);
    for (const [x, y] of marks.igloos) ctx.fillRect(x - 4, y - 1, 8, 4);
    ctx.globalAlpha = light.night * 0.55;
    for (const [x, y, w, h] of marks.shopWindows) ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

  ui.drawTags(list, scale, TILE);
  ui.drawCard(penguins);
  ui.drawHud(penguins, connected);
  requestAnimationFrame(loop);
});

const panel = $('panel');
if (location.search.includes('debug')) {
  // Modo teste (?debug): pinguins falsos para trocar de estado na mão, sem servidor de eventos.
  const NAMES = ['Ana', 'Beto', 'Caio', 'Duda', 'Edu', 'Fê', 'Gui', 'Hana', 'Igor', 'Júlia', 'Kiko', 'Lia'];
  const TOOLS = ['Bash', 'Edit', 'Read', 'Grep', 'Write'];
  let n = 0;
  const btn = (text, on, active) => {
    const b = document.createElement('button');
    b.textContent = text; b.disabled = !!active; b.onclick = () => { on(); render(); };
    return b;
  };
  const render = () => {
    panel.replaceChildren(btn('+ Pinguim', () => setState('p' + ++n, NAMES[(n - 1) % NAMES.length], 'idle')));
    for (const p of penguins.values()) {
      if (p.leaving) continue;
      const row = document.createElement('div'), dot = document.createElement('span'), name = document.createElement('b');
      dot.className = 'dot'; dot.style.background = p.color; name.textContent = p.name;
      row.append(dot, name);
      for (const [st, text] of [['working', 'Trabalhar'], ['thinking', 'Pensar'], ['idle', 'Ocioso'], ['gone', '✕']])
        row.append(btn(text, () => setState(p.id, p.name, st, st === 'working' ? TOOLS[(Math.random() * TOOLS.length) | 0] : ''), p.want === st));
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
