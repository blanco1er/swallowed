// Swallowed — small Express server.
// Serves the page, the curated data, and POST /api/identify
// (spec.md > Where It Runs and How Someone Tries It, spec.md > Photo and text identification (server)).

import express from 'express';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { identify, IdentifyError } from './src/identify.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const catalogue = JSON.parse(readFileSync(path.join(here, 'data/toxins.json'), 'utf8'));
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);
// Marks our own responses, so the offline cache never stores Render's "waking up" page by mistake (public/sw.js).
app.use((req, res, next) => { res.set('X-Swallowed', '1'); next(); });
// Cheap endpoint for Render's health check, the keep-warm ping and the page's "wake up" request.
app.get('/healthz', (req, res) => res.set('cache-control', 'no-store').type('text').send('ok'));
app.use(express.static(path.join(here, 'public'), { extensions: ['html'] }));
app.use('/data', express.static(path.join(here, 'data'), { extensions: ['json'] }));

// Daily limits to protect the free Gemini quota: per person and for the whole app.
// On Render, Cloudflare and Render's proxy sit in front, so req.ip can be a shared proxy address;
// Cloudflare's CF-Connecting-IP is the visitor's real address.
const DAILY_LIMIT = Number(process.env.IDENTIFY_PER_IP_PER_DAY) || 40;
const GLOBAL_DAILY = Number(process.env.IDENTIFY_GLOBAL_PER_DAY) || 800;
const clientIp = (req) => req.get('cf-connecting-ip') || req.ip;
const counts = new Map(); // ip -> n, for today
let today = { day: '', n: 0 };
function overLimit(ip) {
  const day = new Date().toISOString().slice(0, 10);
  if (today.day !== day) { today = { day, n: 0 }; counts.clear(); }
  today.n += 1;
  const n = (counts.get(ip) || 0) + 1;
  counts.set(ip, n);
  return n > DAILY_LIMIT || today.n > GLOBAL_DAILY;
}

app.post('/api/identify', express.json({ limit: '6mb' }), async (req, res) => {
  try {
    if (overLimit(clientIp(req))) {
      throw new IdentifyError('limit', 'Daily limit reached for recognition — you can still pick from the list.', 429);
    }
    const text = typeof req.body?.text === 'string' ? req.body.text : undefined;
    const image = typeof req.body?.image === 'string' ? req.body.image : undefined;
    if (!text && !image) throw new IdentifyError('empty', 'Show, type or say what your pet ate.');
    const result = await identify({ image, text }, catalogue);
    res.json(result);
  } catch (err) {
    if (err instanceof IdentifyError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    console.error(err);
    res.status(500).json({ error: { code: 'internal', message: 'Something went wrong — type it instead.' } });
  }
});

// Anything Express itself rejects (body too large, broken JSON) still answers in JSON, never an HTML page.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const tooLarge = err.type === 'entity.too.large';
  res.status(err.status || 500).json({ error: { code: err.type || 'bad-request', message: tooLarge ? 'That photo is too large. Try again.' : 'That request could not be read — type it instead.' } });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Swallowed on http://localhost:${port}${process.env.GEMINI_API_KEY ? '' : ' (demo mode: no Gemini key, photos disabled)'}`));
