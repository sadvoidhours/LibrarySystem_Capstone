const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((name) => !String(process.env[name] || '').trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = { validateEnv };