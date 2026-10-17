// Traduz eventos em estados de pinguim. Aceita o JSON dos hooks do Claude Code
// ou o contrato genérico { id, name, state, tool?, detail? } (qualquer outra ferramenta de IA pode usá-lo).
export const state = new Map(); // id -> { name, state, tool, detail }
const tools = new Map(); // id -> ids de ferramentas em andamento (em paralelo, continua "working" até a última)
const lastSeen = new Map(); // id -> ms do último evento (para sumir quem foi embora sem avisar)
const ended = new Map(); // id -> ms em que saiu (descarta eventos atrasados: hooks assíncronos chegam fora de ordem)
const STATES = new Set(['idle', 'thinking', 'working', 'gone']);
const TTL = 30 * 60e3, GRACE = 10e3, MAX_IDS = 64;
const NOTOOL = { tool: '', detail: '' };
const clip = (s, n) => (typeof s === 'string' ? s.slice(0, n) : '');
const detailOf = (i) => clip(i?.command ?? i?.file_path ?? i?.pattern ?? i?.url ?? i?.description ?? i?.query, 120);

function drop(id, now, out) {
  if (!state.delete(id)) return;
  tools.delete(id); lastSeen.delete(id); ended.set(id, now);
  out.push({ id, state: 'gone' });
}

// Devolve só o que mudou, no formato { id, name, state, tool, detail }.
export function apply(ev, now = Date.now()) {
  const out = [];
  if (!ev || typeof ev !== 'object') return out;
  const set = (id, name, st, extra) => {
    id = clip(id, 100);
    if (!id) return;
    if (st === 'gone') return drop(id, now, out);
    const cur = state.get(id);
    if (!cur && state.size >= MAX_IDS) return;
    lastSeen.set(id, now);
    const next = { name: clip(name, 40) || cur?.name || id.slice(0, 6), state: st, tool: cur?.tool ?? '', detail: cur?.detail ?? '', ...extra };
    if (cur && Object.keys(next).every((k) => cur[k] === next[k])) return;
    state.set(id, next);
    out.push({ id, ...next });
  };

  const e = ev.hook_event_name;
  if (!e) {
    if (STATES.has(ev.state)) set(ev.id, ev.name, ev.state, { tool: clip(ev.tool, 40), detail: clip(ev.detail, 120) });
    return out;
  }

  // Subagente = pinguim próprio (id do agente); o resto é a sessão principal (nome = pasta do projeto).
  const sub = ev.agent_id, id = clip(sub ?? ev.session_id, 100);
  if (!id) return out;
  if (e === 'SessionStart') ended.delete(id); // retomada da mesma sessão
  else if (now - (ended.get(id) ?? -Infinity) < GRACE) return out;
  const name = sub ? ev.agent_type : clip(ev.cwd, 500).split(/[\\/]/).filter(Boolean).pop();
  if (!tools.has(id)) tools.set(id, new Set());
  const busy = tools.get(id), tool = ev.tool_use_id ?? '?';

  switch (e) {
    case 'UserPromptSubmit': busy.clear(); set(id, name, 'thinking', NOTOOL); break;
    case 'PreToolUse': busy.add(tool); set(id, name, 'working', { tool: clip(ev.tool_name, 40), detail: detailOf(ev.tool_input) }); break;
    case 'PostToolUse': case 'PostToolUseFailure':
      busy.delete(tool);
      if (busy.size) set(id, name, 'working'); else set(id, name, 'thinking', NOTOOL);
      break;
    case 'SubagentStart': set(id, name, 'thinking', NOTOOL); break;
    case 'SessionStart': case 'Stop': case 'StopFailure': busy.clear(); set(id, name, 'idle', NOTOOL); break;
    case 'SessionEnd': case 'SubagentStop': set(id, name, 'gone'); break;
  }
  if (!state.has(id)) tools.delete(id);
  return out;
}

// Chamar de tempos em tempos: remove quem ficou 30 min sem nenhum sinal (sessão morta sem SessionEnd).
export function sweep(now = Date.now()) {
  const out = [];
  for (const [id, t] of lastSeen) if (now - t > TTL) drop(id, now, out);
  for (const [id, t] of ended) if (now - t > GRACE) ended.delete(id);
  return out;
}
