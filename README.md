# Desplegar en Vercel

## Qué hay en esta carpeta
- `index.html` — tu app tal cual (front-end), se sirve como archivo estático.
- `login.html` — página de login (usuario/contraseña).
- `middleware.js` — bloquea el acceso a la app si no hay una sesión válida, y te manda a `login.html`.
- `lib/session.js` — firma y valida el cookie de sesión (no usa base de datos).
- `api/login.js` — valida usuario `admin` / contraseña `infinite2026` y crea la sesión.
- `api/logout.js` — cierra la sesión (borra el cookie).
- `api/storage/[key].js` — reemplaza el guardado en disco por Upstash Redis (persistente).
- `package.json` — dependencia `@upstash/redis`.

## Pasos

1. **Copiar los archivos**
   Copia toda esta carpeta tal cual a un proyecto local (o a un repo de GitHub), manteniendo la misma estructura de carpetas (`api/`, `lib/`).

2. **Instalar Vercel CLI e iniciar sesión**
   ```
   npm install -g vercel
   vercel login
   ```

3. **Primer despliegue**
   ```
   vercel
   ```

4. **Configurar la variable de entorno `SESSION_SECRET`** (obligatoria para el login)
   - Dashboard de Vercel → tu proyecto → **Settings → Environment Variables**.
   - Nombre: `SESSION_SECRET`. Valor: cualquier texto largo y aleatorio (por ejemplo, corre `openssl rand -hex 32` en tu terminal y pega el resultado).
   - Aplica a Production, Preview y Development.
   - Si no la configuras, `/api/login` va a responder error 500.

5. **Agregar Upstash Redis (la base de datos de los registros)**
   - Dashboard de Vercel → tu proyecto → pestaña **Storage** → **Marketplace** → **Upstash** → **Redis** → instalar y conectar a este proyecto.
   - Inyecta automáticamente las variables que usa `@upstash/redis` (no hay que copiarlas a mano).

6. **Migrar los datos que ya tienes** (para no perder tus registros actuales)
   - Desde tu servidor actual, exporta el contenido de las claves `bitacora-records` y `sitios-db`.
   - Cárgalos una vez a Redis, por ejemplo con `curl`:
     ```
     curl -X POST https://TU-PROYECTO.vercel.app/api/storage/bitacora-records \
       -H "Content-Type: application/json" \
       -d '{"value": "<< AQUÍ EL JSON DE TUS REGISTROS, COMO STRING >>"}'
     ```
     (y lo mismo para `sitios-db`).

7. **Desplegar a producción**
   ```
   vercel --prod
   ```

## Cómo funciona el login
- `/api/login` valida usuario/contraseña y, si son correctos, entrega un cookie
  `session` firmado (HMAC) con 12 horas de validez. No se guarda ninguna sesión
  en una base de datos: el propio cookie firmado ES la sesión.
- `middleware.js` corre en cada petición (excepto a `/api/*` y `login.html`) y
  verifica ese cookie; si falta o es inválido/expiró, redirige a `login.html`.
- `/api/logout` simplemente borra el cookie.

## Seguridad — recomendaciones
- Las credenciales (`admin` / `infinite2026`) están escritas directamente en
  `api/login.js`. Funciona, pero si más adelante quieres poder cambiarlas sin
  volver a desplegar, muévelas a variables de entorno de Vercel
  (`ADMIN_USER`, `ADMIN_PASSWORD`) y léelas con `process.env` en vez de tenerlas
  fijas en el código.
- Vercel sirve todo por HTTPS por defecto, así que el usuario/contraseña y el
  cookie de sesión viajan cifrados.
