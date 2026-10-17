// Demo sem servidor (GitHub Pages ou ?demo): agentes fictícios que pensam, trabalham, descansam e vão embora.
const NAMES = ['api-pagamentos', 'site', 'app-mobile', 'Explore', 'code-review', 'docs', 'infra', 'Plan'];
const DETAIL = { Bash: 'npm test', Edit: 'src/app.js', Read: 'README.md', Grep: 'TODO', Write: 'docs/api.md', WebFetch: 'https://nodejs.org' };
const CICLO = ['thinking', 'working', 'thinking', 'working', 'idle'];
const rnd = (a, b) => (a + Math.random() * (b - a)) * 1000;

export function run(setState) {
  let n = 0;
  function agent() {
    const id = 'demo' + ++n, name = NAMES[(n - 1) % NAMES.length];
    let turns = 8 + ((Math.random() * 8) | 0), i = 0;
    setState(id, name, 'idle');
    (function next() {
      if (turns-- <= 0) { setState(id, name, 'gone'); return setTimeout(agent, rnd(2, 6)); }
      const st = CICLO[i++ % CICLO.length], tool = st === 'working' ? Object.keys(DETAIL)[(Math.random() * 6) | 0] : '';
      setState(id, name, st, tool, DETAIL[tool] ?? '');
      setTimeout(next, st === 'working' ? rnd(3, 8) : rnd(3, 7));
    })();
  }
  for (let k = 0; k < 6; k++) setTimeout(agent, k * 1500);
}
