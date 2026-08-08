// Centralized environment variable validation and access

const getEnv = (key, defaultValue = undefined) => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    console.warn(`Environment variable ${key} is not set.`);
    return '';
  }
  return value;
};

const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL: Required environment variable ${key} is not set.`);
  }
  return value;
};

export const env = {
  // Database
  DATABASE_URL: getEnv('DATABASE_URL', 'file:./dev.db'),
  REDIS_URL: getEnv('REDIS_URL', 'redis://127.0.0.1:6379'),

  // App
  NEXT_PUBLIC_APP_URL: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),

  // Auth
  NEXTAUTH_SECRET: getEnv('NEXTAUTH_SECRET'),
  LOCAL_API_KEY: getEnv('LOCAL_API_KEY', 'devinedesk-local-dev-key'),
  INTERNAL_API_KEY:
    getEnv('INTERNAL_API_KEY') || getEnv('LOCAL_API_KEY') || getEnv('OPENROUTER_API_KEY') || '',

  // Stripe
  STRIPE_SECRET_KEY: getEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: getEnv('STRIPE_WEBHOOK_SECRET'),

  // AI Providers
  OPENROUTER_API_KEY: getEnv('OPENROUTER_API_KEY'),
  AIMLAPI_KEY: getEnv('AIMLAPI_KEY'),
  FAL_KEY: getEnv('FAL_KEY'),
  HF_TOKEN: getEnv('HF_TOKEN'),
  GOAPI_KEY: getEnv('GOAPI_KEY'),

  // Backend
  BACKEND_API_URL: getEnv('BACKEND_API_URL', 'http://localhost:8000'),
  NEXT_PUBLIC_PYTHON_BACKEND_URL: getEnv('NEXT_PUBLIC_PYTHON_BACKEND_URL', 'http://localhost:8000'),

  // Storage (S3/R2)
  AWS_REGION: getEnv('AWS_REGION', 'us-east-1'),
  AWS_ACCESS_KEY_ID: getEnv('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: getEnv('AWS_SECRET_ACCESS_KEY'),
  S3_BUCKET_NAME: getEnv('S3_BUCKET_NAME'),
  S3_ENDPOINT: getEnv('S3_ENDPOINT'), // Optional, for Cloudflare R2 or MinIO
};

export default env;
