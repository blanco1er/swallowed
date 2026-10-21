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
app.set('trust proxy', 1); // Render puts one proxy in front
app.use(express.static(path.join(here, 'public'), { extensions: ['html'] }));
app.use('/data', express.static(path.join(here, 'data'), { extensions: ['json'] }));

// Per-IP daily limit to protect the free Gemini quota.
const DAILY_LIMIT = Number(process.env.IDENTIFY_PER_IP_PER_DAY) || 40;
const counts = new Map(); // ip -> { day, n }
function overLimit(ip) {
  const day = new Date().toISOString().slice(0, 10);
  const c = counts.get(ip);
  if (!c || c.day !== day) { counts.set(ip, { day, n: 1 }); return false; }
  c.n += 1;
  return c.n > DAILY_LIMIT;
}

app.post('/api/identify', express.json({ limit: '6mb' }), async (req, res) => {
  try {
    if (overLimit(req.ip)) {
      throw new IdentifyError('limit', 'Daily limit reached for photos — you can still type or say it.', 429);
    }
    const result = await identify({ image: req.body?.image, text: req.body?.text }, catalogue);
    res.json(result);
  } catch (err) {
    if (err instanceof IdentifyError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    console.error(err);
    res.status(500).json({ error: { code: 'internal', message: 'Something went wrong — type it instead.' } });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Swallowed on http://localhost:${port}${process.env.GEMINI_API_KEY ? '' : ' (demo mode: no Gemini key, photos disabled)'}`));
