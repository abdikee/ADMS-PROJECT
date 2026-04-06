import dotenv from 'dotenv';

dotenv.config();

function readEnvValue(key) {
  const rawValue = process.env[key];
  if (rawValue === undefined || rawValue === null) {
    return rawValue;
  }

  return String(rawValue).trim();
}

function sanitizeCorsOrigin(value) {
  const trimmed = String(value).trim();
  const unquoted = trimmed.replace(/^['"]|['"]$/g, '');
  const singleLine = unquoted.replace(/[\r\n]+/g, '');

  return singleLine;
}

function parseCorsOrigins(value) {
  return sanitizeCorsOrigin(value)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const requiredEnvironmentVariables = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
  'NODE_ENV',
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter((key) => {
  const value = readEnvValue(key);
  return value === undefined || value === null || String(value).trim() === '';
});

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`
  );
}

const databaseUrl = readEnvValue('DATABASE_URL');
const jwtSecret = readEnvValue('JWT_SECRET');
const corsOrigins = parseCorsOrigins(readEnvValue('CORS_ORIGIN'));
const nodeEnv = readEnvValue('NODE_ENV');
const port = readEnvValue('PORT') || '5000';
const supabaseUrl = readEnvValue('SUPABASE_URL');
const supabaseServiceKey = readEnvValue('SUPABASE_SERVICE_KEY');

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const allowedNodeEnvironments = new Set(['development', 'test', 'production']);
if (!allowedNodeEnvironments.has(nodeEnv)) {
  throw new Error('NODE_ENV must be one of: development, test, production');
}

if (corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must contain at least one valid origin URL');
}

export const env = {
  DATABASE_URL: databaseUrl,
  JWT_SECRET: jwtSecret,
  CORS_ORIGIN: corsOrigins,
  NODE_ENV: nodeEnv,
  PORT: port,
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_KEY: supabaseServiceKey,
};
