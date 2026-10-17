// Luz do dia: uma cor que multiplica a cena (azul à noite, âmbar no fim da tarde) e um fator de noite
// (0 a 1) que acende postes e janelas. Tudo calculado, sem imagem.
const KEYS = [[0, 'n'], [5, 'n'], [7.5, 'd'], [17, 'd'], [19, 'u'], [21, 'n'], [24, 'n']];
const TINT = { n: [112, 130, 198], d: [255, 255, 255], u: [246, 212, 224] };
const NIGHT = { n: 1, d: 0, u: 0.35 };
export const MODES = ['auto', 'dia', 'noite'];

export function lightAt(h) {
  const i = Math.max(1, KEYS.findIndex(([t]) => t > h)), [t0, a] = KEYS[i - 1], [t1, b] = KEYS[i], k = (h - t0) / (t1 - t0);
  const mix = (x, y) => x + (y - x) * k;
  return { rgb: TINT[a].map((v, j) => Math.round(mix(v, TINT[b][j]))), night: mix(NIGHT[a], NIGHT[b]) };
}

// Hora usada na cena: a real (auto) ou fixa. `?hora=21.5` na URL força um horário (útil para testar).
export function hourFor(mode, override) {
  if (override != null && !Number.isNaN(override)) return override;
  if (mode === 'dia') return 12;
  if (mode === 'noite') return 23;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

// Halo de luz pré-desenhado (um gradiente radial), reaproveitado para postes, janelas e telas.
export function glowSprite(rgb, size = 64) {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  c.width = c.height = size;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb},0.6)`); grad.addColorStop(0.4, `rgba(${rgb},0.2)`); grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  return c;
}

export const mul = (hex, rgb) => { // cor de fundo da página = mar vezes a luz, para o mar continuar sem emenda
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v, i) => Math.round((v * rgb[i]) / 255)).join(',')})`;
};
