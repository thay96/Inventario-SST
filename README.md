# SST CONEQUIPOS — Sistema de Inventario

Sistema interno de gestión de inventario para Seguridad y Salud en el Trabajo (SST) de **CONEQUIPOS S.A.S.**, empresa de alquiler de maquinaria pesada.

> **Estado actual:** Fase 1 completada exitosamente. El proyecto compila sin errores de TypeScript y cuenta con la estructura base de componentes, autenticación, y reportes. Pendiente Fase 2 (integración con Google Drive y roles).

---

## Requisitos previos

- Node.js 18.17 o superior
- npm 9 o superior
- Cuenta en [Supabase](https://supabase.com) con proyecto creado
- Tablas creadas según el schema en `CONTEXTO_DEEPSEEK.md`

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd sst-conequipos
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y completa con tus credenciales de Supabase:

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Encuentra estos valores en **Supabase Dashboard → Project Settings → API**.

### 4. Generar tipos de TypeScript desde Supabase

> **IMPORTANTE:** El archivo `types/supabase.ts` se genera automáticamente. NO lo edites a mano.

```bash
npx supabase gen types typescript --project-id TU_PROJECT_ID > types/supabase.ts
```

Reemplaza `TU_PROJECT_ID` con el ID de tu proyecto (visible en la URL de Supabase: `https://supabase.com/dashboard/project/TU_PROJECT_ID`).

Ejecuta este comando cada vez que hagas cambios al esquema de la base de datos.

### 5. Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Compila para producción |
| `npm run start` | Inicia el servidor de producción local |
| `npm run lint` | Ejecuta ESLint |
| `npm run type-check` | Verifica tipos TypeScript sin compilar |

---

## Estructura de carpetas

```
/
├── app/                          # Páginas del App Router de Next.js
│   ├── layout.tsx                # Layout raíz (fuente, metadata global)
│   ├── page.tsx                  # Redirige a /dashboard o /login
│   ├── globals.css               # Estilos globales mínimos
│   ├── loading.tsx               # Estado de carga global
│   ├── error.tsx                 # Error boundary global
│   ├── not-found.tsx             # Página 404
│   ├── login/page.tsx            # Pantalla de inicio de sesión
│   ├── dashboard/page.tsx        # Dashboard con 4 métricas
│   ├── inventario/
│   │   ├── page.tsx              # Tabla de inventario con filtros
│   │   └── nuevo/page.tsx        # Formulario de nuevo producto (admin)
│   ├── inspecciones/
│   │   ├── page.tsx              # Listado de jornadas de inspección
│   │   └── nueva/page.tsx        # Formulario de nueva inspección
│   └── reportes/page.tsx         # Exportación a Excel
│
├── components/                   # Componentes React reutilizables
│   ├── layout/
│   │   ├── Navbar.tsx            # Barra superior (usuario + logout)
│   │   └── Sidebar.tsx           # Menú lateral de navegación
│   ├── ui/                       # Componentes UI base
│   │   ├── Boton.tsx             # Botón con variantes
│   │   ├── Input.tsx             # Input con label y error
│   │   ├── Select.tsx            # Select con label y error
│   │   ├── Card.tsx              # Card de métricas
│   │   ├── Badge.tsx             # Badge de estado
│   │   └── MensajeError.tsx      # Mensaje de error global
│   ├── auth/
│   │   └── FormularioLogin.tsx   # Formulario de login
│   ├── inventario/
│   │   ├── TablaInventario.tsx   # Tabla de productos
│   │   ├── FiltrosInventario.tsx # Filtros y buscador
│   │   └── FormularioProducto.tsx# Alta de producto
│   ├── inspecciones/
│   │   ├── TablaJornadas.tsx     # Listado de jornadas
│   │   ├── FormularioJornada.tsx # Formulario principal de inspección
│   │   ├── FormularioExtintor.tsx# Chequeo individual de extintor
│   │   ├── FirmaCanvas.tsx       # Canvas para firma digital
│   │   └── SubidaFoto.tsx        # Input de foto con preview
│   └── reportes/
│       └── ExportarExcel.tsx     # Botón de exportación Excel
│
├── lib/                          # Utilidades y acceso a datos
│   ├── supabase/
│   │   ├── cliente.ts            # Cliente Supabase (navegador)
│   │   └── servidor.ts           # Cliente Supabase (servidor)
│   ├── auth.ts                   # Helpers de autenticación
│   ├── inventario.ts             # Queries de productos/unidades
│   ├── inspecciones.ts           # Queries de jornadas/extintores
│   └── excel.ts                  # Exportación SheetJS
│
├── types/                        # Tipos TypeScript
│   ├── supabase.ts               # Generado por CLI (no editar)
│   ├── inventario.ts             # Tipos de dominio: Producto, Unidad
│   └── inspecciones.ts           # Tipos: Jornada, InspeccionExtintor
│
├── middleware.ts                 # Protección de rutas + refresco de sesión
├── .env.example                  # Plantilla de variables de entorno
├── .env.local                    # Variables reales (NO subir al repo)
├── next.config.ts                # Configuración de Next.js
├── tailwind.config.ts            # Paleta corporativa + tipografía
├── tsconfig.json                 # TypeScript estricto
└── package.json                  # Dependencias
```

---

## Variables de entorno requeridas

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública | Project Settings → API |

### Variables futuras (Fase 2 — Google Drive)

| Variable | Descripción |
|---|---|
| `GOOGLE_CLIENT_EMAIL` | Email de la Service Account de Google Cloud |
| `GOOGLE_PRIVATE_KEY` | Clave privada de la Service Account |
| `GOOGLE_DRIVE_FOLDER_ID` | ID de la carpeta raíz en Google Drive |

---

## Despliegue en Cloudflare Pages

### Prerrequisitos

1. Cuenta en [Cloudflare](https://cloudflare.com)
2. Repositorio en GitHub o GitLab

### Pasos

1. **Conectar repositorio** en Cloudflare Pages → Create a project → Connect to Git

2. **Configurar el build:**

   | Campo | Valor |
   |---|---|
   | Framework preset | Next.js |
   | Build command | `npm run build` |
   | Build output directory | `.next` |
   | Node.js version | `18` |

3. **Agregar variables de entorno** en Cloudflare Pages → Settings → Environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://TU_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = TU_ANON_KEY
   ```

4. **Instalar el adaptador de Cloudflare** (necesario para Next.js en Cloudflare):

   ```bash
   npm install @cloudflare/next-on-pages
   ```

   Actualizar `package.json`:
   ```json
   "scripts": {
     "build": "next build",
     "pages:build": "npx @cloudflare/next-on-pages"
   }
   ```

5. **Hacer deploy** — Cloudflare construye automáticamente en cada push a la rama `main`.

> **Alternativa recomendada:** Desplegar en [Vercel](https://vercel.com) con soporte nativo para Next.js App Router sin configuración adicional.

---

## Configuración de Supabase

### Crear usuarios

En **Supabase Dashboard → Authentication → Users**, crea los usuarios manualmente con email y contraseña. En v1 no hay auto-registro.

### Políticas RLS

Las políticas de Row Level Security ya están en el schema SQL. Verifica que estén activas en **Database → Policies**.

---

## Notas de desarrollo

- Los componentes con `'use client'` al inicio son Client Components (tienen estado o eventos).
- Los componentes sin esa directiva son Server Components (acceden a Supabase directamente).
- Los filtros del inventario se manejan por URL search params para permitir compartir URLs filtradas.
- La firma digital se guarda como base64 PNG. En Fase 2 se subirá a Supabase Storage.
- Las fotos de extintores usan `capture="environment"` para abrir la cámara trasera en móviles.
