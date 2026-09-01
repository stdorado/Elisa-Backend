function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    console.warn(`[WARN] Acceso a ${req.path} sin token — ${new Date().toISOString()}`);
    return res.status(401).json({ error: 'No autorizado' });
  }

  next();
}

module.exports = { requireAdmin };
