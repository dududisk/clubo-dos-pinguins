#!/usr/bin/env node
// clubo-dos-pinguins                       sobe a praça (e oferece instalar os hooks se ainda não estiverem)
// clubo-dos-pinguins hooks [--yes] [--remove] [arquivo]
//     sem --yes só MOSTRA o que mudaria; com --yes grava (cópia em <arquivo>.bak-pinguins).
//     arquivo padrão: ~/.claude/settings.json (vale para todos os projetos).
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { CMD, EVENTS, PORT, hasHooks, withHooks } from './install.js';

const args = process.argv.slice(2);
const SETTINGS = join(homedir(), '.claude', 'settings.json');
const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '{}');

async function editHooks(file, remove, confirm) {
  const cur = JSON.parse(read(file)), next = withHooks(cur, remove);
  if (JSON.stringify(cur) === JSON.stringify(next)) return console.log(`${file}: nada a mudar.`);
  console.log(`${file}\n${remove ? 'REMOVE' : 'ADICIONA'} hooks (${EVENTS.join(', ')}) com o comando:\n  ${CMD}\n`);
  if (!(await confirm())) return console.log('Nada foi gravado.');
  if (existsSync(file)) copyFileSync(file, file + '.bak-pinguins');
  writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  console.log('Gravado. Sessões já abertas só passam a usar os hooks depois de reiniciadas.');
}

async function main() {
  if (args[0] === 'hooks') {
    const yes = args.includes('--yes');
    const file = args.slice(1).find((a) => !a.startsWith('--')) ?? SETTINGS;
    return editHooks(file, args.includes('--remove'), async () => {
      if (!yes) console.log('Rode de novo com --yes para aplicar.');
      return yes;
    });
  }
  if (args.some((a) => a === '-h' || a === '--help')) return console.log(`Uso:\n  clubo-dos-pinguins [--no-hooks]\n  clubo-dos-pinguins hooks [--yes] [--remove] [arquivo]\n\nA praça abre em http://127.0.0.1:${PORT}`);

  // Sem os hooks nenhum agente aparece: oferece instalar (só em terminal interativo, e só se ainda não estiverem).
  if (!args.includes('--no-hooks') && process.stdin.isTTY && !hasHooks(JSON.parse(read(SETTINGS)))) {
    console.log('Os hooks do Claude Code ainda não estão instalados; sem eles nenhum agente aparece na praça.\n');
    await editHooks(SETTINGS, false, async () => {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const ok = /^s/i.test((await rl.question('Instalar agora? [s/N] ')).trim());
      rl.close();
      return ok;
    });
  }
  await import('./server.js');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
