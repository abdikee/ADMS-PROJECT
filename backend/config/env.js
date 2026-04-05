import dotenv from 'dotenv';

dotenv.config();

const requiredEnvironmentVariables = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
  'NODE_ENV',
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter((key) => {
  const value = process.env[key];
  return value === undefined || value === null || String(value).trim() === '';
});

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`
  );
}

if (String(process.env.JWT_SECRET).trim().length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const allowedNodeEnvironments = new Set(['development', 'test', 'production']);
if (!allowedNodeEnvironments.has(process.env.NODE_ENV)) {
  throw new Error('NODE_ENV must be one of: development, test, production');
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || '5000',
};
