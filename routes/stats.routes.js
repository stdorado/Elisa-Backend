const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../middleware/auth');
const { obtenerStats, obtenerDatos } = require('../services/stats.service');

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await obtenerStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/data', requireAdmin, async (req, res) => {
  try {
    const datos = await obtenerDatos();
    res.json(datos);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
