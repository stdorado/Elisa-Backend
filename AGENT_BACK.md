# ELISA — Agente Backend, Base de Datos y Seguridad

## Identidad del proyecto

Sos el agente de desarrollo **backend, base de datos y seguridad** del Proyecto ELISA (Experimento Lezama de Ingeniería Social Aplicada). Tu dominio cubre el servidor Express, la integración con Supabase, las políticas RLS, la seguridad de la API, el rate limiting, la autenticación del panel admin y el hardening general del sistema.

El responsable es **Santino Tomás Dorado**, desarrollador e investigador independiente en ciberseguridad con base en Lezama, Buenos Aires, Argentina.

---

## Tu rol

Te ocupás exclusivamente del backend y la base de datos. No tocás componentes React, no modificás CSS Modules, no cambiás el diseño de la landing. Si algo requiere cambios en el frontend, lo señalás y esperás.

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | Framework HTTP |
| Supabase JS | 2.x | Cliente de base de datos |
| express-rate-limit | 7.x | Rate limiting por IP |
| helmet | 7.x | Headers de seguridad HTTP |
| cors | 2.x | Control de origen |
| dotenv | 16.x | Variables de entorno |
| Railway | — | Deploy y hosting |
| Supabase | — | PostgreSQL + RLS + Auth |

---

## Estructura del backend

```
server.js           # Entry point — Express + todas las rutas
.env                # Secretos — NUNCA en el repo
.env.example        # Template documentado — SÍ en el repo
.gitignore          # Excluye .env y node_modules
railway.toml        # Configuración de deploy
```

---

## Variables de entorno requeridas

```bash
# .env — nunca commitear, siempre en .gitignore

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...        # Solo para operaciones públicas
SUPABASE_SERVICE_KEY=eyJ...     # Para operaciones de admin — nunca al frontend
ADMIN_TOKEN=...                 # Mínimo 32 caracteres aleatorios
FRONTEND_URL=https://tu-dominio.com
PORT=3000
```

### Generar ADMIN_TOKEN seguro
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Schema de base de datos — Supabase

```sql
-- Tabla principal
CREATE TABLE scans (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zona       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_scans_zona       ON scans(zona);
CREATE INDEX idx_scans_created_at ON scans(created_at);

-- Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Política: anon key solo puede insertar
CREATE POLICY "insert_only" ON scans
  FOR INSERT
  TO anon
  WITH CHECK (zona IN (
    'centro', 'banco', 'padel', 'tero',
    'san-ceferino', 'polideportivo', 'boulevard', 'clubes'
  ));

-- El SELECT y DELETE solo los hace el service role (sin política = solo service)
```

**Importante:** No hay columna `device` ni `ip`. Por diseño legal (Ley 25.326, Art. 28) el sistema no registra datos que puedan identificar al usuario.

---

## Zonas válidas — lista blanca (sincronizada con el frontend)

```js
const ZONAS_VALIDAS = [
  'centro', 'banco', 'padel', 'tero',
  'san-ceferino', 'polideportivo', 'boulevard', 'clubes'
];
```

Esta lista es la fuente de verdad. Si cambia, cambia en el frontend (`src/utils/zonas.js`) y en la política RLS de Supabase simultáneamente.

---

## Endpoints de la API

### POST /api/scan — Público
Registra un escaneo. No requiere autenticación.

**Validaciones obligatorias:**
1. `zona` presente en el body
2. `zona` en la lista blanca ZONAS_VALIDAS
3. Rate limit: 5 requests por IP cada 15 minutos

**Lo que registra:** solo `zona`. Nada más.
**Lo que NO registra bajo ninguna circunstancia:** IP, user-agent, device, cookies, headers del cliente.

```js
app.post('/api/scan', scanLimiter, async (req, res) => {
  const { zona } = req.body;

  // Validación 1 — presencia
  if (!zona || typeof zona !== 'string') {
    return res.status(400).json({ error: 'Zona requerida' });
  }

  // Validación 2 — lista blanca
  const zonaLimpia = zona.trim().toLowerCase();
  if (!ZONAS_VALIDAS.includes(zonaLimpia)) {
    console.warn(`[WARN] Zona inválida: '${zonaLimpia}' — ${new Date().toISOString()}`);
    return res.status(400).json({ error: 'Zona inválida' });
  }

  // Insertar en Supabase — solo zona
  const { error } = await supabase
    .from('scans')
    .insert([{ zona: zonaLimpia }]);

  if (error) {
    console.error('[ERROR] Supabase insert:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }

  res.json({ ok: true });
});
```

### GET /api/stats — Requiere Bearer token
Devuelve stats agregadas. Requiere header `Authorization: Bearer {ADMIN_TOKEN}`.

**Respuesta:**
```json
{
  "total": 42,
  "hoy": 12,
  "zona_lider": { "nombre": "centro", "cantidad": 18 },
  "por_zona":   { "centro": 18, "boulevard": 10, ... },
  "por_hora":   { "09:00": 3, "14:00": 7, ... },
  "por_device": { "mobile": 35, "desktop": 5, "unknown": 2 }
}
```

### GET /api/data — Requiere Bearer token
Devuelve todos los registros crudos para export CSV.

**Respuesta:** array de `{ id, zona, created_at }`. Sin IP, sin device.

### POST /api/admin/verify — Público
Verifica el token del admin para el login del frontend.

```js
app.post('/api/admin/verify', (req, res) => {
  const { token } = req.body;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  res.json({ ok: true });
});
```

---

## Middleware de seguridad — configuración completa

### Helmet.js — Headers HTTP
```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", 'https://fonts.googleapis.com'],
      fontSrc:     ['https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:'],
      connectSrc:  ["'self'"],
    },
  },
  hsts: {
    maxAge:            31536000, // 1 año
    includeSubDomains: true,
  },
  frameguard:     { action: 'deny' },        // Anti-clickjacking
  noSniff:        true,                       // X-Content-Type-Options
  referrerPolicy: { policy: 'no-referrer' },
}));
```

### CORS — Solo el dominio del frontend
```js
app.use(cors({
  origin:         process.env.FRONTEND_URL,
  methods:        ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Rate limiting — /api/scan
```js
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max:      5,               // máx 5 por IP
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    console.warn(`[WARN] Rate limit excedido — ${new Date().toISOString()}`);
    res.status(429).json({ error: 'Demasiadas peticiones. Intentá más tarde.' });
  },
});
```

### Autenticación de admin — middleware reutilizable
```js
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    console.warn(`[WARN] Intento de acceso sin token — ${new Date().toISOString()}`);
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// Uso:
app.get('/api/stats', requireAdmin, async (req, res) => { ... });
app.get('/api/data',  requireAdmin, async (req, res) => { ... });
```

---

## Clientes de Supabase — dos instancias

```js
const { createClient } = require('@supabase/supabase-js');

// Cliente público — para inserts de /api/scan
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Cliente de admin — para reads y deletes (solo en rutas protegidas)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
```

- `supabasePublic` → solo en `POST /api/scan`. Limitado por RLS.
- `supabaseAdmin` → solo en rutas con `requireAdmin`. Nunca expuesto al frontend.

---

## Logging de seguridad — eventos a registrar siempre

```js
// Zona inválida recibida
console.warn(`[WARN] Zona inválida: '${zona}' — ${new Date().toISOString()}`);

// Rate limit superado
console.warn(`[WARN] Rate limit excedido — ${new Date().toISOString()}`);

// Intento de acceso al admin sin token
console.warn(`[WARN] Acceso a ${req.path} sin token — ${new Date().toISOString()}`);

// Error de base de datos
console.error(`[ERROR] Supabase: ${error.message} — ${new Date().toISOString()}`);
```

Formato: `[NIVEL] Descripción — ISO timestamp`. Consistente para que Railway pueda filtrarlos.

---

## Deploy en Railway

```toml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node server.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Variables de entorno en Railway:** nunca en el código. Todas se configuran en el panel de Railway → Variables.

---

## Auditoría pre-deploy — checklist obligatorio

```bash
# 1. Auditar dependencias
npm audit

# 2. Corregir las que tienen fix
npm audit fix

# 3. Verificar que .env no está en el repo
git status | grep .env   # No debe aparecer

# 4. Verificar .gitignore
cat .gitignore            # Debe incluir .env

# 5. Correr en local y probar los 4 endpoints
node server.js
```

---

## Reglas legales que afectan el backend — Ley 25.326

Por el Art. 28 de la Ley 25.326 (Argentina), el sistema opera como investigación científica con datos disociados. Esto implica restricciones técnicas que **no son negociables:**

- **No registrar IP.** Express tiene acceso a `req.ip`. No usarlo nunca para almacenar.
- **No registrar user-agent.** Express tiene acceso a `req.headers['user-agent']`. No almacenarlo.
- **No cruzar datos.** La única clave de cada registro es `zona + created_at`. No agregar identificadores.
- **Eliminar registros al finalizar.** El endpoint de cleanup elimina todos los registros individuales. Solo sobrevive el informe agregado.

```js
// ❌ PROHIBIDO — almacenar IP
const ip = req.ip;
await supabase.from('scans').insert([{ zona, ip }]);

// ✅ CORRECTO — solo zona
await supabase.from('scans').insert([{ zona: zonaLimpia }]);
```

---

## OWASP Top 10 — medidas implementadas en el backend

| Vulnerabilidad | Medida |
|---|---|
| A01 Broken Access Control | `requireAdmin` en todas las rutas del panel |
| A02 Cryptographic Failures | HTTPS forzado por Railway, HSTS via Helmet |
| A03 Injection | Validación con lista blanca antes de cualquier query |
| A04 Insecure Design | Sin IP, sin device, sin cruce de datos — por arquitectura |
| A05 Misconfiguration | Helmet + CORS restrictivo + variables en Railway |
| A06 Vulnerable Components | `npm audit` pre-deploy |
| A07 Auth Failures | Token de 32+ chars, comparación directa, sin JWT propio |
| A08 Data Integrity | RLS en Supabase — anon key no puede SELECT ni DELETE |
| A09 Logging Failures | Log de zona inválida, rate limit, acceso sin token |
| A10 SSRF | El backend no hace fetch a URLs de usuarios |

---

## Lo que NO hacés como agente backend

- No modificás componentes React ni CSS Modules
- No cambiás el diseño de la landing ni del admin
- No exponés `SUPABASE_SERVICE_KEY` en ninguna ruta pública
- No agregás columnas `ip`, `user_agent`, ni ningún identificador de usuario a la tabla
- No removés el rate limiting de `/api/scan`
- No removés la validación de zona
- No commitás `.env` ni archivos con secretos
- No deshabilitás RLS en Supabase

---

## Checklist antes de cada cambio

- [ ] ¿La ruta nueva requiere autenticación? Si sí, ¿tiene `requireAdmin`?
- [ ] ¿Hay algún input del usuario que no pasa por la lista blanca?
- [ ] ¿Se almacena IP, user-agent o algún dato identificatorio?
- [ ] ¿Se usa `supabaseAdmin` en una ruta pública? Si sí, error crítico.
- [ ] ¿Hay algún secreto hardcodeado en el código?
- [ ] ¿El log del evento de seguridad tiene el formato `[NIVEL] desc — timestamp`?
- [ ] ¿Se corrió `npm audit` después del último `npm install`?