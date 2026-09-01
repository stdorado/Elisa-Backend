const express = require('express');
const router = express.Router();

router.post('/admin/verify', (req, res) => {
  const { token } = req.body;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  res.json({ ok: true });
});

module.exports = router;
