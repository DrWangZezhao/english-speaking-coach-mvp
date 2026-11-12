import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getCoachFeedback, isModelReady, MODEL } from './coach.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8' };

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, { model: MODEL, ready: await isModelReady() });
  }
  if (url.pathname === '/api/coach' && req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 1200) return json(res, 413, { error: 'Request too long' });
    }
    let input;
    try { input = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
    if (!input || !['scene', 'question', 'answer'].every((key) => typeof input[key] === 'string') ||
        input.scene.length > 80 || input.question.length > 180 || input.answer.length > 280) {
      return json(res, 400, { error: 'Invalid input' });
    }
    if (!(await isModelReady())) return json(res, 503, { error: 'Local model not ready' });
    try { return json(res, 200, { feedback: await getCoachFeedback(input) }); }
    catch { return json(res, 502, { error: 'Local model failed' }); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
  const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^\/+/, '');
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) return json(res, 403, { error: 'Forbidden' });
  try {
    const content = await readFile(target);
    res.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { json(res, 404, { error: 'Not found' }); }
});

server.listen(port, '127.0.0.1', () => console.log(`SpeakLoop local server: http://127.0.0.1:${port}`));
