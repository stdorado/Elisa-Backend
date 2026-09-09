const express = require('express');
const router = express.Router();

router.post('/admin/verify', (req, res) => {
  const { token } = req.body;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  res.json({ ok: true });
});

const HONEYPOT_PATHS = [
  '/admin/users',
  '/admin/config',
  '/admin/export',
  '/debug',
  '/v1/scan',
  '/v2/scan',
];

HONEYPOT_PATHS.forEach(path => {
  router.all(path, (req, res) => {
    console.warn(
      `[HONEYPOT] Acceso sospechoso a ${path} ` +
      `— método: ${req.method} ` +
      `— ${new Date().toISOString()}`
    );
    res.status(404).json({ error: 'Not found' });
  });
});

module.exports = router;
