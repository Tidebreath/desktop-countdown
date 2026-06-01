// Wrapper script that clears ELECTRON_RUN_AS_NODE before spawning Electron
// This fixes an issue where the env var prevents Electron from loading its API modules

const { spawn } = require('child_process');
const path = require('path');

// Clear the problematic env var
delete process.env.ELECTRON_RUN_AS_NODE;

// Find the electron binary
const electronPath = require('electron');
const args = [path.resolve(__dirname)];

// Spawn Electron detached from the parent CMD window.
// When the CMD window is closed, the detached process keeps running.
const child = spawn(electronPath, args, {
  stdio: 'ignore',       // detach requires stdio: 'ignore'
  detached: true,
  env: { ...process.env } // pass cleaned env
});

// Unref the child so the parent (start.js) can exit without waiting.
child.unref();

// Parent exits immediately — the electron process lives on independently.
process.exit(0);
