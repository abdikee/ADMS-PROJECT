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

// Map API paths to entity names for selective frontend refresh
const PATH_TO_ENTITY = {
  '/api/students': 'students',
  '/api/teachers': 'teachers',
  '/api/subjects': 'subjects',
  '/api/classes': 'classes',
  '/api/marks': 'marks',
  '/api/departments': 'departments',
  '/api/exam-types': 'examTypes',
  '/api/academic-years': 'academicYears',
  '/api/course-registrations': 'courseRegistrations',
  '/api/profile': 'profile',
};

function resolveEntity(path = '') {
  for (const [prefix, entity] of Object.entries(PATH_TO_ENTITY)) {
    if (path.startsWith(prefix)) return entity;
  }
  return null;
}

export function broadcastRealtimeUpdate(payload = {}) {
  const entity = resolveEntity(payload.path);
  const event = {
    type: 'data-changed',
    ts: Date.now(),
    entity,
    ...payload,
  };

  for (const client of clients) {
    sendEvent(client.res, event);
  }
}
