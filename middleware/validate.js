const ZONAS_VALIDAS = [
  'centro', 'banco', 'padel', 'tero',
  'san-ceferino', 'polideportivo', 'boulevard', 'clubes',
];

function validateZona(req, res, next) {
  const { zona } = req.body;

  if (!zona || typeof zona !== 'string') {
    return res.status(400).json({ error: 'Zona requerida' });
  }

  const zonaLimpia = zona.toString().trim().toLowerCase().slice(0, 50);
  if (!ZONAS_VALIDAS.includes(zonaLimpia)) {
    console.warn(
      `[WARN] Zona inválida: '${zonaLimpia}' — requestId: ${req.requestId} ` +
      `— ${new Date().toISOString()}`
    );
    return res.status(400).json({ error: 'Zona inválida' });
  }

  req.body.zona = zonaLimpia;
  next();
}

module.exports = { validateZona, ZONAS_VALIDAS };
