// Arte original por código (sem imagens). Pixel art em tiles de 16px.
// A luz vem do canto superior esquerdo: realce em cima/esquerda, sombra para a direita/baixo.
const C = {
  seaDeep: '#1e6aa0', seaMid: '#2f86b8', seaShallow: '#5fb7dd', foam: '#e9f8fc',
  ice: '#d3ebf7', iceMid: '#a5cfe8', iceDark: '#5d9fca',
  snow: '#eaf5fc', snowB: '#e2f0fa', snowShade: '#bfd4e8', outlineSnow: '#8aa6c4',
  stone: '#ccd6e2', stoneB: '#bdc9d8', mortar: '#9fb1c5', stoneLight: '#e0e8f0', stoneDark: '#8fa1b6',
  pine: '#2f6b4f', pineLight: '#4a8a63', pineDark: '#1f4a3a', trunk: '#5e3b1c',
  floor: '#dcbf93', floorB: '#d0b07f', seam: '#b89466',
  wallTop: '#a58263', wallLight: '#c4a384', wallFront: '#6e5039', wallDark: '#4a3424', brick: '#85634a',
  wood: '#9a6330', woodLight: '#bd8446', woodDark: '#5e3b1c',
  chair: '#c24a4a', chairDark: '#8a3535', mat: '#b8433f', matDark: '#7e2c2a',
  metal: '#2b3550', lampGlass: '#ffe9a8', glass: '#9fd6f2', glassLight: '#d6f0fb',
  pcFrame: '#38424f', pcScreen: '#1f2d3a', pcOn: '#7fe9ff',
  shadow: 'rgba(36,58,104,0.28)', book: '#8e4a2f', page: '#f4efe0', pageLine: '#9aa7b3',
  out: '#0c1424', belly: '#f7fbff', bellyShade: '#d5e5f2', beak: '#ffa81f', beakShade: '#e07f0a', body: '#1f2d4d',
};
export const SEA = C.seaDeep; // a página usa esta cor de fundo para o mar "continuar" além do canvas
// Janelas decorativas (só valem onde o mapa tem parede); a luz noturna usa a mesma lista.
export const WINDOWS = [[25, 3], [31, 3], [24, 10], [26, 10], [31, 10], [33, 10]];

const r = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
// Ruído determinístico por tile: o cenário não pisca nem cai em padrão xadrez.
const hash = (x, y, s = 0) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) % 1000) / 1000;
};
const pick = (x, y, s, n) => (hash(x, y, s) * n) | 0;
const ell = (ctx, c, cx, cy, rx, ry = rx) => {
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + 0.5)));
    if (w > 0) r(ctx, c, cx - w, cy + dy, 2 * w, 1);
  }
};
const shades = new Map();
export function shade(hex, amt) { // amt de -1 (escurece) a 1 (clareia)
  const k = hex + amt;
  if (!shades.has(k)) {
    const n = parseInt(hex.slice(1), 16), f = (v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    shades.set(k, '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v & 255).toString(16).padStart(2, '0')).join(''));
  }
  return shades.get(k);
}

// ---------- cenário ----------
// Desenha a ilha inteira. `frame` (0..2) só muda a água, para animar trocando de imagem pronta.
export function renderScene(ctx, MAP, frame) {
  const at = (x, y) => MAP[y]?.[x] ?? '~';
  const land = (x, y) => at(x, y) !== '~';
  const near = (x, y, n) => { for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) if (land(x + dx, y + dy)) return true; return false; };
  const g = { at, land, near, frame };
  const each = (fn) => MAP.forEach((row, ty) => [...row].forEach((ch, tx) => fn(ch, tx, ty, tx * 16, ty * 16)));

  each((ch, tx, ty, x, y) => ground(ctx, g, ch, tx, ty, x, y));
  each((ch, tx, ty, x, y) => shore(ctx, g, ch, tx, ty, x, y));
  each((ch, tx, ty, x, y) => { // de cima para baixo: o que está na frente cobre o que está atrás
    if (ch === '#') tree(ctx, tx, ty, x, y);
    else if (ch === 'M') snowman(ctx, x, y);
    else if (ch === 'L') lamp(ctx, x, y);
    else if (ch === 'b') bench(ctx, x, y);
    else if (ch === 'd') desk(ctx, x, y);
    else if (ch === 'c') chair(ctx, x, y);
    else if (ch === 'S' && at(tx - 1, ty) !== 'S' && at(tx, ty - 1) !== 'S') fountain(ctx, x, y, frame);
    else if (ch === 'H' && at(tx - 1, ty) !== 'H' && at(tx, ty - 1) !== 'H') lighthouse(ctx, x, y);
    else if (ch === 'K' && at(tx - 1, ty) !== 'K' && at(tx, ty - 1) !== 'K') shop(ctx, x, y);
    else if (ch === 'I' && at(tx - 1, ty) !== 'I' && at(tx, ty - 1) !== 'I') igloo(ctx, x, y);
  });
}

function ground(ctx, g, ch, tx, ty, x, y) {
  if (ch === '~') {
    const deep = !g.near(tx, ty, 3), shallow = g.near(tx, ty, 1);
    r(ctx, shallow ? C.seaShallow : deep ? C.seaDeep : C.seaMid, x, y, 16, 16);
    const wave = shallow ? '#8fd3ee' : deep ? '#2f7fb3' : '#4f9fcc';
    for (let i = 0; i < 2; i++) { // marolas que andam um pouco a cada quadro
      if (hash(tx, ty, 40 + i) > 0.5) r(ctx, wave, x + ((pick(tx, ty, 50 + i, 9) + g.frame * 2) % 12), y + 3 + i * 7 + pick(tx, ty, 60 + i, 3), 4, 1);
    }
  } else if (ch === 'p' || ch === 'S' || ch === 'b' || ch === 'L') {
    r(ctx, hash(tx, ty) > 0.5 ? C.stone : C.stoneB, x, y, 16, 16);
    r(ctx, C.mortar, x, y, 16, 1); r(ctx, C.mortar, x, y + 8, 16, 1);
    r(ctx, C.mortar, x + 8, y, 1, 8); r(ctx, C.mortar, x, y + 8, 1, 8);
    r(ctx, C.stoneLight, x + 1, y + 1, 6, 1); r(ctx, C.stoneLight, x + 9, y + 1, 6, 1);
    r(ctx, C.stoneLight, x + 2, y + 9, 5, 1); r(ctx, C.stoneLight, x + 10, y + 9, 5, 1);
  } else if (ch === 'f' || ch === 'd' || ch === 'c' || ch === 'o') {
    r(ctx, C.floor, x, y, 16, 16);
    for (let k = 0; k < 4; k++) { // tábuas de 4px, juntas em lugares diferentes
      const yy = y + k * 4;
      if ((ty * 4 + k + tx) % 2) r(ctx, C.floorB, x, yy, 16, 3);
      r(ctx, C.seam, x, yy + 3, 16, 1);
      r(ctx, C.seam, x + 1 + pick(tx, ty, 10 + k, 14), yy, 1, 3);
    }
    if (ch === 'o') { // capacho
      r(ctx, C.matDark, x + 1, y + 2, 14, 12, ); r(ctx, C.mat, x + 2, y + 3, 12, 10);
      r(ctx, C.matDark, x + 4, y + 5, 8, 1); r(ctx, C.matDark, x + 4, y + 8, 8, 1); r(ctx, C.matDark, x + 4, y + 11, 8, 1);
    }
  } else if (ch === 'W') {
    wall(ctx, g, tx, ty, x, y);
  } else { // neve (também sob árvores e bonecos)
    r(ctx, hash(tx, ty) < 0.18 ? C.snowB : C.snow, x, y, 16, 16);
    if (hash(tx, ty, 2) > 0.78) r(ctx, C.snowB, x + 2 + pick(tx, ty, 3, 8), y + 3 + pick(tx, ty, 4, 9), 6, 1);
    if (hash(tx, ty, 5) > 0.9) r(ctx, C.snowShade, x + pick(tx, ty, 6, 14), y + pick(tx, ty, 7, 14), 2, 1);
    if (hash(tx, ty, 8) > 0.93) r(ctx, '#ffffff', x + pick(tx, ty, 9, 15), y + pick(tx, ty, 11, 15), 1, 1);
  }
}

function wall(ctx, g, tx, ty, x, y) {
  const front = g.at(tx, ty + 1) !== 'W'; // se a parede mostra a face de frente ou só o topo
  r(ctx, C.wallTop, x, y, 16, front ? 9 : 16);
  r(ctx, C.wallLight, x, y, 16, 1);
  if (!front) { r(ctx, C.wallLight, x, y, 1, 16); r(ctx, C.wallFront, x + 15, y, 1, 16); }
  if (front) {
    r(ctx, C.wallFront, x, y + 9, 16, 7);
    r(ctx, C.wallDark, x, y + 9, 16, 1); r(ctx, C.wallDark, x, y + 15, 16, 1);
    r(ctx, C.brick, x, y + 12, 16, 1);
    r(ctx, C.brick, x + (tx & 1 ? 4 : 10), y + 10, 1, 2); r(ctx, C.brick, x + (tx & 1 ? 11 : 3), y + 13, 1, 2);
    if (WINDOWS.some(([wx, wy]) => wx === tx && wy === ty)) { // janela na face da parede
      r(ctx, C.woodLight, x + 3, y + 10, 10, 5); r(ctx, C.glass, x + 4, y + 11, 8, 3);
      r(ctx, C.glassLight, x + 4, y + 11, 3, 1); r(ctx, C.woodLight, x + 8, y + 11, 1, 3);
    }
  }
  if ('.~#M'.includes(g.at(tx, ty - 1))) { // neve acumulada no beiral
    r(ctx, C.snow, x, y, 16, 3); r(ctx, C.snowB, x, y + 2, 16, 1);
    for (let i = 0; i < 16; i += 3) if (hash(tx + i, ty, 70) > 0.35) r(ctx, C.snow, x + i, y + 3, 2, 1);
  }
}

function foam(ctx, x, y, f, s, vertical) { // espuma: linha fina + riscos que deslizam a cada quadro
  r(ctx, 'rgba(233,248,252,0.55)', x, y, vertical ? 2 : 16, vertical ? 16 : 1);
  for (let i = 0; i < 3; i++) {
    const o = (i * 6 + f * 2 + s * 3) % 16;
    if (vertical) r(ctx, C.foam, x + (i & 1), y + o, 1, 3); else r(ctx, C.foam, x + o, y + (i & 1), 3, 1);
  }
}

function corner(ctx, x, y, sx, sy) { // arredonda o canto de uma ponta de terra com água
  for (let i = 0; i < 4; i++) r(ctx, C.seaShallow, sx > 0 ? x : x + 16 - (4 - i), sy > 0 ? y + i : y + 15 - i, 4 - i, 1);
}

function shore(ctx, g, ch, tx, ty, x, y) {
  const f = g.frame;
  if (ch === '~') {
    if (g.land(tx, ty - 1)) { // falésia de gelo logo abaixo da terra
      r(ctx, C.ice, x, y, 16, 2); r(ctx, C.iceMid, x, y + 2, 16, 2); r(ctx, C.iceDark, x, y + 4, 16, 1);
      for (let i = 0; i < 16; i += 2) if (hash(tx * 16 + i, ty, 20) > 0.6) r(ctx, C.iceMid, x + i, y + 5, 2, 1);
      foam(ctx, x, y + 6, f, tx + ty);
    }
    if (g.land(tx, ty + 1)) foam(ctx, x, y + 14, f, tx + ty + 3);
    if (g.land(tx - 1, ty)) foam(ctx, x, y, f, ty, true);
    if (g.land(tx + 1, ty)) foam(ctx, x + 14, y, f, ty + 2, true);
    return;
  }
  const wN = !g.land(tx, ty - 1), wS = !g.land(tx, ty + 1), wW = !g.land(tx - 1, ty), wE = !g.land(tx + 1, ty);
  if (wN) r(ctx, '#ffffff', x, y, 16, 1);
  if (wW) r(ctx, '#ffffff', x, y, 1, 16);
  if (wE) r(ctx, C.snowShade, x + 15, y, 1, 16);
  if (wS) r(ctx, C.snowShade, x, y + 15, 16, 1);
  if (wN && wW) corner(ctx, x, y, 1, 1);
  if (wN && wE) corner(ctx, x, y, -1, 1);
  if (wS && wW) corner(ctx, x, y, 1, -1);
  if (wS && wE) corner(ctx, x, y, -1, -1);
}

// ---------- objetos ----------
function tier(ctx, cx, top, w) { // um andar do pinheiro: 6 linhas que alargam para baixo
  for (let i = 0; i < 6; i++) {
    const rw = Math.max(2, Math.round((w * (i + 1)) / 12) * 2), x0 = cx - rw / 2;
    r(ctx, C.pine, x0, top + i, rw, 1); r(ctx, C.pineLight, x0, top + i, 1, 1); r(ctx, C.pineDark, x0 + rw - 1, top + i, 1, 1);
  }
  r(ctx, C.snow, cx - 1, top, 2, 1); r(ctx, C.snow, cx - 2, top + 1, 3, 1);
  r(ctx, C.snow, cx - Math.round(w / 2) + 1, top + 4, 3, 1); r(ctx, C.snow, cx + 1, top + 3, 2, 1);
}
function tree(ctx, tx, ty, x, y) {
  const k = hash(tx, ty, 30), ox = pick(tx, ty, 31, 3) - 1;
  r(ctx, C.shadow, x + 3, y + 13, 13, 3);
  r(ctx, C.trunk, x + 7 + ox, y + 11, 2, 4);
  for (const [top, w] of k > 0.5 ? [[5, 14], [0, 12], [-6, 10]] : [[6, 13], [1, 11], [-4, 9]]) tier(ctx, x + 8 + ox, y + top, w);
}

function snowman(ctx, x, y) {
  r(ctx, C.shadow, x + 2, y + 14, 13, 2);
  for (const [cy, rd] of [[10, 6], [3, 4], [-3, 3]]) {
    ell(ctx, C.outlineSnow, x + 8, y + cy, rd + 1); ell(ctx, C.snowShade, x + 8, y + cy, rd); ell(ctx, C.snow, x + 7, y + cy - 1, rd - 1);
  }
  r(ctx, C.metal, x + 4, y - 6, 8, 1); r(ctx, C.metal, x + 5, y - 9, 6, 3); // chapéu
  r(ctx, C.out, x + 6, y - 4, 1, 1); r(ctx, C.out, x + 9, y - 4, 1, 1);      // olhos
  r(ctx, C.beak, x + 7, y - 2, 4, 1);                                        // cenoura
  r(ctx, C.chair, x + 5, y, 6, 2); r(ctx, C.chair, x + 9, y + 2, 2, 4);      // cachecol
  r(ctx, C.out, x + 8, y + 4, 1, 1); r(ctx, C.out, x + 8, y + 7, 1, 1);      // botões
  r(ctx, C.trunk, x, y + 3, 4, 1); r(ctx, C.trunk, x + 12, y + 2, 4, 1);     // braços
}

function lamp(ctx, x, y) {
  r(ctx, C.shadow, x + 5, y + 14, 11, 2);
  r(ctx, C.metal, x + 5, y + 13, 6, 2); r(ctx, C.metal, x + 7, y + 4, 2, 9);
  r(ctx, C.metal, x + 4, y - 1, 8, 1); r(ctx, C.metal, x + 4, y + 5, 8, 1); r(ctx, C.metal, x + 4, y, 1, 5); r(ctx, C.metal, x + 11, y, 1, 5);
  r(ctx, C.lampGlass, x + 5, y, 6, 5); r(ctx, '#ffffff', x + 5, y, 2, 2);
  r(ctx, C.snow, x + 5, y - 2, 6, 1); r(ctx, C.metal, x + 6, y - 3, 4, 1);
}

function bench(ctx, x, y) {
  r(ctx, C.shadow, x + 2, y + 14, 15, 2);
  r(ctx, C.woodLight, x + 1, y + 5, 14, 2); r(ctx, C.wood, x + 1, y + 7, 14, 2); r(ctx, C.snow, x + 2, y + 4, 11, 1);
  r(ctx, C.woodLight, x + 1, y + 9, 14, 3); r(ctx, C.woodDark, x + 1, y + 12, 14, 1);
  r(ctx, C.metal, x + 2, y + 13, 2, 2); r(ctx, C.metal, x + 12, y + 13, 2, 2);
}

function desk(ctx, x, y) {
  r(ctx, C.shadow, x + 1, y + 14, 16, 2);
  r(ctx, C.pcFrame, x + 3, y + 1, 10, 7); r(ctx, C.pcScreen, x + 4, y + 2, 8, 5); r(ctx, C.pcFrame, x + 6, y + 8, 4, 1);
  r(ctx, C.woodLight, x, y + 9, 16, 2); r(ctx, C.wood, x, y + 11, 16, 3); r(ctx, C.woodDark, x, y + 14, 16, 1);
  r(ctx, '#cfd8e3', x + 4, y + 9, 7, 1); r(ctx, C.page, x + 13, y + 8, 2, 2);
}
function chairBack(ctx, x, y) { // o encosto fica na frente de quem senta
  r(ctx, C.chairDark, x + 3, y + 8, 10, 5); r(ctx, C.chair, x + 3, y + 8, 10, 1);
  r(ctx, C.metal, x + 4, y + 13, 2, 1); r(ctx, C.metal, x + 10, y + 13, 2, 1);
}
function chair(ctx, x, y) {
  r(ctx, C.shadow, x + 3, y + 14, 11, 2);
  r(ctx, C.chair, x + 3, y + 4, 10, 4); r(ctx, '#df6f6f', x + 3, y + 4, 10, 1);
  chairBack(ctx, x, y);
}

function fountain(ctx, x, y, f) { // bloco 2x2 (32x32)
  r(ctx, C.shadow, x + 4, y + 29, 28, 3);
  ell(ctx, C.stoneDark, x + 16, y + 18, 15, 12); ell(ctx, C.stoneLight, x + 16, y + 17, 14, 11);
  ell(ctx, '#4fb2e4', x + 16, y + 18, 11, 8); ell(ctx, '#6bc7ee', x + 16, y + 17, 10, 7);
  for (let i = 0; i < 3; i++) r(ctx, C.foam, x + 8 + ((i * 7 + f * 3) % 14), y + 14 + i * 3, 3, 1);
  ell(ctx, C.stone, x + 16, y + 20, 4, 3); r(ctx, C.ice, x + 15, y + 8, 2, 11); r(ctx, C.iceMid, x + 13, y + 7, 6, 2);
  r(ctx, C.foam, x + 12, y + 10, 1, 4); r(ctx, C.foam, x + 19, y + 10, 1, 4);
}

// Farol (bloco 2x2 no mapa; a torre sobe bem acima dele). Torre listrada, galeria, lanterna e telhado.
function lighthouse(ctx, x, y) {
  const cx = x + 16, top = y - 26, bot = y + 24, red = '#c24a4a', white = '#f4f6f8', edge = '#2a3a5a';
  r(ctx, C.shadow, x + 8, y + 28, 30, 4);
  ell(ctx, C.stoneDark, cx, y + 27, 15, 5); ell(ctx, C.stone, cx - 1, y + 26, 14, 4); ell(ctx, C.snow, cx - 1, y + 24, 11, 2);
  for (let yy = top; yy < bot; yy++) { // torre: afunila para cima, listras de 8px, luz à esquerda e sombra à direita
    const w = 2 * Math.round((12 + (8 * (yy - top)) / (bot - top)) / 2), x0 = cx - w / 2, col = ((yy - top) >> 3) & 1 ? red : white;
    r(ctx, edge, x0 - 1, yy, w + 2, 1); r(ctx, col, x0, yy, w, 1);
    r(ctx, shade(col, 0.2), x0, yy, 3, 1); r(ctx, shade(col, -0.25), x0 + w - 4, yy, 4, 1);
  }
  r(ctx, C.woodDark, cx - 3, y + 17, 6, 7); r(ctx, C.woodLight, cx - 2, y + 18, 4, 6); r(ctx, C.lampGlass, cx + 1, y + 21, 1, 1); // porta
  for (const wy of [y - 8, y + 6]) { r(ctx, edge, cx - 2, wy, 4, 6); r(ctx, C.glass, cx - 1, wy + 1, 2, 4); }                     // janelinhas
  r(ctx, C.metal, cx - 11, top - 4, 22, 3); r(ctx, C.snow, cx - 10, top - 5, 20, 1);                                              // galeria
  r(ctx, C.metal, cx - 10, top - 9, 20, 1); for (let i = 0; i < 6; i++) r(ctx, C.metal, cx - 10 + i * 4, top - 9, 1, 5);          // grade
  r(ctx, C.metal, cx - 6, top - 18, 12, 1); r(ctx, C.lampGlass, cx - 5, top - 17, 10, 8); r(ctx, '#ffffff', cx - 5, top - 17, 2, 3); // lanterna
  r(ctx, C.metal, cx - 1, top - 17, 2, 8);
  for (let i = 0; i < 9; i++) { // telhado em cone
    const w = 2 * Math.round((2 + i * 1.4) / 2); r(ctx, edge, cx - w / 2 - 1, top - 27 + i, w + 2, 1); r(ctx, red, cx - w / 2, top - 27 + i, w, 1);
    r(ctx, shade(red, 0.2), cx - w / 2, top - 27 + i, 2, 1);
  }
  r(ctx, C.snow, cx - 1, top - 28, 2, 2); r(ctx, C.metal, cx, top - 31, 1, 3);
}

// Loja de presentes (bloco 4x2 no mapa), inspirada nas lojinhas da praça: telhado com neve, toldo listrado e vitrines.
function shop(ctx, x, y) {
  const wall = '#3f8fb0', wallDark = '#2e6f8b', roof = '#a8423f';
  r(ctx, C.shadow, x + 3, y + 30, 64, 3);
  r(ctx, wall, x, y + 3, 64, 29); for (let yy = y + 6; yy < y + 30; yy += 4) r(ctx, '#357f9d', x, yy, 64, 1);
  r(ctx, wallDark, x, y + 3, 64, 1); r(ctx, C.stoneDark, x, y + 30, 64, 2); r(ctx, C.stone, x, y + 30, 64, 1);
  for (let i = 0; i < 14; i++) { // telhado: faixa de telhas com juntas alternadas
    r(ctx, roof, x - 3, y - 11 + i, 70, 1);
    if (i % 4 === 3) r(ctx, shade(roof, -0.25), x - 3, y - 11 + i, 70, 1);
    else for (let k = (i >> 1) & 1 ? 0 : 3; k < 70; k += 6) r(ctx, shade(roof, -0.2), x - 3 + k, y - 11 + i, 1, 1);
  }
  r(ctx, shade(roof, 0.25), x - 3, y - 11, 70, 1); r(ctx, shade(roof, -0.4), x - 3, y + 2, 70, 1);
  r(ctx, C.snow, x - 3, y - 15, 70, 5); r(ctx, C.snowB, x - 3, y - 11, 70, 1);
  for (let i = 0; i < 70; i += 5) r(ctx, C.snow, x - 3 + i, y - 10, 3, 1 + ((i * 7) % 3));
  r(ctx, '#85634a', x + 48, y - 24, 8, 12); r(ctx, C.snow, x + 47, y - 26, 10, 3); r(ctx, 'rgba(255,255,255,0.7)', x + 50, y - 30, 3, 3); r(ctx, 'rgba(255,255,255,0.45)', x + 53, y - 35, 4, 4);
  r(ctx, C.woodDark, x + 20, y + 4, 24, 7); r(ctx, C.woodLight, x + 21, y + 5, 22, 5);   // letreiro com um presente
  r(ctx, C.chair, x + 29, y + 6, 6, 4); r(ctx, '#ffd36b', x + 31, y + 6, 2, 4); r(ctx, '#ffd36b', x + 29, y + 7, 6, 1);
  for (let i = 0; i < 16; i++) { // toldo listrado
    const c = i & 1 ? '#f4f6f8' : C.chair; r(ctx, c, x + i * 4, y + 12, 4, 6); r(ctx, i & 1 ? C.snowShade : C.chairDark, x + i * 4, y + 17, 4, 1);
    r(ctx, c, x + i * 4 + 1, y + 18, 2, 1);
  }
  for (const wx of [x + 4, x + 44]) { // vitrines com presentes
    r(ctx, '#f4f6f8', wx, y + 19, 16, 11); r(ctx, C.glass, wx + 1, y + 20, 14, 9); r(ctx, C.glassLight, wx + 1, y + 20, 4, 1);
    r(ctx, C.chair, wx + 3, y + 24, 5, 5); r(ctx, '#ffd36b', wx + 5, y + 24, 1, 5);
    r(ctx, '#7a5cd6', wx + 9, y + 25, 4, 4); r(ctx, '#ffd36b', wx + 9, y + 26, 4, 1);
  }
  r(ctx, C.woodDark, x + 24, y + 19, 16, 13); r(ctx, C.woodLight, x + 25, y + 20, 14, 12);        // porta
  r(ctx, C.glass, x + 28, y + 22, 8, 5); r(ctx, C.woodDark, x + 31, y + 22, 2, 5); r(ctx, '#ffd36b', x + 37, y + 27, 1, 2);
  r(ctx, C.mat, x + 26, y + 31, 12, 1);
}

// Iglu (bloco 2x2 no mapa): cúpula de blocos de gelo com túnel de entrada virado para a frente.
function igloo(ctx, x, y) {
  const cx = x + 16, base = y + 25;
  r(ctx, C.shadow, x + 5, y + 27, 30, 4);
  for (let yy = y + 8; yy <= base; yy++) { // cúpula: meia elipse, luz à esquerda, sombra à direita
    const w = Math.round(15 * Math.sqrt(1 - ((base - yy) / 17) ** 2)), x0 = cx - w;
    r(ctx, C.outlineSnow, x0 - 1, yy, 2 * w + 2, 1); r(ctx, C.snow, x0, yy, 2 * w, 1);
    r(ctx, '#ffffff', x0, yy, Math.max(1, w >> 2), 1); r(ctx, C.snowShade, x0 + 2 * w - Math.max(2, w >> 1), yy, Math.max(2, w >> 1), 1);
    if ((yy - y) % 5 === 3) r(ctx, C.iceMid, x0, yy, 2 * w, 1); // fileiras de blocos de gelo
    else for (let k = (((yy - y) / 5) | 0) & 1 ? 3 : 8; k < 2 * w; k += 10) r(ctx, C.iceMid, x0 + k, yy, 1, 1);
  }
  ell(ctx, C.outlineSnow, cx, y + 24, 9, 6); ell(ctx, C.snowShade, cx + 1, y + 24, 8, 5); ell(ctx, C.snow, cx, y + 23, 8, 5); // túnel
  r(ctx, C.out, cx - 5, y + 22, 10, 7); ell(ctx, C.out, cx, y + 22, 5, 3); r(ctx, '#2a3a5a', cx - 4, y + 24, 8, 5);               // entrada
  r(ctx, C.snow, cx - 10, y + 27, 20, 2); r(ctx, C.snowShade, cx - 9, y + 29, 18, 1);
}

// Pontos de luz dos marcos (a luz noturna do main.js usa): centro da lanterna do farol e janelas das lojas.
export function landmarks(MAP) {
  const at = (x, y) => MAP[y]?.[x], out = { lighthouses: [], shopWindows: [], igloos: [] };
  MAP.forEach((row, ty) => [...row].forEach((ch, tx) => {
    const first = at(tx - 1, ty) !== ch && at(tx, ty - 1) !== ch;
    if (ch === 'H' && first) out.lighthouses.push([tx * 16 + 16, ty * 16 - 39]);
    if (ch === 'I' && first) out.igloos.push([tx * 16 + 16, ty * 16 + 25]); // centro da entrada
    if (ch === 'K' && first) out.shopWindows.push([tx * 16 + 4, ty * 16 + 19, 16, 11], [tx * 16 + 44, ty * 16 + 19, 16, 11]);
  }));
  return out;
}

// ---------- animados por cima do cenário ----------
// A tela do PC acende quando há alguém sentado na cadeira logo abaixo.
export function drawPcOn(ctx, tx, ty, frame = 0) {
  const x = tx * 16, y = ty * 16;
  r(ctx, C.pcOn, x + 4, y + 2, 8, 5);
  r(ctx, '#ffffff', x + 5, y + 3 + (frame & 1), 5, 1); r(ctx, '#2b9fd6', x + 5, y + 5, 3, 1);
}

// ---------- pinguins ----------
const BODY = [[3, 6, 9], [4, 5, 10], [5, 4, 11], [6, 4, 11], [7, 4, 11], [8, 4, 11], [9, 4, 11], [10, 5, 10], [11, 5, 10], [12, 6, 9]];
function blob(ctx, rows, x, y, outline, fill) { // contorno de 1px em volta do preenchimento
  for (const [ry, a, b] of rows) r(ctx, outline, x + a - 1, y + ry, b - a + 3, 1);
  const [t0, ta, tb] = rows[0], [t1, ba, bb] = rows[rows.length - 1];
  r(ctx, outline, x + ta, y + t0 - 1, tb - ta + 1, 1); r(ctx, outline, x + ba, y + t1 + 1, bb - ba + 1, 1);
  for (const [ry, a, b] of rows) r(ctx, fill, x + a, y + ry, b - a + 1, 1);
}
function torso(ctx, x, y, B) {
  blob(ctx, BODY, x, y, C.out, B);
  for (let i = 2; i < BODY.length - 1; i++) r(ctx, shade(B, -0.3), x + BODY[i][2] - 1, y + BODY[i][0], 2, 1); // lado da sombra
  for (let i = 1; i < 6; i++) r(ctx, shade(B, 0.22), x + BODY[i][1], y + BODY[i][0], 1, 1);                   // lado da luz
}
const shadowUnder = (ctx, x, y) => { r(ctx, C.shadow, x + 3, y + 14, 10, 2); r(ctx, C.shadow, x + 4, y + 13, 8, 1); };
const feet = (ctx, x, y, ph) => {
  for (const [fx, up] of [[4, ph], [9, 1 - ph]]) { r(ctx, C.beak, x + fx, y + 14 - up, 3, 1); r(ctx, C.beakShade, x + fx, y + 15 - up, 3, 1); }
};

// dir: 's' (de frente), 'n' (de costas), 'e'/'w' (de lado). moving: balança ao andar. blink: olhos fechados.
export function drawPenguin(ctx, px, py, { color = C.body, dir = 's', frame = 0, moving = false, blink = false, swim = false } = {}) {
  const x = Math.round(px), y = Math.round(py) + (moving && frame & 1 ? -1 : 0);
  if (dir === 'w') { ctx.save(); ctx.translate(x + 16, 0); ctx.scale(-1, 1); drawPenguin(ctx, 0, py, { color, dir: 'e', frame, moving, blink, swim }); ctx.restore(); return; }
  if (swim) { // só cabeça e peito fora da água, com ondinhas em volta
    ctx.save(); ctx.beginPath(); ctx.rect(x - 2, y, 20, 11); ctx.clip();
    drawPenguin(ctx, x, y + 3, { color, dir: dir === 'n' ? 'n' : 's', blink });
    ctx.restore();
    r(ctx, C.foam, x + 2, y + 11, 12, 1); r(ctx, 'rgba(233,248,252,0.6)', x + 4 + (frame & 1) * 2, y + 13, 8, 1);
    return;
  }
  const B = color, ph = frame & 1, fa = moving ? ph : 0;
  shadowUnder(ctx, x, y + (moving && frame & 1 ? 1 : 0));
  feet(ctx, x, y, moving ? ph : 0);
  torso(ctx, x, y, B);
  if (dir === 's') {
    r(ctx, C.out, x + 1, y + 7 + fa, 1, 4); r(ctx, B, x + 2, y + 7 + fa, 1, 4);
    r(ctx, C.out, x + 14, y + 7 + 1 - fa, 1, 4); r(ctx, B, x + 13, y + 7 + 1 - fa, 1, 4);
    for (const [a, b, c] of [[7, 6, 9], [8, 5, 10], [9, 5, 10], [10, 5, 10], [11, 6, 9]]) r(ctx, C.belly, x + b, y + a, c - b + 1, 1);
    r(ctx, C.bellyShade, x + 6, y + 11, 4, 1); r(ctx, C.bellyShade, x + 10, y + 8, 1, 3);
    if (blink) { r(ctx, C.out, x + 5, y + 5, 2, 1); r(ctx, C.out, x + 9, y + 5, 2, 1); }
    else { r(ctx, C.belly, x + 5, y + 4, 2, 2); r(ctx, C.belly, x + 9, y + 4, 2, 2); r(ctx, C.out, x + 6, y + 5, 1, 1); r(ctx, C.out, x + 9, y + 5, 1, 1); }
    r(ctx, C.beak, x + 7, y + 6, 2, 1); r(ctx, C.beakShade, x + 7, y + 7, 2, 1);
  } else if (dir === 'n') { // de costas: sem barriga, rosto nem bico
    r(ctx, C.out, x + 1, y + 7 + fa, 1, 4); r(ctx, B, x + 2, y + 7 + fa, 1, 4);
    r(ctx, C.out, x + 14, y + 7 + 1 - fa, 1, 4); r(ctx, B, x + 13, y + 7 + 1 - fa, 1, 4);
    r(ctx, shade(B, -0.3), x + 6, y + 10, 4, 2); r(ctx, shade(B, 0.25), x + 6, y + 4, 3, 1);
  } else { // 'e': de lado, olhando para a direita
    r(ctx, C.out, x + 4, y + 7 + fa, 1, 4); r(ctx, shade(B, -0.15), x + 5, y + 7 + fa, 2, 4);
    for (const [a, b, c] of [[7, 8, 11], [8, 8, 11], [9, 8, 11], [10, 8, 10]]) r(ctx, C.belly, x + b, y + a, c - b + 1, 1);
    if (blink) r(ctx, C.out, x + 9, y + 5, 2, 1); else { r(ctx, C.belly, x + 9, y + 4, 2, 2); r(ctx, C.out, x + 10, y + 5, 1, 1); }
    r(ctx, C.beak, x + 12, y + 6, 3, 1); r(ctx, C.beakShade, x + 12, y + 7, 2, 1);
  }
}

// kind 'working': de costas digitando na cadeira. kind 'thinking': de frente, lendo no banco.
export function drawSeated(ctx, px, py, kind, { color = C.body, frame = 0, blink = false } = {}) {
  const x = Math.round(px), y = Math.round(py), s = frame & 1, B = color;
  if (kind === 'working') {
    blob(ctx, BODY, x, y + 1, C.out, B);
    r(ctx, shade(B, -0.3), x + 9, y + 5, 2, 6); r(ctx, shade(B, 0.22), x + 5, y + 5, 1, 3);
    r(ctx, C.out, x + 2, y + 4 + s, 1, 4); r(ctx, B, x + 3, y + 4 + s, 1, 4);      // braços em direção ao teclado
    r(ctx, C.out, x + 13, y + 5 - s, 1, 4); r(ctx, B, x + 12, y + 5 - s, 1, 4);
    chairBack(ctx, x, y);
    return;
  }
  const t = y - 3;
  r(ctx, C.beak, x + 4, t + 14, 3, 1); r(ctx, C.beak, x + 9, t + 14, 3, 1);
  torso(ctx, x, t, B);
  r(ctx, C.out, x + 1, t + 8, 1, 3); r(ctx, B, x + 2, t + 8, 1, 3); r(ctx, C.out, x + 14, t + 8, 1, 3); r(ctx, B, x + 13, t + 8, 1, 3);
  for (const [a, b, c] of [[7, 6, 9], [8, 5, 10], [9, 5, 10]]) r(ctx, C.belly, x + b, t + a, c - b + 1, 1);
  if (blink) { r(ctx, C.out, x + 5, t + 5, 2, 1); r(ctx, C.out, x + 9, t + 5, 2, 1); }
  else { r(ctx, C.belly, x + 5, t + 4, 2, 2); r(ctx, C.belly, x + 9, t + 4, 2, 2); r(ctx, C.out, x + 6, t + 5, 1, 1); r(ctx, C.out, x + 9, t + 5, 1, 1); }
  r(ctx, C.beak, x + 7, t + 6, 2, 1);
  r(ctx, C.out, x + 2, t + 9, 12, 6); r(ctx, C.book, x + 3, t + 10, 10, 4);        // livro aberto na frente da barriga
  r(ctx, C.page, x + 4, t + 10, 4, 3); r(ctx, C.page, x + 8, t + 10, 4, 3);
  r(ctx, C.pageLine, x + (s ? 9 : 5), t + 11, 2, 1); r(ctx, C.pageLine, x + (s ? 5 : 9), t + 12, 2, 1);
}
