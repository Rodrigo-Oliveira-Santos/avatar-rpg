#!/usr/bin/env node
/**
 * dev-game.js — launches the static dev server (npx serve) pointing at a
 * single game.
 *
 * Usage:
 *   node scripts/dev-game.js avatar
 *   node scripts/dev-game.js dnd
 *   node scripts/dev-game.js minecraft
 *
 * Spawns `npx serve public -l 3000` and (best-effort) opens the browser at
 * `http://localhost:3000/?game=<id>#/<id>`. The `?game=` flag is read by
 * `public/js/main.js` and makes the router register *only* that game,
 * skipping the landing page (full single-app experience for testing).
 */

import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const VALID = new Set(['avatar', 'dnd', 'minecraft']);
const PORT = process.env.PORT || '3000';

const game = (process.argv[2] || '').trim().toLowerCase();
if (!VALID.has(game)) {
  console.error(`[dev-game] unknown game "${game}". Use one of: ${[...VALID].join(', ')}`);
  process.exit(1);
}

const url = `http://localhost:${PORT}/?game=${game}#/${game}`;

console.log(`\n  🎮  Iniciando app única: ${game}`);
console.log(`  🌐  URL: ${url}\n`);

const npx = platform() === 'win32' ? 'npx.cmd' : 'npx';
const server = spawn(npx, ['serve', 'public', '-l', PORT], {
  stdio: 'inherit',
  env: process.env,
});

// Best-effort: wait a moment for the server to be ready, then open the
// browser. We don't fail the script if the OS command isn't available.
setTimeout(() => {
  try {
    const cmd =
      platform() === 'darwin'
        ? ['open', [url]]
        : platform() === 'win32'
          ? ['cmd', ['/c', 'start', '""', url]]
          : ['xdg-open', [url]];
    spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref();
  } catch (err) {
    console.warn(`[dev-game] não foi possível abrir o browser automaticamente: ${err?.message || err}`);
    console.warn(`[dev-game] abre manualmente: ${url}`);
  }
}, 1200);

function shutdown() {
  try { server.kill(); } catch {}
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('exit', (code) => process.exit(code ?? 0));
