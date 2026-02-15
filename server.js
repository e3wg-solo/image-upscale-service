/**
 * Production server for Amvera (Docker).
 * Serves static files and proxies /api/google/* to Google Gemini API.
 * API key: VITE_GOOGLE_API_KEY or GOOGLE_API_KEY in Amvera env vars.
 */
import express from 'express';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 80;

// API key from env (same names as Vercel)
const getApiKey = () =>
  process.env.VITE_GOOGLE_API_KEY ||
  process.env.VITE_NANOBANANA_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.NANOBANANA_API_KEY ||
  '';

// CORS middleware for API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key',
};

// Proxy /api/google/* to Google Gemini API
app.use('/api/google', express.json(), async (req, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({
      error: 'API ключ не настроен. Установите VITE_GOOGLE_API_KEY или GOOGLE_API_KEY в переменных окружения Amvera.',
    });
  }

  const model = req.query.model || 'gemini-2.5-flash-image';
  const action = req.query.action || 'generateContent';
  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}`;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    };
    const body = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
      ? JSON.stringify(req.body)
      : undefined;

    const resp = await fetch(targetUrl, { method: req.method, headers, body });
    const data = await resp.text();
    let json;
    try { json = JSON.parse(data); } catch { json = data; }
    res.status(resp.status).json(json);
  } catch (err) {
    res.status(500).json({
      error: 'Ошибка проксирования к Google API',
      details: err?.message || String(err),
    });
  }
});

app.options('/api/google', (_, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end();
});

// Static files from dist
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  res.setHeader('Content-Type', 'text/html');
  createReadStream(indexPath).pipe(res);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
