const { createClient } = require('@supabase/supabase-js');

// Cliente público — solo INSERT en /api/scan, limitado por RLS
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Cliente de admin — SELECT y DELETE, solo en rutas con requireAdmin
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = { supabasePublic, supabaseAdmin };
