const express = require('express');

const { helmetConfig, corsConfig } = require('./config/security');

const scanRoutes = require('./routes/scan.routes');
const statsRoutes = require('./routes/stats.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// CORS preflight — tiene que ser lo primero
app.options('*', corsConfig);
app.use(corsConfig);

// Recién después el resto de middlewares
app.use(helmetConfig);
app.use(express.json());

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

module.exports = app;
