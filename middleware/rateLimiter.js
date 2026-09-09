const rateLimit = require('express-rate-limit');

const MAX_SCANS = process.env.NODE_ENV === 'production' ? 5 : 100;

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: MAX_SCANS, // máx por IP — 5 en producción, 100 en desarrollo
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(
      `[WARN] Rate limit excedido — requestId: ${req.requestId} ` +
      `— ${new Date().toISOString()}`
    );
    res.status(429).json({ error: 'Demasiadas peticiones. Intentá más tarde.' });
  },
});

module.exports = { scanLimiter };
