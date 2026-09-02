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

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

const corsConfig = cors(corsOptions);

module.exports = { helmetConfig, corsConfig, corsOptions };
