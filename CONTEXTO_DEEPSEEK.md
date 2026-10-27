# CONTEXTO DEL SISTEMA — SST CONEQUIPOS
## Documento de traspaso técnico para continuación del desarrollo

> **Propósito:** Este documento está diseñado para que cualquier desarrollador o modelo de IA
> pueda retomar el desarrollo desde cero sin perder contexto. Se actualiza con cada sesión.
>
> **Última actualización:** Octubre 2026 — Fase 1 completada, tipos corregidos.
> **Stack:** Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase

---

## a) DESCRIPCIÓN DEL SISTEMA

### ¿Qué es?

Sistema web interno de gestión de inventario de **Seguridad y Salud en el Trabajo (SST)**
para **CONEQUIPOS S.A.S.**, empresa colombiana de alquiler de maquinaria pesada
(malacates, equipos de carga, maquinaria de construcción).

### ¿Para qué sirve?

Controlar y registrar digitalmente:

1. **EPP (Elementos de Protección Personal):** cascos, guantes, tapabocas, gafas, botas.
2. **Botiquines:** medicamentos, elementos de primeros auxilios.
3. **Extintores:** inspección periódica, estado, vencimientos de recarga.
4. **Equipos de trabajo en altura:** arneses, eslingas, conectores, líneas de vida.
5. **Herramientas y equipos varios** con número de serie.

El sistema reemplaza registros en papel y hojas de Excel locales, centralizando
la información en Supabase y facilitando la auditoría de la ARL y el Ministerio de Trabajo.

### Usuarios del sistema

| Rol | Acceso | Descripción |
|---|---|---|
| **Admin** | Total | Crea productos, gestiona usuarios, ve todos los reportes |
| **SST** | Lectura + inspecciones | Inspector de seguridad, realiza jornadas de inspección |
| **Operario** | Solo inspecciones | Registra inspecciones de extintores en campo |

> **Implementación v1:** El rol se determina por el dominio del email (`@conequipos.com` = admin).
> En Fase 2 se implementará con una tabla `perfiles` en Supabase.

---

## b) MODELO DE DATOS COMPLETO

### Concepto fundamental: Productos vs. Unidades

El modelo distingue dos tipos de artículos:

**`productos` (consumibles / stock):**
- Se gestionan por **cantidad total**, no por número de serie.
- Ejemplo: "Guante de nitrilo talla M" — se tiene 50 pares en stock.
- Cuando se entregan, el stock baja. No hay seguimiento individual.
- Campos clave: `stock_actual`, `stock_minimo` (dispara alerta de stock crítico).

**`unidades` (serializados):**
- Cada artículo tiene **número de serie único** y estado propio.
- Ejemplo: Extintor "EXT-001" — puede estar DISPONIBLE, ASIGNADO, o EN_MANTENIMIENTO.
- Se hace inspección individual de cada unidad.
- Campos clave: `codigo_serial`, `estado`, fechas de mantenimiento.

### Tablas de la base de datos

#### `productos`
```sql
id              UUID PRIMARY KEY
codigo          TEXT UNIQUE NOT NULL      -- "EPP-001", "BOT-003"
nombre          TEXT NOT NULL             -- "Guante de nitrilo talla M"
descripcion     TEXT
categoria       TEXT NOT NULL             -- EPP | BOTIQUIN | EXTINTOR | EQUIPO_ALTURA | HERRAMIENTA | OTRO
unidad_medida   TEXT NOT NULL             -- "pares", "unidades", "cajas"
stock_actual    INTEGER DEFAULT 0
stock_minimo    INTEGER DEFAULT 0         -- Umbral para alerta de stock crítico
ubicacion       TEXT                      -- "Estante A3, Bodega Principal"
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

#### `unidades`
```sql
id                          UUID PRIMARY KEY
producto_id                 UUID REFERENCES productos(id)
codigo_serial               TEXT UNIQUE NOT NULL    -- "EXT-001", "ARN-005"
estado                      TEXT DEFAULT 'DISPONIBLE'
                            -- DISPONIBLE | ASIGNADO | EN_MANTENIMIENTO | DADO_DE_BAJA
fecha_ultimo_mantenimiento  DATE
fecha_proximo_mantenimiento DATE
notas                       TEXT
created_at                  TIMESTAMPTZ DEFAULT NOW()
```

#### `empleados` (tabla de referencia — no implementada en v1)
```sql
id          UUID PRIMARY KEY
nombre      TEXT NOT NULL
cedula      TEXT UNIQUE
cargo       TEXT
area        TEXT
activo      BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ DEFAULT NOW()
```

#### `jornadas_inspeccion`
```sql
id                      UUID PRIMARY KEY
fecha_inspeccion        DATE NOT NULL
area_operativa          TEXT        -- "Malacate", "Logística", "Oficina"
responsable_nombre      TEXT NOT NULL
responsable_id          UUID REFERENCES empleados(id)
observaciones_generales TEXT
created_at              TIMESTAMPTZ DEFAULT NOW()
```

#### `inspecciones_extintores`
```sql
id                  UUID PRIMARY KEY
jornada_id          UUID REFERENCES jornadas_inspeccion(id) ON DELETE CASCADE
unidad_id           UUID REFERENCES unidades(id)
area_ubicacion      TEXT

-- Vencimiento
mes_vencimiento     INTEGER CHECK (mes_vencimiento BETWEEN 1 AND 12)
anio_vencimiento    INTEGER

-- 11 chequeos booleanos: true = Bueno, false = Malo, null = No aplica
manometro_bueno     BOOLEAN
pasador_bueno       BOOLEAN
boquilla_bueno      BOOLEAN
manija_bueno        BOOLEAN
senalizacion_bueno  BOOLEAN
ubicacion_bueno     BOOLEAN
visibilidad_bueno   BOOLEAN
acceso_bueno        BOOLEAN
pintura_bueno       BOOLEAN
golpes_bueno        BOOLEAN
etiquetas_bueno     BOOLEAN

-- Agente extintor
agente_tipo         TEXT DEFAULT 'ABC Multipropósito'
libras              INTEGER CHECK (libras IN (5, 10, 20))

-- Evidencias (URLs — se completan en Fase 2)
observaciones       TEXT
firma_url           TEXT    -- URL de firma en Storage o Drive
foto_url            TEXT    -- URL de foto en Storage o Drive
pdf_url             TEXT    -- URL del PDF generado en Drive

created_at          TIMESTAMPTZ DEFAULT NOW()
```

### Relaciones

```
productos (1) ──── (N) unidades
jornadas_inspeccion (1) ──── (N) inspecciones_extintores
unidades (1) ──── (N) inspecciones_extintores
empleados (1) ──── (N) jornadas_inspeccion
```

---

## c) FLUJOS PRINCIPALES

### Flujo 1: Login

```
Usuario ingresa email + contraseña
  → FormularioLogin.tsx llama a lib/auth.ts → login()
  → Supabase Auth valida credenciales
  → Si OK: middleware refresca sesión en cookies, router.push('/dashboard')
  → Si error: mensaje en español al usuario
```

### Flujo 2: Consulta de inventario

```
Usuario visita /inventario
  → middleware.ts verifica sesión activa
  → app/inventario/page.tsx (Server Component)
  → Lee searchParams de URL (categoria, busqueda)
  → llama lib/inventario.ts → getProductos(filtros)
  → Supabase retorna productos filtrados
  → TablaInventario.tsx renderiza la tabla
  → FiltrosInventario.tsx (Client Component) actualiza la URL al filtrar
```

### Flujo 3: Inspección de extintores

```
Operario visita /inspecciones/nueva
  → FormularioJornada.tsx (Client Component)
  → Completa: fecha, área, responsable
  → Agrega N extintores con FormularioExtintor.tsx
  → Por cada extintor: código, área, vencimiento, 11 chequeos, libras
  → Captura firma con FirmaCanvas.tsx (canvas nativo → base64 PNG)
  → Toma foto con SubidaFoto.tsx (input file → FileReader → preview)
  → Al guardar:
      1. INSERT en jornadas_inspeccion → obtiene jornada_id
      2. INSERT N registros en inspecciones_extintores
      3. firma_url y foto_url = null (pendiente Fase 2)
  → router.push('/inspecciones')

[FASE 2 — TODO]
  → Subir firma como PNG a Supabase Storage
  → Subir foto a Supabase Storage o Google Drive
  → Generar PDF con formato SG.SST-F-25
  → Subir PDF a Google Drive en carpeta correcta
  → UPDATE inspecciones_extintores SET firma_url, foto_url, pdf_url
```

### Flujo 4: Asignación de equipos de altura (pendiente Fase 2)

```
Admin selecciona unidad (arnés, eslinga) y empleado
  → INSERT en tabla asignaciones (pendiente crear)
  → Genera PDF "Acta de entrega" con datos del empleado y equipo
  → Sube PDF a Drive: 04 - ASIGNACIONES Y ACTAS/Acta-{EMPLEADO}-{EQUIPO}.pdf
  → Marca unidad como ASIGNADO en tabla unidades
```

---

## d) INTEGRACIÓN PENDIENTE CON GOOGLE DRIVE

### Por qué Google Drive

La jefa de SST necesita que **toda la documentación esté visible en Google Drive** sin
necesidad de acceder al sistema web. Esto incluye:

- Inventarios actualizados en Excel
- PDFs de inspecciones de extintores
- PDFs de inspecciones de equipos de altura
- Actas de asignación de EPP

### Estructura de carpetas objetivo en Drive

```
INVENTARIO SST CONEQUIPOS/
├── 01 - INVENTARIO GENERAL/
│   ├── EPP.xlsx
│   ├── DOTACION.xlsx
│   └── EQUIPOS.xlsx
│
├── 02 - EXTINTORES/
│   └── {AÑO}/
│       └── {MES}/
│           └── EXT-{CODIGO}-{FECHA}.pdf
│               Ejemplo: EXT-001-2024-01-15.pdf
│
├── 03 - INSPECCIONES EQUIPOS ALTURA/
│   └── {AÑO}/
│       └── {MES}/
│           └── ARNES-{CODIGO}-{FECHA}.pdf
│
└── 04 - ASIGNACIONES Y ACTAS/
    └── Acta-{EMPLEADO}-{EQUIPO}-{FECHA}.pdf
```

### Configuración de Google Cloud (pasos para Fase 2)

1. **Crear proyecto** en [Google Cloud Console](https://console.cloud.google.com)
2. **Habilitar la API:** APIs & Services → Enable APIs → Google Drive API v3
3. **Crear Service Account:**
   - IAM & Admin → Service Accounts → Create Service Account
   - Rol: Editor (o un rol personalizado con permisos solo a Drive)
   - Descargar clave JSON
4. **Compartir carpeta raíz de Drive** con el email de la Service Account
5. **Extraer credenciales** del JSON para las variables de entorno:
   ```env
   GOOGLE_CLIENT_EMAIL=nombre@proyecto.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   GOOGLE_DRIVE_FOLDER_ID=1ABC...XYZ
   ```

### Estructura de servicios lista (sin implementar)

El archivo `lib/drive.ts` debe crearse en Fase 2 con esta estructura:

```typescript
// lib/drive.ts — TODO: implementar en Fase 2
// Requiere: npm install googleapis

// TODO: Inicializar cliente de Drive con Service Account
// TODO: async function subirArchivo(nombre, buffer, mimeType, carpetaId): Promise<string>
// TODO: async function crearCarpetaSiNoExiste(nombre, carpetaPadreId): Promise<string>
// TODO: async function subirPDF(jornadaId: string): Promise<string>
// TODO: async function subirInventarioExcel(): Promise<string>
```

### Flujo completo con Drive (Fase 2)

```
Formulario → Supabase (datos texto)
           ↓
           → Supabase Storage (foto original)
           → Generador PDF (lib/pdf.ts — usar @react-pdf/renderer o pdfkit)
           → Google Drive API v3
               → crearCarpetaSiNoExiste(año)
               → crearCarpetaSiNoExiste(mes)
               → subirArchivo(pdf) → retorna fileId
               → Drive genera link compartible
           ↓
           UPDATE inspecciones_extintores
             SET foto_url = 'https://storage.supabase.co/...'
                 firma_url = 'https://storage.supabase.co/...'
                 pdf_url = 'https://drive.google.com/file/d/{fileId}'
```

---

## e) DECISIONES TÉCNICAS TOMADAS Y POR QUÉ

### Next.js 14 App Router

- **Por qué:** Server Components eliminan la necesidad de React Query o Zustand para
  la mayoría de los casos. Los datos se obtienen directamente en el servidor y se
  envían al cliente ya renderizados. Reduce bundle size y complejidad.
- **Alternativa considerada:** Vite + React SPA. Se descartó porque requiere un backend
  separado para proteger las credenciales de Supabase.

### Supabase

- **Por qué:** PostgreSQL gestionado con Auth, Row Level Security, Storage y generación
  automática de tipos TypeScript. Evita implementar un backend propio.
- **RLS activo:** Todas las tablas tienen RLS. Solo usuarios autenticados pueden leer/escribir.
- **Alternativa considerada:** Firebase. Se descartó por modelo NoSQL inadecuado para
  datos relacionales como el schema de inspecciones.

### Tailwind CSS puro (sin shadcn/ui, radix-ui)

- **Por qué:** Máximo control sobre el diseño. Los sistemas de diseño como shadcn
  añaden opiniones estéticas (bordes redondeados grandes, colores vibrantes) que
  contradicen el estilo SAP/Odoo requerido. Tailwind permite implementar exactamente
  la paleta corporativa especificada.
- **Sin animaciones:** Sistema para operarios en campo. Las animaciones distraen y
  consumen recursos en dispositivos de gama baja.

### Máximo 40 archivos

- **Por qué:** Facilita el onboarding de nuevos desarrolladores. Un desarrollador
  puede leer el proyecto completo en una mañana. Evita sobre-ingeniería prematura.
- **Consecuencia aceptada:** Algunos componentes son más grandes de lo ideal.
  Si un componente supera 200 líneas, se divide en el siguiente sprint.

### Sin Redux, Zustand ni React Query

- **Por qué:** Server Components + URL search params como estado = sin estado global
  necesario. Los filtros del inventario están en la URL, que es la fuente de verdad.
  Los datos del dashboard se obtienen en el servidor con Promise.all.
- **Excepción:** Estado local con useState en formularios (necesario para interactividad).

---

## f) QUÉ FALTA POR HACER (Backlog Fase 2)

### Prioridad Alta

- [ ] **Integración con Google Drive API v3**
  - Subida automática de PDFs de inspecciones
  - Subida de inventario Excel a Drive
  - Creación dinámica de carpetas por año/mes

- [ ] **Generación de PDFs con formato SG.SST-F-25**
  - Usar `@react-pdf/renderer` o `pdfkit`
  - Incluir: logo empresa, datos de jornada, tabla de chequeos, firma, foto
  - Formato oficial requerido por la ARL

- [ ] **Firma digital mejorada**
  - Almacenar firma en Supabase Storage (actualmente solo en memoria)
  - Asociar URL de firma al registro de inspección

- [ ] **Subida de fotos a Storage**
  - Upload a Supabase Storage bucket `inspecciones`
  - Actualizar `foto_url` en la tabla con la URL pública

### Prioridad Media

- [ ] **Roles y permisos con tabla `perfiles`**
  - Crear tabla `perfiles` con columna `rol` (admin | sst | operario)
  - Reemplazar lógica de dominio de email por consulta a esta tabla
  - Middleware verificar rol antes de acciones críticas

- [ ] **Exportación de reportes mejorada**
  - Reporte de extintores por vencer (filtro por mes)
  - Reporte de EPP por persona asignada
  - Historial de inspecciones por extintor

- [ ] **Módulo de asignaciones de equipos de altura**
  - Tabla `asignaciones` en Supabase
  - Formulario de asignación: empleado + unidad (arnés, eslinga, etc.)
  - Generación de acta PDF de entrega

- [ ] **Notificaciones**
  - Email cuando un extintor vence en los próximos 30 días
  - Email cuando el stock de un producto llega al mínimo
  - Usar Supabase Edge Functions + Resend/SendGrid

### Prioridad Baja

- [ ] **Vista detalle de jornada**
  - Página `/inspecciones/[id]` con detalle completo de la jornada
  - Tabla de extintores con todos los chequeos
  - Botón para descargar PDF

- [ ] **Auto-registro de usuarios**
  - Formulario de registro (actualmente se crean desde el dashboard de Supabase)
  - Aprobación de nuevos usuarios por el admin

- [ ] **Módulo de botiquines**
  - Similar al de extintores pero con lista de medicamentos y fecha de vencimiento

---

## g) CONVENCIONES DE CÓDIGO

### Nombres de archivos

| Tipo | Convención | Ejemplo |
|---|---|---|
| Página | PascalCase implícito (Next.js) | `app/inventario/page.tsx` |
| Componente | PascalCase | `TablaInventario.tsx` |
| Lib / utility | camelCase | `inventario.ts`, `auth.ts` |
| Tipos | camelCase | `inspecciones.ts` |
| Constantes | UPPER_SNAKE_CASE | `ETIQUETAS_CHEQUEO` |

### Convenciones de funciones

```typescript
// Funciones de consulta: get + entidad en plural
getProductos()
getJornadas()
getTotalProductos()

// Funciones de mutación: verbo en inglés técnico + entidad en dominio
createProducto()
createJornadaConExtintores()

// Funciones de utilidad: verbo en español
exportarInventarioExcel()
formatearFecha()
crearExtintorVacio()

// Helpers de auth: verbos cortos
login()
logout()
obtenerUsuarioServidor()
```

### Manejo de errores

**En Server Components / lib:**
```typescript
// Lanzar Error con mensaje descriptivo para que lo capture error.tsx
const { data, error } = await supabase.from('productos').select('*')
if (error) throw new Error(`Error al cargar inventario: ${error.message}`)
```

**En Client Components (formularios):**
```typescript
// Capturar con try/catch y mostrar en estado local
try {
  const { error } = await supabase.from('productos').insert(...)
  if (error) { setError(`Error al guardar: ${error.message}`); return }
  router.push('/inventario')
} catch {
  setError('Error de conexión. Intenta de nuevo.')
} finally {
  setCargando(false)
}
```

### Estructura de componentes

```typescript
'use client' // Solo si usa estado o eventos del navegador

// 1. Imports de React
// 2. Imports de Next.js
// 3. Imports de lib/
// 4. Imports de components/
// 5. Imports de types/

// Tipos locales del componente (si aplica)
interface ComponenteProps { ... }

// Constantes locales (si aplica)
const OPCIONES = [...]

// Componente principal — export default siempre al final
export default function Componente({ prop }: ComponenteProps) {
  // Estado (useState)
  // Refs (useRef)
  // Efectos (useEffect)
  // Handlers (handle + acción)
  // Retorno JSX
}
```

---

## h) COMANDOS ÚTILES

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar tipos sin compilar (rápido)
npm run type-check

# Lint de código
npm run lint

# Compilar para producción
npm run build

# Iniciar servidor de producción local (después de build)
npm run start
```

### Supabase CLI

```bash
# Instalar CLI de Supabase (una vez)
npm install -g supabase

# Login en Supabase CLI
supabase login

# Generar tipos TypeScript desde el schema actual
# ⚠️ IMPORTANTE: Este archivo NO se edita manualmente
npx supabase gen types typescript --project-id TU_PROJECT_ID > types/supabase.ts

# Ver logs de Supabase en tiempo real (útil para debug de RLS)
supabase logs --project-ref TU_PROJECT_ID
```

### Git

```bash
# Flujo de trabajo recomendado
git checkout -b feature/nombre-de-la-funcionalidad
git add .
git commit -m "feat: descripción clara del cambio"
git push origin feature/nombre-de-la-funcionalidad
# Crear Pull Request en GitHub/GitLab
```

### Cloudflare Pages

```bash
# Deploy manual (normalmente lo hace Cloudflare automáticamente)
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static
```

---

## NOTAS PARA EL PRÓXIMO MODELO / DESARROLLADOR

1. **Lee este archivo completo antes de escribir código.**
2. **No instales librerías sin documentar el motivo aquí.**
3. **Mantén el máximo de 200 líneas por archivo.** Si se pasa, divide.
4. **Los TODOs en el código son intencionales** — marcan los puntos de integración de Fase 2.
5. **El tipo `any` está prohibido.** TypeScript strict mode está activo.
6. **Actualiza este documento** en cada sesión de desarrollo con los cambios realizados.
7. **La paleta de colores no se modifica** sin aprobación del área de SST.
8. **Los comentarios en el código van en español** cuando son del dominio del negocio,
   en inglés cuando son técnicos (`// TODO`, `// FIXME`, tipos de TypeScript, etc.).

