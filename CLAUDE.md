# ELISA — Backend · Contexto para Claude Code

## Qué es este proyecto

**ELISA** (Experimento Lezama de Ingeniería Social Aplicada) es una aplicación web de investigación en ciberseguridad. Esta carpeta contiene **exclusivamente el backend** — Node.js + Express + Supabase.

**Responsable:** Santino Tomás Dorado — desarrollador e investigador independiente, Lezama, Buenos Aires.
**Marco legal:** Ley 25.326, Art. 28 — investigación científica con datos disociados.

---

## Antes de cualquier tarea → leer AGENT_BACKEND.md

Ese archivo tiene todo: schema de DB, endpoints, middlewares de seguridad, configuración de Supabase, restricciones legales y OWASP. No empezar a editar sin haberlo leído.

```bash
cat AGENT_BACKEND.md
```

---

## Estructura de esta carpeta

```
Back/
├── CLAUDE.md
├── AGENT_BACKEND.md
├── .claude/
│   └── settings.json
├── server.js             ← entry point — Express + todas las rutas
├── .env                  ← NUNCA en git
├── .env.example          ← template documentado — SÍ en git
├── .gitignore
└── railway.toml
```

---

## Reglas globales

- **Nunca** commitear `.env`
- **Nunca** almacenar IP, user-agent ni datos identificatorios del usuario
- **Nunca** exponer `SUPABASE_SERVICE_KEY` en rutas públicas
- **Nunca** quitar el rate limiting de `/api/scan`
- **Siempre** validar `zona` contra la lista blanca antes de cualquier query
- **Siempre** usar `requireAdmin` en rutas del panel
- **Nunca** tocar nada de la carpeta `Front/`

---

## Zonas válidas

```
centro · banco · padel · tero · san-ceferino · polideportivo · boulevard · clubes
```

Si cambian, avisar — hay que sincronizar con el frontend y con la política RLS de Supabase.

---

## Variables de entorno requeridas

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=       # cliente público — solo INSERT
SUPABASE_SERVICE_KEY=    # cliente admin — SELECT y DELETE
ADMIN_TOKEN=             # mínimo 32 chars — generar con crypto.randomBytes
FRONTEND_URL=            # para CORS
PORT=3000
```

---

## Endpoints de la API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/scan` | No | Registra escaneo. Rate limit 5/15min |
| GET | `/api/stats` | Bearer | Stats agregadas para el admin |
| GET | `/api/data` | Bearer | Registros crudos para CSV |
| POST | `/api/admin/verify` | No | Verifica token del login |

---

## Comandos

```bash
npm install
node server.js         # http://localhost:3000
npm audit
npm audit fix

# Generar ADMIN_TOKEN seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Estado actual

| Archivo | Estado |
|---|---|
| server.js base | ✅ Escrito — necesita revisión de seguridad completa |
| Helmet.js | ⏳ Pendiente |
| Rate limiting | ⏳ Pendiente |
| requireAdmin middleware | ⏳ Pendiente |
| Dos clientes Supabase (public/admin) | ⏳ Pendiente |
| Logging de seguridad | ⏳ Pendiente |
| .env.example | ⏳ Pendiente |
| .gitignore | ⏳ Pendiente |
| railway.toml | ⏳ Pendiente |
| README.md | ⏳ Pendiente |