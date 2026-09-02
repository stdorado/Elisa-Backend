const express = require('express');

const { helmetConfig, corsConfig } = require('./config/security');

const scanRoutes = require('./routes/scan.routes');
const statsRoutes = require('./routes/stats.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(helmetConfig);
app.options('*', corsConfig);
app.use(corsConfig);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'ELISA',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', scanRoutes);
app.use('/api', statsRoutes);
app.use('/api', adminRoutes);
app.use("/", (req, res) => {
    res.send("Welcome back elisa")
})

module.exports = app;
