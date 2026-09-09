const crypto = require('crypto');

function verificarHMAC(req, res, next) {
  const token = req.body.token;
  const zona  = req.body.zona;

  if (!token || !zona) {
    console.warn(`[WARN] Request sin token HMAC — requestId: ${req.requestId} — ${new Date().toISOString()}`);
    return res.status(400).json({ error: 'Token requerido' });
  }

  const esperado = crypto
    .createHmac('sha256', process.env.HMAC_SECRET)
    .update(zona)
    .digest('hex');

  const tokenBuffer   = Buffer.from(token,    'hex');
  const esperadoBuffer = Buffer.from(esperado, 'hex');

  if (
    tokenBuffer.length !== esperadoBuffer.length ||
    !crypto.timingSafeEqual(tokenBuffer, esperadoBuffer)
  ) {
    console.warn(`[WARN] Token HMAC inválido para zona ${zona} — requestId: ${req.requestId} — ${new Date().toISOString()}`);
    return res.status(401).json({ error: 'Token inválido' });
  }

  next();
}

module.exports = { verificarHMAC };
