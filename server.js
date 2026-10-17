import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { apply, state, sweep } from './bridge.js';
import { PORT } from './install.js';

const MAX_BODY = 16 << 20; // PostToolUse carrega a resposta inteira da ferramenta: pode ser grande
const ROOT = join(import.meta.dirname, 'web');
const HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]); // recusa outros Host (DNS rebinding)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const clients = new Set();
const send = (res, msg) => res.write(`data: ${JSON.stringify(msg)}\n\n`);
const broadcast = (list) => list.forEach((m) => clients.forEach((c) => send(c, m)));
setInterval(() => broadcast(sweep()), 60e3).unref(); // agentes que sumiram sem avisar

function onEvent(req, res) {
  if (req.headers.origin) return res.writeHead(403).end(); // hooks (curl) não mandam Origin; páginas web mandam
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (c) => {
    body += c;
    if (body.length > MAX_BODY) { res.writeHead(413).end(); req.destroy(); }
  });
  req.on('end', () => {
    try { broadcast(apply(JSON.parse(body))); } catch { /* JSON inválido: ignora */ }
    res.writeHead(204).end();
  });
}

createServer(async (req, res) => {
  if (!HOSTS.has(req.headers.host)) return res.writeHead(403).end();
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (req.method === 'POST' && path === '/event') return onEvent(req, res);
    if (path === '/stream') { // SSE: o navegador reconecta sozinho; a cada conexão recebe o estado completo
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store' });
      send(res, { snapshot: [...state].map(([id, v]) => ({ id, ...v })) });
      clients.add(res);
      return req.on('close', () => clients.delete(res));
    }
    const file = resolve(ROOT, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(ROOT + sep)) return res.writeHead(403).end();
    const data = await readFile(file); // ler antes de enviar o cabeçalho: arquivo ausente cai no 404 abaixo
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch {
    if (!res.headersSent) res.writeHead(404).end();
  }
}).on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `A porta ${PORT} já está em uso: já existe um Clubo dos penguins rodando? Abra http://127.0.0.1:${PORT}` : e.message);
  process.exit(1);
}).listen(PORT, '127.0.0.1', () => console.log(`Clubo dos penguins em http://127.0.0.1:${PORT}`));
