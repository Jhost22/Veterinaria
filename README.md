# 🐾 Veterinaria — NestJS + Next.js

Sistema de gestión para una veterinaria.

| Parte | Tecnología | Hosting |
|---|---|---|
| `backend/` | NestJS 11, TypeORM, PostgreSQL, JWT | **Render** |
| `frontend/` | Next.js 15 (App Router), React 19 | **Vercel** |

**Funcionalidades:** login con roles (administrador, veterinario, recepción), clientes, mascotas, citas (con control de doble reserva por veterinario) e historial clínico por mascota.

---

## 1. Probar en local

Necesitas Node 20+ y un PostgreSQL local (o la URL de uno remoto).

```bash
# Backend (puerto 3000)
cd backend
cp .env.example .env        # edita DATABASE_URL, JWT_SECRET, ADMIN_*
npm install
npm run start:dev

# Frontend (puerto 3001), en otra terminal
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Abre http://localhost:3001 e ingresa con `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(el administrador se crea solo la primera vez que arranca el backend con la tabla de usuarios vacía).

Comprobar que la API responde: http://localhost:3000/api/health → `{"status":"ok"}`

---

## 2. Subir el código a GitHub

Render y Vercel despliegan desde un repositorio. Desde la carpeta `veterinaria/`:

```bash
git init
git add .
git commit -m "Primer commit"
# crea un repo vacío en GitHub y luego:
git remote add origin https://github.com/TU_USUARIO/veterinaria.git
git push -u origin main
```

---

## 3. Desplegar el backend + base de datos en Render

### Opción A — Blueprint (recomendada)
1. En Render: **New → Blueprint** y elige tu repositorio. Detecta el archivo `render.yaml`.
2. Te pedirá tres valores:
   - `ADMIN_EMAIL` y `ADMIN_PASSWORD`: tu primer administrador.
   - `CORS_ORIGINS`: déjalo con un valor temporal (p. ej. `http://localhost:3001`); lo corregirás en el paso 5.
3. Render crea la base de datos `veterinaria-db` y el servicio `veterinaria-api`.
4. Al terminar, copia la URL del servicio, p. ej. `https://veterinaria-api.onrender.com`.

### Opción B — Manual
1. **New → PostgreSQL** → crea la base de datos y copia su **Internal Database URL**.
2. **New → Web Service** → tu repositorio, y configura:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Health Check Path:** `/api/health`
3. Variables de entorno: `DATABASE_URL` (la Internal URL), `JWT_SECRET` (texto largo y aleatorio), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGINS`, `NODE_VERSION=20`.

> Si algún día conectas con la **External** Database URL (por ejemplo desde tu PC), agrega `DATABASE_SSL=true`.

Verifica: `https://TU-SERVICIO.onrender.com/api/health` debe responder `{"status":"ok"}`.

---

## 4. Desplegar el frontend en Vercel

1. En Vercel: **Add New → Project** y elige el mismo repositorio.
2. **Root Directory:** `frontend` (Vercel detecta Next.js solo).
3. En **Environment Variables** agrega:
   - `NEXT_PUBLIC_API_URL` = `https://TU-SERVICIO.onrender.com/api`  ← incluye `/api`
4. **Deploy**. Copia la URL final, p. ej. `https://veterinaria-xxxx.vercel.app`.

> `NEXT_PUBLIC_*` se “hornea” al compilar: si cambias la variable, hay que **redesplegar** el frontend.

---

## 5. Conectar ambos (CORS)

Vuelve a Render → servicio `veterinaria-api` → **Environment** y pon:

```
CORS_ORIGINS=https://veterinaria-xxxx.vercel.app
```

Si tienes varios dominios (por ejemplo uno propio), sepáralos con coma, **sin barra final**:
`https://miveterinaria.com,https://veterinaria-xxxx.vercel.app`

Render reinicia el servicio y ya puedes entrar al panel desde Vercel.

---

## Roles y permisos

| Acción | Admin | Veterinario | Recepción |
|---|:-:|:-:|:-:|
| Ver clientes, mascotas, citas, historial | ✅ | ✅ | ✅ |
| Crear/editar clientes, mascotas y citas | ✅ | ✅ | ✅ |
| Escribir en el historial clínico | ✅ | ✅ | ❌ |
| Eliminar clientes, mascotas y registros clínicos | ✅ | ❌ | ❌ |
| Eliminar citas | ✅ | ❌ | ✅ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

## API (prefijo `/api`)

| Recurso | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` |
| Usuarios | `GET /users/vets`, `GET/POST /users`, `PATCH /users/:id` |
| Clientes | `GET /clients?q=`, `GET/PATCH/DELETE /clients/:id`, `POST /clients` |
| Mascotas | `GET /pets?q=&clientId=`, `GET/PATCH/DELETE /pets/:id`, `POST /pets` |
| Citas | `GET /appointments?from=&to=&status=&petId=`, `GET/PATCH/DELETE /appointments/:id`, `POST /appointments` |
| Historial | `GET /medical-records?petId=`, `GET/PATCH/DELETE /medical-records/:id`, `POST /medical-records` |

---

## Cosas a tener en cuenta

- **Plan gratuito de Render:** el servicio se “duerme” tras un rato sin tráfico y la primera petición tarda en despertar. Revisa también los límites vigentes de la base de datos gratuita en la documentación de Render antes de usarla con datos reales.
- **`DB_SYNC=true`** hace que TypeORM cree y modifique las tablas automáticamente. Es cómodo para empezar, pero en producción con datos reales lo correcto es pasar a **migraciones** y poner `DB_SYNC=false`.
- **Token en `localStorage`:** es simple y funciona bien con front y back en dominios distintos. Si más adelante quieres más seguridad, se puede migrar a cookies `httpOnly`.
- **Respaldos:** configura copias de seguridad de la base de datos antes de cargar información real de clientes.
- **Vercel previews:** las URLs de “preview” cambian en cada rama; si quieres probarlas contra el backend tendrás que agregarlas a `CORS_ORIGINS`.

## Ideas para siguientes versiones

Recordatorios de citas por WhatsApp/correo, carnet de vacunación imprimible (PDF), subida de archivos (radiografías, análisis), inventario/ventas, y vista de calendario semanal.
