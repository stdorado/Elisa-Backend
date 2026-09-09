require('dotenv').config();

const app = require('./app');

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'ADMIN_TOKEN',
  'FRONTEND_URL',
  'HMAC_SECRET',
];

const missing = REQUIRED_ENV.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[ERROR] Variables de entorno faltantes: ${missing.join(', ')}`
  );
  process.exit(1);
}

console.log('[OK] Todas las variables de entorno presentes');

const PORT = process.env.PORT || 8080;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}

module.exports = app;
