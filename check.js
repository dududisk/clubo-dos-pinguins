// Auto-teste do mapa: `npm run check`. Rode depois de editar web/map.js.
import assert from 'node:assert/strict';
import { MAP, SPAWN, walkable } from './web/map.js';
import { penguins, slots, setState, update } from './web/town.js';
import { apply, sweep, state as bridge } from './bridge.js';
import { CMD, EVENTS, PORT, hasHooks, withHooks } from './install.js';

const w = MAP[0].length;
MAP.forEach((r, y) => assert.equal(r.length, w, `linha ${y} tem ${r.length} colunas, esperado ${w}`));
assert(walkable(SPAWN.x, SPAWN.y), 'SPAWN não é andável');

const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const seen = new Set([`${SPAWN.x},${SPAWN.y}`]), q = [[SPAWN.x, SPAWN.y]];
for (const [x, y] of q) for (const [dx, dy] of D) {
  const k = `${x + dx},${y + dy}`;
  if (!seen.has(k) && walkable(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
}
MAP.forEach((row, y) => [...row].forEach((ch, x) => {
  if (walkable(x, y)) assert(seen.has(`${x},${y}`), `tile andável isolado em ${x},${y}`);
  if ('bc'.includes(ch)) assert(D.some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`)), `vaga '${ch}' inalcançável em ${x},${y}`);
}));
console.log(`ok: mapa ${w}x${MAP.length}, ${seen.size} tiles andáveis alcançáveis`);

// Estados + vagas: simula alguns segundos de praça (dt=0.05).
const run = (s) => { for (let i = 0; i < s * 20; i++) update(0.05); };
const seated = () => [...penguins.values()].filter((p) => p.sitting);
const at = (ch) => slots.filter((s) => s.ch === ch);

for (let i = 1; i <= 5; i++) setState('w' + i, 'W' + i, 'working');
run(60);
assert.equal(seated().length, at('c').length, 'cadeiras lotadas: só sentam tantos quanto há cadeiras');
assert(seated().every((p) => p.slot.ch === 'c' && p.x === p.slot.x && p.y === p.slot.y), 'sentado exatamente na cadeira');
assert.equal(new Set(seated().map((p) => p.slot)).size, at('c').length, 'cada um na sua cadeira');

const quem = seated()[0];
setState(quem.id, '', 'idle');
run(60);
assert(!quem.sitting && !quem.slot, 'quem ficou ocioso levantou');
assert.equal(seated().length, at('c').length, 'o 5º pinguim assumiu a cadeira liberada');

const ficou = seated()[0]; // quem trabalha fica na mesa ~10 s depois de parar (o estado oscila entre ferramentas)
setState(ficou.id, '', 'thinking');
run(5);
assert(ficou.sitting && ficou.slot.ch === 'c', 'logo depois de parar ainda está na mesa');
run(50);
assert(!(ficou.sitting && ficou.slot.ch === 'c'), 'passado o prazo, levanta da mesa');

for (const p of penguins.values()) setState(p.id, '', 'thinking');
run(60);
assert(at('c').every((s) => !s.owner), 'trocar para pensando libera as cadeiras');
assert.equal(seated().length, at('b').length, 'só há bancos para 4');
assert(seated().every((p) => p.slot.ch === 'b'), 'pensando senta em banco');

for (const id of [...penguins.keys()]) setState(id, '', 'gone');
assert(slots.every((s) => !s.owner), 'gone libera as vagas na hora');
run(60);
assert.equal(penguins.size, 0, 'e o pinguim vai embora andando até o mar');

for (let i = 0; i < 15; i++) setState('m' + i, '', 'idle'); // limite de pinguins na praça
assert.equal(penguins.size, 12, 'no máximo 12');
setState('m0', '', 'gone'); run(60);
setState('m14', '', 'idle');
assert.equal(penguins.size, 12, 'quando alguém sai, outro entra');
for (const id of [...penguins.keys()]) setState(id, '', 'gone');
run(60);
assert.equal(penguins.size, 0);
console.log('ok: estados, vagas, saída e limite');

// Ponte: hooks do Claude Code -> estados.
const hook = (name, extra = {}) => apply({ session_id: 's1', cwd: String.raw`C:\Users\x\meu-proj`, hook_event_name: name, ...extra });
const nomes = (l) => l.map((e) => `${e.id}:${e.state}`).join(',');
assert.equal(nomes(hook('SessionStart')), 's1:idle');
assert.equal(bridge.get('s1').name, 'meu-proj', 'nome = pasta do projeto (cwd do Windows também)');
assert.equal(nomes(hook('UserPromptSubmit')), 's1:thinking');
assert.equal(nomes(hook('PreToolUse', { tool_use_id: 'a' })), 's1:working');
assert.equal(nomes(hook('PreToolUse', { tool_use_id: 'b' })), '', 'já estava working: sem evento repetido');
assert.equal(nomes(hook('PostToolUse', { tool_use_id: 'a' })), '', 'ferramenta paralela ainda rodando: segue working');
assert.equal(nomes(hook('PostToolUseFailure', { tool_use_id: 'b' })), 's1:thinking');
assert.equal(nomes(hook('SubagentStart', { agent_id: 'g1', agent_type: 'Explore' })), 'g1:thinking');
assert.equal(nomes(hook('PreToolUse', { agent_id: 'g1', agent_type: 'Explore', tool_use_id: 'c' })), 'g1:working', 'ferramenta de subagente move o pinguim do subagente');
assert.equal(bridge.get('s1').state, 'thinking', 'e não o da sessão principal');
assert.equal(nomes(hook('SubagentStop', { agent_id: 'g1', agent_type: 'Explore' })), 'g1:gone');
assert.equal(nomes(hook('PreToolUse', { tool_use_id: 'd' })) + nomes(hook('Stop')), 's1:workings1:idle', 'Stop zera ferramentas pendentes');
assert.equal(nomes(hook('SessionEnd')), 's1:gone');
assert.equal(bridge.size, 0);
hook('SessionStart'); // ferramenta e detalhe vão junto, só enquanto a ferramenta roda
const [pre] = hook('PreToolUse', { tool_use_id: 'e', tool_name: 'Bash', tool_input: { command: 'npm test' } });
assert.deepEqual([pre.tool, pre.detail], ['Bash', 'npm test']);
assert.equal(hook('PostToolUse', { tool_use_id: 'e' })[0].tool, '', 'depois da ferramenta, limpa');
hook('SessionEnd');
assert.equal(hook('Stop').length, 0, 'evento atrasado não ressuscita quem já saiu');
assert.equal(nomes(hook('SessionStart')), 's1:idle', 'mas SessionStart (retomada) volta');
assert.equal(nomes(hook('PreToolUse', { tool_use_id: 'f' })), 's1:working', 'e os eventos seguintes valem');
assert.equal(sweep(Date.now() + 29 * 60e3).length, 0, 'dentro do prazo continua');
assert.equal(nomes(sweep(Date.now() + 31 * 60e3)), 's1:gone', 'sem sinal por 30 min: some');
assert.equal(bridge.size, 0);
for (let i = 0; i < 70; i++) apply({ id: 'c' + i, state: 'idle' });
assert.equal(bridge.size, 64, 'limite de ids guardados');
for (let i = 0; i < 70; i++) apply({ id: 'c' + i, state: 'gone' });
// contrato genérico + entradas inválidas
assert.equal(nomes(apply({ id: 'x', name: 'Codex', state: 'working' })), 'x:working');
assert.equal(apply({ id: 'x', state: 'dançando' }).length + apply(null).length + apply('x').length + apply({ hook_event_name: 'Stop' }).length, 0);
assert.equal(apply({ id: 'y', name: 'n'.repeat(500), state: 'idle' })[0].name.length, 40, 'nome limitado');
apply({ id: 'x', state: 'gone' }); apply({ id: 'y', state: 'gone' });
console.log('ok: ponte de eventos');

// Instalador de hooks: idempotente, reversível e sem tocar nos hooks dos outros.
const deles = { hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo meu-hook' }] }], Notification: [{ matcher: 'x', hooks: [] }] }, model: 'x' };
const com = withHooks(deles);
assert(hasHooks(com) && !hasHooks(deles));
assert.equal(Object.keys(com.hooks).length, new Set([...EVENTS, 'Notification']).size, 'um grupo nosso por evento');
assert.equal(com.hooks.Stop[0].hooks[0].command, 'echo meu-hook', 'hook alheio continua primeiro');
assert.equal(com.hooks.Stop.length, 2);
assert.equal(com.model, 'x');
assert.deepEqual(withHooks(com), com, 'instalar de novo não muda nada');
assert.deepEqual(withHooks(com, true), deles, 'remover devolve exatamente o que havia (inclusive grupo alheio vazio)');
assert.deepEqual(withHooks({}, true), {}, 'remover do nada não cria nada');
assert(CMD.includes(`:${PORT}/event`) && com.hooks.SessionEnd[0].hooks[0].async === undefined && com.hooks.PreToolUse[0].hooks[0].async === true);
console.log('ok: instalador de hooks');
