const { supabaseAdmin } = require('../config/supabase');

async function obtenerDatos() {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 8000)
  );

  const { data, error } = await Promise.race([
    supabaseAdmin
      .from('scans')
      .select('id, zona, created_at')
      .order('created_at', { ascending: false }),
    timeoutPromise
  ]);

  if (error) {
    console.error(`[ERROR] Supabase select: ${error.message} — ${new Date().toISOString()}`);
    throw new Error('Error al obtener los datos');
  }

  return data;
}

async function obtenerStats() {
  const registros = await obtenerDatos();

  const total = registros.length;

  const hoyStr = new Date().toISOString().slice(0, 10);
  const hoy = registros.filter((r) => r.created_at.slice(0, 10) === hoyStr).length;

  const porZona = {};
  const porHora = {};

  for (const registro of registros) {
    porZona[registro.zona] = (porZona[registro.zona] || 0) + 1;

    const hora = new Date(registro.created_at).getHours();
    const horaKey = `${String(hora).padStart(2, '0')}:00`;
    porHora[horaKey] = (porHora[horaKey] || 0) + 1;
  }

  let zonaLider = null;
  for (const [nombre, cantidad] of Object.entries(porZona)) {
    if (!zonaLider || cantidad > zonaLider.cantidad) {
      zonaLider = { nombre, cantidad };
    }
  }

  // No existe columna `device` en la tabla (restricción legal — sin datos
  // identificatorios), por lo que no hay forma real de distinguir mobile/desktop.
  const porDevice = { mobile: 0, desktop: 0, unknown: total };

  return {
    total,
    hoy,
    zona_lider: zonaLider,
    por_zona: porZona,
    por_hora: porHora,
    por_device: porDevice,
  };
}

module.exports = { obtenerStats, obtenerDatos };
