// Como editar o settings.json do Claude Code para ele avisar o servidor a cada evento. Só transforma objetos (sem arquivos).
export const PORT = 8787;
export const MARK = `127.0.0.1:${PORT}/event`; // é por esta URL que reconhecemos o que é nosso
// async: não atrasa o Claude; `|| true`: silencioso se o servidor estiver desligado.
export const CMD = `curl -s -m 1 -X POST -H 'Content-Type: application/json' --data-binary @- http://${MARK} >/dev/null 2>&1 || true`;
export const EVENTS = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'Stop', 'StopFailure', 'SubagentStart', 'SubagentStop'];

const ours = (h) => h.command?.includes(MARK);
// Tira os nossos de um grupo; devolve o grupo intacto se não havia nenhum, ou null se só havia os nossos.
const strip = (g) => {
  const all = g.hooks ?? [], keep = all.filter((h) => !ours(h));
  return keep.length === all.length ? g : keep.length ? { ...g, hooks: keep } : null;
};

export const hasHooks = (settings) => Object.values(settings.hooks ?? {}).some((groups) => groups.some((g) => (g.hooks ?? []).some(ours)));

// Devolve uma cópia com os nossos hooks instalados (ou removidos, com remove=true). Idempotente e não toca nos hooks dos outros.
export function withHooks(settings, remove = false) {
  const out = structuredClone(settings), hooks = (out.hooks ??= {});
  for (const ev of Object.keys(hooks)) {
    if (!remove && EVENTS.includes(ev)) continue; // estes são atualizados no mesmo lugar, abaixo
    hooks[ev] = hooks[ev].map(strip).filter(Boolean);
    if (!hooks[ev].length) delete hooks[ev];
  }
  if (!remove) for (const ev of EVENTS) {
    // SessionEnd roda no encerramento do Claude: sem async para o curl terminar antes do processo sair.
    const fresh = { type: 'command', command: CMD, ...(ev === 'SessionEnd' ? {} : { async: true }) };
    const groups = (hooks[ev] ??= []), g = groups.find((x) => x.hooks?.some(ours));
    if (g) g.hooks = g.hooks.map((h) => (ours(h) ? fresh : h)); else groups.push({ hooks: [fresh] });
  }
  if (!Object.keys(hooks).length) delete out.hooks;
  return out;
}
