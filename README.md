<div align="center">

```
┌───┐
│ E │  PROYECTO ELISA
└───┘  Lezama · 2026
```

# ELISA — Experimento Lezama de Ingeniería Social Aplicada

[![Security Headers](https://img.shields.io/badge/Security%20Headers-A%2B-brightgreen)](https://securityheaders.com)
[![Mozilla Observatory](https://img.shields.io/badge/Mozilla%20Observatory-A%2B-brightgreen)](https://observatory.mozilla.org)
[![SSL Labs](https://img.shields.io/badge/SSL%20Labs-A%2B-brightgreen)](https://ssllabs.com)
[![AAIP](https://img.shields.io/badge/AAIP-Registrado-blue)](https://www.argentina.gob.ar/aaip)
[![Ley 25.326](https://img.shields.io/badge/Ley%2025.326-Cumplimiento%20Art.%2028-blue)](https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black)](https://elisa-lezama.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Vercel%20Serverless-black)](https://vercel.com)

**Experimento de campo en ciberseguridad e ingeniería social.**  
Desarrollado por Santino Tomás Dorado — Estudiante de Lic. en Seguridad Informática  
y Lic. en IA y Robótica, Universidad Siglo 21. Lezama, Buenos Aires, Argentina.

[Ver landing →](https://elisa-lezama.vercel.app) · [Protocolo](docs/1-Protocolo-ELISA.pdf) · [Análisis de riesgo](docs/2-Analisis-Riesgo-Minimo.pdf)

</div>

---

## Índice

- [¿Qué es ELISA?](#qué-es-elisa)
- [Flujo de datos](#flujo-de-datos)
- [User flow](#user-flow)
- [UI / UX](#ui--ux)
- [Arquitectura técnica](#arquitectura-técnica)
- [API Reference](#api-reference)
- [Seguridad](#seguridad)
- [Base de datos](#base-de-datos)
- [Stack tecnológico](#stack-tecnológico)
- [Setup local](#setup-local)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Registro AAIP](#registro-aaip)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Autor](#autor)

---

## ¿Qué es ELISA?

ELISA es un experimento de campo en ingeniería social realizado en la localidad de Lezama, Buenos Aires, Argentina, durante septiembre de 2026.

El experimento consiste en la instalación de 8 códigos QR en zonas públicas de la localidad. Cuando un ciudadano escanea el código, accede a una landing page que le explica que acaba de demostrar cómo funciona la ingeniería social — la técnica utilizada por ciberdelincuentes para obtener información o acceso sin hackear nada, simplemente aprovechando el comportamiento humano.

**Objetivo:** Medir el comportamiento de la población ante estímulos QR desconocidos y generar concientización sobre ciberseguridad en la comunidad.

**Período:** 16 al 30 de septiembre de 2026  
**Zonas:** 8 zonas de la localidad de Lezama  
**Datos recolectados:** Zona de origen del escaneo y timestamp (disociados, sin datos personales)

---


## UI / UX

### Sistema de diseño

ELISA usa dos sistemas de diseño diferenciados según la audiencia:

#### Landing (usuario final — vecinos de Lezama)

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#FFFFFF` | Página completa |
| Surface | `#FAFAFA` | Cards |
| Borde | `#E4E4E7` | Separadores y cards |
| Acento alerta | `#B91C1C` | Badge "Acción registrada" |
| Acento zona | `#15803D` | Badge de zona válida |
| Texto primario | `#09090B` | Headlines |
| Texto secundario | `#52525B` | Cuerpo |
| Font body | Inter 16px | Todo el texto |
| Font datos | Geist Mono | Timestamps, badges, contadores |

**Principios aplicados:**
- Fondo blanco puro — accesible para todas las edades
- Jerarquía por tamaño, no por color
- Un solo acento por pantalla
- El número contador es el elemento más dominante (72px)
- Mobile-first: texto mínimo 14px, áreas táctiles mínimo 44px
- WCAG AA en todos los elementos de contraste

#### Panel Admin

| Token | Valor (claro) | Valor (oscuro) |
|---|---|---|
| Fondo | `#FFFFFF` | `#09090B` |
| Surface | `#FAFAFA` | `#18181B` |
| Borde | `#E4E4E7` | `#27272A` |
| Texto primario | `#09090B` | `#FAFAFA` |
| Barras gráficos | `#09090B` | `#FAFAFA` |
| Font | Inter 14px | Inter 14px |
| Font datos | Geist Mono | Geist Mono |

**Toggle claro/oscuro:** guardado en `localStorage` bajo clave `elisa_tema`.

### Arquitectura de componentes

```
src/
├── pages/
│   ├── Landing.jsx      — flujo completo usuario final
│   ├── Login.jsx        — autenticación admin
│   ├── Admin.jsx        — panel de control
│   └── NotFound.jsx     — 404
├── hooks/
│   ├── useScan.js       — registra escaneo, ref guard
│   └── useStats.js      — polling 30s
├── api/
│   ├── client.js        — fetch base con Bearer
│   ├── scan.api.js      — POST /api/scan
│   └── stats.api.js     — GET /api/stats + /api/data
├── components/
│   └── ProtectedRoute.jsx
└── utils/
    └── zonas.js         — lista blanca + labels
```

### Decisiones de UX

| Decisión | Razón |
|---|---|
| Loader de 3 segundos antes del reveal | El usuario necesita tiempo para "procesar" que escaneó algo desconocido. La tensión es intencional |
| Sin terminal hacker en producción | El público de Lezama no es técnico. Blanco y limpio genera más confianza |
| Contador de escaneos visible | Genera pertenencia — el usuario siente que es parte de algo |
| Debriefing completo en la landing | Cumple el requisito ético de informar al participante inmediatamente |
| Sin cookies ni analytics de usuario | Privacidad por diseño — no se puede identificar a nadie aunque se quisiera |
| Toggle de tema en el admin | Santino trabaja de noche — tema oscuro para sesiones largas |

---

## Arquitectura técnica

### Patrón: Layered + Decoupled

```
FRONTEND                          BACKEND
─────────────────────             ─────────────────────
pages/     → hooks/               routes/    → services/
hooks/     → api/                 middleware → config/
api/       → backend              services/  → supabase
```

### Backend — estructura en capas

```
Back/
├── server.js           # Entry point — solo HTTP
├── app.js              # Express + middlewares + rutas
├── config/
│   ├── supabase.js     # supabasePublic + supabaseAdmin
│   └── security.js     # Helmet + CORS
├── middleware/
│   ├── auth.js         # requireAdmin — Bearer token
│   ├── rateLimiter.js  # 20 req/15min prod
│   ├── validate.js     # validateZona — lista blanca
│   └── hmac.js         # verificarHMAC — HMAC-SHA256
├── routes/
│   ├── scan.routes.js  # POST /api/scan
│   ├── stats.routes.js # GET /api/stats + /api/data
│   └── admin.routes.js # POST /api/admin/verify + honeypots
└── services/
    ├── scan.service.js # insertarScan(zona) — sin Express
    └── stats.service.js
```

### Zonas de confianza

```
PÚBLICA (sin auth)
├── GET  /                    Landing
├── POST /api/scan            Registro (rate limit + HMAC)
└── POST /api/admin/verify    Login

PROTEGIDA (Bearer token)
├── GET  /admin               Panel (ProtectedRoute)
├── GET  /api/stats           Stats agregadas
└── GET  /api/data            Datos crudos CSV

HONEYPOT (logging de scanners)
├── /api/admin/users
├── /api/debug
├── /.env
└── /wp-admin
```

---

## API Reference

### POST /api/scan

Registra un escaneo de QR.

**Request:**
```json
{
  "zona": "centro",
  "token": "hmac_sha256_token_firmado"
}
```

**Responses:**

| Status | Body | Descripción |
|---|---|---|
| 200 | `{ "ok": true }` | Escaneo registrado |
| 400 | `{ "error": "Zona requerida" }` | Falta zona o token |
| 400 | `{ "error": "Zona inválida" }` | Zona no está en lista blanca |
| 401 | `{ "error": "Token inválido" }` | HMAC no coincide |
| 415 | `{ "error": "Content-Type debe ser application/json" }` | Header incorrecto |
| 429 | `{ "error": "Demasiadas peticiones" }` | Rate limit superado |
| 500 | `{ "error": "Error interno del servidor" }` | Error de DB |

---

### GET /api/stats

Devuelve estadísticas agregadas del experimento.

**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`

**Response 200:**
```json
{
  "total": 147,
  "hoy": 23,
  "zona_lider": {
    "nombre": "boulevard",
    "cantidad": 42
  },
  "por_zona": {
    "centro": 28,
    "banco": 15,
    "padel": 12,
    "tero": 8,
    "san-ceferino": 6,
    "polideportivo": 19,
    "boulevard": 42,
    "clubes": 17
  },
  "por_hora": {
    "14:00": 12,
    "15:00": 8
  },
  "por_device": {
    "mobile": 134,
    "desktop": 8,
    "unknown": 5
  }
}
```

---

### GET /api/data

Devuelve todos los registros crudos para export CSV.

**Headers:** `Authorization: Bearer {ADMIN_TOKEN}`

**Response 200:**
```json
[
  {
    "id": 1,
    "zona": "centro",
    "created_at": "2026-09-16T14:32:07.000Z"
  }
]
```

---

### POST /api/admin/verify

Verifica el token de administrador.

**Request:**
```json
{ "token": "ADMIN_TOKEN" }
```

**Responses:**

| Status | Body |
|---|---|
| 200 | `{ "ok": true }` |
| 401 | `{ "error": "Token inválido" }` |

---

### GET /api/health

Health check del servidor.

**Response 200:**
```json
{
  "status": "ok",
  "project": "ELISA",
  "timestamp": "2026-09-16T14:32:07.000Z"
}
```

---

## Seguridad

### Resultados de auditoría externa

| Herramienta | Resultado | URL |
|---|---|---|
| Security Headers (Snyk) | A+ | securityheaders.com |
| Mozilla Observatory | A+ | observatory.mozilla.org |
| SSL Labs (Qualys) | A+ | ssllabs.com/ssltest |

### Headers de seguridad (Frontend — vercel.json)

| Header | Valor | Protege contra |
|---|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self'...` | XSS, inyección de recursos |
| X-Frame-Options | `DENY` | Clickjacking |
| X-Content-Type-Options | `nosniff` | MIME sniffing |
| Referrer-Policy | `strict-origin-when-cross-origin` | Filtración de URLs |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | Acceso a dispositivo |
| X-XSS-Protection | `1; mode=block` | XSS en browsers legacy |
| Strict-Transport-Security | Gestionado por Vercel | Downgrade attacks |

### Protecciones del backend

| Protección | Implementación |
|---|---|
| Rate limiting | 20 req / 15 min por IP (producción) |
| Validación de zona | Lista blanca + trim + lowercase + slice(50) |
| Token HMAC | HMAC-SHA256 por zona con timingSafeEqual |
| Autenticación admin | Bearer token en header Authorization |
| CORS | Restringido al dominio del frontend |
| Helmet.js | Headers de seguridad en todas las respuestas |
| HPP | Prevención de HTTP Parameter Pollution |
| Payload limit | 10kb máximo por request |
| Content-Type | Validación en rutas POST |
| Supabase timeout | 8 segundos máximo por llamada |
| Error sanitization | Stack traces nunca llegan al cliente en producción |
| Honeypots | Logging de scanners automáticos |
| Request ID | UUID único por request en header X-Request-Id |
| Env validation | process.exit(1) si faltan variables requeridas |

### OWASP Top 10

| Categoría | Estado | Medida |
|---|---|---|
| A01 Broken Access Control | ✅ Mitigado | requireAdmin + RLS |
| A02 Cryptographic Failures | ✅ Mitigado | HTTPS + HSTS A+ |
| A03 Injection / XSS | ✅ Mitigado | CSP + lista blanca |
| A04 Insecure Design | ✅ Mitigado | Privacidad por diseño |
| A05 Misconfiguration | ✅ Mitigado | Helmet + CORS restrictivo |
| A06 Vulnerable Components | ✅ Mitigado | npm audit |
| A07 Auth Failures | ✅ Mitigado | Bearer + HMAC + sessionStorage |
| A08 Data Integrity | ✅ Mitigado | RLS Supabase |
| A09 Logging Failures | ✅ Mitigado | Logging activo |
| A10 SSRF | N/A | Sin fetch a URLs externas |

---

## Base de datos

### Schema

```sql
CREATE TABLE scans (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zona       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_scans_zona       ON scans(zona);
CREATE INDEX idx_scans_created_at ON scans(created_at);
```

### Row Level Security

```sql
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_only" ON scans
  FOR INSERT TO anon
  WITH CHECK (zona IN (
    'centro', 'banco', 'padel', 'tero',
    'san-ceferino', 'polideportivo', 'boulevard', 'clubes'
  ));
```

### Zonas válidas

| ID | Label |
|---|---|
| `centro` | El Centro |
| `banco` | Banco / Municipio / Cooperativa |
| `padel` | Canchas de Pádel |
| `tero` | Barrio El Tero |
| `san-ceferino` | Barrio San Ceferino |
| `polideportivo` | Polideportivo |
| `boulevard` | El Boulevard |
| `clubes` | Los Clubes |

---

## Stack tecnológico

| Capa | Tecnología | Versión | Deploy |
|---|---|---|---|
| Frontend | React + Vite + Tailwind v4 | 18.x / 5.x / 4.x | Vercel |
| UI Components | shadcn/ui | latest | — |
| Gráficos | Recharts | 2.x | — |
| Backend | Node.js + Express | 20 LTS / 4.x | Vercel Serverless |
| Seguridad | Helmet + express-rate-limit | 7.x / 7.x | — |
| Base de datos | Supabase (PostgreSQL + RLS) | — | Supabase Cloud |
| Analytics | Vercel Analytics + Speed Insights | — | Vercel |
| Fuentes | Inter + Geist Mono | — | Google Fonts |

---

## Setup local

```bash
# Clonar repositorios
git clone https://github.com/stdorado/Elisa.git
git clone https://github.com/stdorado/Elisa-Frontend.git

# Backend
cd Elisa
cp .env.example .env
# Completar variables en .env
npm install
npm run dev        # Puerto 8080

# Frontend (nueva terminal)
cd Elisa-Frontend
cp .env.example .env.local
npm install
npm run dev        # Puerto 5173
```

---

## Variables de entorno

### Backend (Back/.env)

```bash
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Admin
ADMIN_TOKEN=tu_token_seguro

# HMAC — autenticidad de QRs
HMAC_SECRET=genera_con_crypto.randomBytes(32).toString('hex')

# CORS
FRONTEND_URL=https://elisa-lezama.vercel.app

# Servidor
PORT=8080
NODE_ENV=development
```

### Frontend (Front/.env.local)

```bash
# En desarrollo el proxy de Vite maneja /api → localhost:8080
# En producción apuntar al backend de Vercel
VITE_API_URL=http://localhost:8080
```

---

## Scripts disponibles

### Backend

```bash
npm run dev              # nodemon server.js
npm start                # node server.js
npm audit                # auditoría de dependencias

node scripts/generar-qr.js https://elisa-lezama.vercel.app
# Genera 8 PNGs + imprimir-qr.html con el sello ELISA

node scripts/generar-tokens-hmac.js
# Genera URLs firmadas con HMAC para cada zona

node scripts/test-conexion.js
# Verifica conexión con Supabase
```

### Frontend

```bash
npm run dev              # Vite dev server
npm run build            # Build de producción
npm run preview          # Preview del build
npm audit                # auditoría de dependencias
```

---

## Registro AAIP

El proyecto está registrado voluntariamente ante la Agencia de Acceso a la Información Pública de la República Argentina.

| Paso | Expediente | Código |
|---|---|---|
| Paso 1 — Responsable | EX-2026-85200607-APN-DNPDP#AAIP | RL-2026-85200630-DNPDP#AAIP |
| Paso 2 — Base de datos | EX-2026-85307708-APN-DNPDP#AAIP | RE-2026-85307754-APN-DNPDP#AAIP |

**Marco legal:** Ley 25.326 Art. 28 (excepción investigación científica con datos disociados), Art. 5 inc. 2d, Ley 26.032, CCyC Arts. 1710 y 1717.

---

## Estructura del repositorio

```
Elisa/                    ← Backend
├── server.js
├── app.js
├── config/
├── middleware/
├── routes/
├── services/
├── scripts/
├── AGENT_BACK.md
├── AGENT_ARCHITECTURE.md
└── CLAUDE.md

Elisa-Frontend/           ← Frontend
├── src/
│   ├── pages/
│   ├── hooks/
│   ├── api/
│   ├── components/
│   └── utils/
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── AGENT_FRONT.md
├── AGENT_ARCHITECTURE.md
└── CLAUDE.md
```

---

## Autor

**Santino Tomás Dorado**  
Desarrollador e investigador independiente  
Estudiante de Lic. en Seguridad Informática y Lic. en IA y Robótica  
Universidad Siglo 21 — Lezama, Buenos Aires, Argentina

- Email: doradosantinotomas@gmail.com
- GitHub: [@stdorado](https://github.com/stdorado)

---

<div align="center">

*Proyecto ELISA · Lezama, Buenos Aires · 2026*  
*"La mejor defensa no es un antivirus. Es saber que esto pasa."*

</div>



<img width="1065" height="1136" alt="image" src="https://github.com/user-attachments/assets/0c1b80be-888d-4065-b255-ec684a18994b" />
<img width="915" height="837" alt="image" src="https://github.com/user-attachments/assets/4bbfea97-d740-4f19-8d60-07efcb0e72e0" />
