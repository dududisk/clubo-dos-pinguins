// Arte original por código (sem imagens). Placeholder: o visual de verdade vem depois.
const C = {
  snow: '#eef7fc', snow2: '#e0eff8', stone: '#c3ccd6', stone2: '#b3bdc9',
  leaf: '#2f6b4f', leafD: '#214d38', trunk: '#6b4a2b',
  wall: '#7a5c45', wallD: '#5c4433', floor: '#d2b48a', floor2: '#c6a77b', door: '#e0b862',
  wood: '#8b5a2b', woodD: '#6b4220', chair: '#b84a4a', chairD: '#8a3535',
  sea: '#3d8fd1', seaLight: '#5fb0e8', book: '#8e4a2f', page: '#f4efe0', pcOn: '#7fe0ff',
  pcFrame: '#4a5560', pcOff: '#2a3a4a', ice: '#cfe9f7', iceD: '#8cc4e4',
  body: '#1f2d4d', belly: '#f4f4f4', beak: '#f5a623', eye: '#ffffff',
};
const r = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

const BASE = { '#': '.', S: 'p', b: 'p', d: 'f', c: 'f', o: 'f' };
const DECOR = {
  '#': (ctx, x, y) => {
    r(ctx, C.trunk, x + 7, y + 11, 2, 4);
    r(ctx, C.leafD, x + 3, y + 7, 10, 5); r(ctx, C.leaf, x + 4, y + 4, 8, 4); r(ctx, C.leaf, x + 6, y + 1, 4, 4);
  },
  o: (ctx, x, y) => r(ctx, C.door, x + 2, y, 12, 16),
  S: (ctx, x, y) => { r(ctx, C.ice, x + 1, y + 1, 14, 14); r(ctx, C.iceD, x + 1, y + 11, 14, 4); },
  b: (ctx, x, y) => {
    r(ctx, C.woodD, x + 1, y + 6, 14, 3); r(ctx, C.wood, x + 1, y + 9, 14, 4);
    r(ctx, C.woodD, x + 2, y + 13, 2, 2); r(ctx, C.woodD, x + 12, y + 13, 2, 2);
  },
  d: (ctx, x, y) => {
    r(ctx, C.wood, x, y + 5, 16, 9); r(ctx, C.woodD, x, y + 13, 16, 2);
    r(ctx, C.pcFrame, x + 4, y + 1, 8, 6); r(ctx, C.pcOff, x + 5, y + 2, 6, 4); r(ctx, C.pcFrame, x + 7, y + 7, 2, 1);
  },
  c: (ctx, x, y) => { r(ctx, C.chair, x + 3, y + 3, 10, 7); r(ctx, C.chairD, x + 3, y + 10, 10, 3); },
};

export function drawTile(ctx, ch, tx, ty) {
  const x = tx * 16, y = ty * 16, k = (tx + ty) & 1, b = BASE[ch] ?? ch;
  if (b === '.') r(ctx, k ? C.snow : C.snow2, x, y, 16, 16);
  else if (b === 'p') r(ctx, k ? C.stone : C.stone2, x, y, 16, 16);
  else if (b === 'f') r(ctx, k ? C.floor : C.floor2, x, y, 16, 16);
  else if (b === '~') {
    r(ctx, C.sea, x, y, 16, 16);
    if ((tx * 7 + ty * 3) % 5 === 0) r(ctx, C.seaLight, x + 3, y + 7, 6, 1); // marolinha
  } else if (b === 'W') { r(ctx, C.wall, x, y, 16, 16); r(ctx, C.wallD, x, y + 12, 16, 4); }
  DECOR[ch]?.(ctx, x, y);
}

// A tela do PC acende quando há alguém sentado na cadeira abaixo dela.
export function drawPcOn(ctx, tx, ty, frame = 0) {
  r(ctx, C.pcOn, tx * 16 + 5, ty * 16 + 2, 6, 4);
  r(ctx, '#ffffff', tx * 16 + 6, ty * 16 + 3 + (frame & 1), 4, 1);
}

// kind 'working': de costas digitando na cadeira. kind 'thinking': de frente lendo no banco.
export function drawSeated(ctx, px, py, kind, frame = 0, color = C.body) {
  const x = Math.round(px), y = Math.round(py), s = frame & 1;
  if (kind === 'working') {
    r(ctx, color, x + 4, y + 3, 8, 8); r(ctx, color, x + 5, y + 1, 6, 3);
    r(ctx, color, x + 3, y + 3 + s, 1, 4); r(ctx, color, x + 12, y + 4 - s, 1, 4);
    r(ctx, C.chairD, x + 3, y + 10, 10, 3); // encosto fica na frente do pinguim
    return;
  }
  const t = y - 3;
  r(ctx, color, x + 4, t + 4, 8, 9); r(ctx, color, x + 5, t + 2, 6, 3);
  r(ctx, C.belly, x + 6, t + 6, 4, 6);
  r(ctx, C.eye, x + 6, t + 3, 1, 1); r(ctx, C.eye, x + 9, t + 3, 1, 1); r(ctx, C.beak, x + 7, t + 4, 2, 1);
  r(ctx, C.beak, x + 4, t + 13, 3, 2); r(ctx, C.beak, x + 9, t + 13, 3, 2);
  r(ctx, C.book, x + 3, t + 8, 10, 5); r(ctx, C.page, x + 4, t + 9, 4, 3); r(ctx, C.page, x + 8, t + 9, 4, 3);
  if (s) r(ctx, '#9aa7b3', x + 5, t + 10, 2, 1); else r(ctx, '#9aa7b3', x + 9, t + 10, 2, 1);
}

export function drawPenguin(ctx, px, py, frame = 0, color = C.body) {
  const x = Math.round(px), y = Math.round(py), s = frame & 1;
  r(ctx, color, x + 4, y + 4, 8, 9); r(ctx, color, x + 5, y + 2, 6, 3);
  r(ctx, color, x + 3, y + 6, 1, 4); r(ctx, color, x + 12, y + 6, 1, 4);
  r(ctx, C.belly, x + 6, y + 6, 4, 6);
  r(ctx, C.eye, x + 6, y + 3, 1, 1); r(ctx, C.eye, x + 9, y + 3, 1, 1);
  r(ctx, C.beak, x + 7, y + 4, 2, 1);
  r(ctx, C.beak, x + 4 + s, y + 13, 3, 2); r(ctx, C.beak, x + 9 - s, y + 13, 3, 2);
}
