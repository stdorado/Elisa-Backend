const { supabasePublic } = require('../config/supabase');

async function insertarScan(zona) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 8000)
  );

  const { error } = await Promise.race([
    supabasePublic.from('scans').insert([{ zona }]),
    timeoutPromise
  ]);

  if (error) {
    console.error(`[ERROR] Supabase insert: ${error.message} — ${new Date().toISOString()}`);
    throw new Error('Error al registrar el escaneo');
  }
}

module.exports = { insertarScan };
