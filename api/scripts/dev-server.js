#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */
import { spawn } from 'child_process';
import { execSync } from 'child_process';

// Run post-build scripts
console.log('Running post-build scripts...');
execSync('tsc-alias', { stdio: 'inherit' });
execSync('node scripts/fix-esm-imports.js', { stdio: 'inherit' });

// Start the server with environment file
console.log('Starting development server...');
const server = spawn('node', ['--env-file=.env', 'dist/index.js'], {
  stdio: 'inherit',
  shell: false,
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code || 0);
});
