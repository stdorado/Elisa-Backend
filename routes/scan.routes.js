const express = require('express');
const router = express.Router();

const { scanLimiter } = require('../middleware/rateLimiter');
const { validateZona } = require('../middleware/validate');
const { verificarHMAC } = require('../middleware/hmac');
const { insertarScan } = require('../services/scan.service');

router.post('/scan', scanLimiter, validateZona, verificarHMAC, async (req, res) => {
  const { zona } = req.body;

  try {
    await insertarScan(zona);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
