// Sons sintetizados na hora (sem arquivos de áudio). Desligado por padrão: só toca se a pessoa ligar.
let ac = null, on = false;
export const isOn = () => on;
addEventListener('pointerdown', () => ac?.resume()); // navegadores só liberam áudio depois de um gesto

export function setOn(v) {
  on = v;
  if (on) tone(880, 0.06);
}
const ctx = () => (ac ??= new AudioContext());

function tone(f, d, { type = 'square', vol = 0.035, at = 0, slide = 0 } = {}) {
  if (!on) return;
  const a = ctx(), t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(f + slide, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d);
}

function noise(d, vol = 0.04) {
  if (!on) return;
  const a = ctx(), n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), g = a.createGain();
  s.buffer = buf; g.gain.value = vol; s.connect(g).connect(a.destination); s.start();
}

export const sfx = {
  type: () => [0, 0.07, 0.15].forEach((at, i) => tone(1500 + i * 140, 0.03, { at, vol: 0.02 })), // teclas
  page: () => noise(0.16, 0.03), // página virando
  splash: () => { noise(0.22, 0.05); tone(260, 0.15, { type: 'sine', slide: -120, vol: 0.04 }); },
};
