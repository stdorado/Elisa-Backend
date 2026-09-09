const express = require('express');
const hpp = require('hpp');
const compression = require('compression');

const { helmetConfig, corsConfig } = require('./config/security');

const scanRoutes = require('./routes/scan.routes');
const statsRoutes = require('./routes/stats.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// CORS preflight — tiene que ser lo primero
app.options('*', corsConfig);
app.use(corsConfig);

// Recién después el resto de middlewares
app.use(helmetConfig);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(hpp({
  whitelist: ['zona']
}));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'ELISA',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', (req, res, next) => {
  if (req.method === 'POST') {
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({
        error: 'Content-Type debe ser application/json'
      });
    }
  }
  next();
});

app.use('/api', scanRoutes);
app.use('/api', statsRoutes);
app.use('/api', adminRoutes);
app.use("/", (req, res) => {
    res.send("Welcome back elisa")
})

app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error(`[ERROR] ${err.message} — ${new Date().toISOString()}`);
  res.status(err.status || 500).json({
    error: isProd
      ? 'Error interno del servidor'
      : err.message
  });
});

module.exports = app;
