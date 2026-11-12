import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'dist'), { recursive: true });
await cp(path.join(root, 'web'), path.join(root, 'dist'), { recursive: true });
await build({
  entryPoints: [path.join(root, 'src/model-worker.mjs')],
  outfile: path.join(root, 'dist/model-worker.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  mainFields: ['browser', 'module', 'main'],
  logLevel: 'warning'
});
console.log('Built dist/');
