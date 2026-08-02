import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';

test('CORS middleware allows origin from process.env.CORS_ORIGIN', async () => {
  const stagingOrigin = 'https://social-care-staff-search-staging-frontend.onrender.com';
  process.env.CORS_ORIGIN = stagingOrigin;

  const allowedOrigins = [
    'https://social-care-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:8080',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : [])
  ].filter(Boolean);

  const app = express();
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': stagingOrigin,
        'Access-Control-Request-Method': 'GET',
      },
    });

    assert.equal(res.headers.get('access-control-allow-origin'), stagingOrigin);
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  } finally {
    server.close();
  }
});
