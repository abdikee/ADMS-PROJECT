import jwt from 'jsonwebtoken';
import { env } from './config/env.js';

const clients = new Set();

function sendEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function verifyRealtimeToken(token) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function registerRealtimeClient(res, user) {
  const client = { res, user };
  clients.add(client);

  sendEvent(res, {
    type: 'connected',
    ts: Date.now(),
    user: {
      id: user.id,
      role: user.role,
    },
  });

  return () => {
    clients.delete(client);
  };
}

export function broadcastRealtimeUpdate(payload = {}) {
  const event = {
    type: 'data-changed',
    ts: Date.now(),
    ...payload,
  };

  for (const client of clients) {
    sendEvent(client.res, event);
  }
}
