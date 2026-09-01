const { supabasePublic } = require('../config/supabase');

async function insertarScan(zona) {
  const { error } = await supabasePublic
    .from('scans')
    .insert([{ zona }]);

  if (error) {
    console.error(`[ERROR] Supabase insert: ${error.message} — ${new Date().toISOString()}`);
    throw new Error('Error al registrar el escaneo');
  }
}

module.exports = { insertarScan };
