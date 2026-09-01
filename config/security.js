const helmet = require('helmet');
const cors = require('cors');

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ['https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
  },
  frameguard: { action: 'deny' }, // Anti-clickjacking
  noSniff: true, // X-Content-Type-Options
  referrerPolicy: { policy: 'no-referrer' },
});

const corsConfig = cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

module.exports = { helmetConfig, corsConfig };
