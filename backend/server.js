import express from 'express';
import cors from 'cors';
import http from 'http';
import routes from './routes/index.js';
import { broadcastRealtimeUpdate, registerRealtimeClient, verifyRealtimeToken } from './realtime.js';
import { env } from './config/env.js';

const app = express();
const PORT = Number(env.PORT);
const server = http.createServer(app);
const allowedOrigins = new Set(env.CORS_ORIGIN);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && res.statusCode < 400 && req.path.startsWith('/api/')) {
      broadcastRealtimeUpdate({
        method: req.method,
        path: req.path,
      });
    }

    return originalJson(body);
  };

  next();
});

app.get('/api/realtime/stream', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const user = verifyRealtimeToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const cleanup = registerRealtimeClient(res, user);
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    cleanup();
  });
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
  console.log('========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Realtime URL: http://localhost:${PORT}/api/realtime/stream`);
  console.log(`Allowed CORS origins: ${env.CORS_ORIGIN.join(', ')}`);
  console.log('========================================');
});

export default app;
