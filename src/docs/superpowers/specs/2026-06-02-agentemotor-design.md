# Agentemotor — Design Spec
**Date:** 2026-06-02  
**Status:** Approved

---

## 1. Contexto y Problema

Un asesor comercial maneja carteras de pólizas (Auto, Hogar, Vida, Otra) para múltiples clientes en múltiples aseguradoras. El flujo crítico: las pólizas de Auto pierden historial si no se renuevan dentro de los 30 días posteriores al vencimiento. Hoy el asesor usa hojas de cálculo. El sistema reemplaza eso con una herramienta web enfocada en seguimiento proactivo, estado automático de pólizas y gestión de cartera.

---

## 2. Decisiones Arquitecturales

| Decisión | Elección | Razón |
|---|---|---|
| Repo | Monorepo con npm workspaces | 3 comandos para levantar, sin 2 repos |
| Multi-tenancy | Por `asesorId` — cada asesor ve solo sus clientes | Un cliente puede tener pólizas con distintas aseguradoras |
| DB | SQLite + better-sqlite3 | Simplicidad local, sin servidor externo |
| Auth | JWT (access 15m + refresh 7d en httpOnly cookie) | Stateless, seguro |
| Estado póliza | Calculado en tiempo real + cron job diario | No requiere triggers DB |
| Notificaciones | Servicio `NotificationService` listo, sin UI | Arquitectura preparada para cron email |
| Admin panel | Backend listo (rutas protegidas por rol ADMIN) | Sin frontend admin en MVP |
| Excel import | multer + xlsx | Validación en backend antes de persistir |
| Excel export | exceljs | Filtros aplicados en memoria |

---

## 3. Esquema de Base de Datos (SQLite)

### 3.1 Tablas

```sql
-- Aseguradoras
CREATE TABLE aseguradoras (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  razonSocial TEXT NOT NULL,
  nit         TEXT NOT NULL UNIQUE,
  telefono    TEXT,
  email       TEXT,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ramas disponibles por aseguradora (Auto, Hogar, Vida, Otra)
CREATE TABLE aseguradora_ramas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  aseguradoraId INTEGER NOT NULL REFERENCES aseguradoras(id),
  rama          TEXT NOT NULL CHECK(rama IN ('AUTO','HOGAR','VIDA','OTRA')),
  UNIQUE(aseguradoraId, rama)
);

-- Usuarios del sistema (Asesor, Admin)
CREATE TABLE usuarios (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres      TEXT NOT NULL,
  apellidos    TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  rol          TEXT NOT NULL CHECK(rol IN ('ADMIN','ASESOR')),
  activo       INTEGER NOT NULL DEFAULT 1,
  createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Relación asesor ↔ aseguradora (un asesor puede trabajar con N aseguradoras)
CREATE TABLE asesor_aseguradoras (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  usuarioId     INTEGER NOT NULL REFERENCES usuarios(id),
  aseguradoraId INTEGER NOT NULL REFERENCES aseguradoras(id),
  codigo        TEXT,
  UNIQUE(usuarioId, aseguradoraId)
);

-- Clientes (pertenecen al asesor que los crea)
CREATE TABLE clientes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  asesorId        INTEGER NOT NULL REFERENCES usuarios(id),
  nombres         TEXT NOT NULL,
  apellidos       TEXT NOT NULL,
  tipoDoc         TEXT NOT NULL CHECK(tipoDoc IN ('CC','NIT','CE')),
  documento       TEXT NOT NULL,
  celular         TEXT,
  email           TEXT,
  telefono        TEXT,
  fechaNacimiento TEXT,
  estadoGestion   TEXT NOT NULL DEFAULT 'SIN_CONTACTO'
                  CHECK(estadoGestion IN ('COTIZACION','POLIZA_CONTRATADA','NO_VIGENTE','SIN_CONTACTO','GESTIONADO')),
  createdAt       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(asesorId, tipoDoc, documento)
);

-- Pólizas
CREATE TABLE polizas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  clienteId        INTEGER NOT NULL REFERENCES clientes(id),
  asesorId         INTEGER NOT NULL REFERENCES usuarios(id),
  aseguradoraId    INTEGER NOT NULL REFERENCES aseguradoras(id),
  numeroPoliza     TEXT NOT NULL,
  tipo             TEXT NOT NULL CHECK(tipo IN ('AUTO','HOGAR','VIDA','OTRA')),
  fechaExpedicion  TEXT NOT NULL,
  fechaInicioVig   TEXT NOT NULL,
  fechaFinVig      TEXT NOT NULL,
  fechaRenovacion  TEXT,
  -- Estado temporal (calculado por cron diario según fechas)
  estado           TEXT NOT NULL DEFAULT 'VIGENTE'
                   CHECK(estado IN (
                     'VIGENTE','PROXIMA_VENCER',
                     'VENCIDA_RENOVABLE','VENCIDA_CRITICA','VENCIDA_PERDIDA'
                   )),
  -- Origen de la vigencia actual (se establece al crear o renovar)
  tipoContratacion TEXT NOT NULL DEFAULT 'NUEVA_CONTRATACION'
                   CHECK(tipoContratacion IN ('NUEVA_CONTRATACION','RENOVACION')),
  notas            TEXT,
  createdAt        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(aseguradoraId, numeroPoliza)
);

-- Historial de pólizas (cada renovación genera un registro)
CREATE TABLE poliza_historial (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  polizaId        INTEGER NOT NULL REFERENCES polizas(id),
  tipo            TEXT NOT NULL CHECK(tipo IN ('NUEVA_CONTRATACION','RENOVACION')),
  fechaInicioVig  TEXT NOT NULL,
  fechaFinVig     TEXT NOT NULL,
  creadoEn        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Logs de gestión (seguimiento al cliente)
CREATE TABLE logs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  polizaId  INTEGER REFERENCES polizas(id),
  clienteId INTEGER REFERENCES clientes(id),
  asesorId  INTEGER NOT NULL REFERENCES usuarios(id),
  accion    TEXT NOT NULL,
  notas     TEXT,
  fecha     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  usuarioId INTEGER NOT NULL REFERENCES usuarios(id),
  token     TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3.2 Lógica de estado automático de póliza

La función `calcularEstadoPoliza(fechaFinVig: string): PolicyStatus` calcula el estado en tiempo real:

```
diasVencidos = hoy - fechaFinVig (positivo = ya venció):
  diasVencidos < -30      → VIGENTE          (vence en más de 30 días)
  -30 <= diasVencidos <= 0 → PROXIMA_VENCER   (vence en 1-30 días o hoy)
  1 <= diasVencidos <= 20  → VENCIDA_RENOVABLE
  21 <= diasVencidos <= 30 → VENCIDA_CRITICA
  diasVencidos > 30        → VENCIDA_PERDIDA
```

El cron job diario persiste el estado calculado en la columna `estado` de cada póliza y dispara el `NotificationService` (preparado, no implementado).

---

## 4. API Endpoints

### Auth
```
POST   /api/auth/login           → { accessToken, user }
POST   /api/auth/refresh         → { accessToken }
POST   /api/auth/logout
```

### Dashboard
```
POST   /api/dashboard/search     → resumen con conteos por estado + lista pólizas críticas
                                   body: { estado?, tipo?, numeroPoliza?, documento?, nombre?,
                                           page?, pageSize? }
```

### Clientes
```
GET    /api/clientes             → lista paginada (asesorId del JWT)
POST   /api/clientes             → crear cliente
GET    /api/clientes/:id         → detalle + pólizas + logs
PUT    /api/clientes/:id         → actualizar datos / estadoGestion
POST   /api/clientes/upload      → importar desde Excel (multipart/form-data)
GET    /api/clientes/template    → descargar plantilla Excel
```

### Pólizas
```
POST   /api/polizas/search       → informe con filtros (body escalable)
                                   body: { tipo?, estado?, tipoContratacion?, desde?, hasta?,
                                           documento?, numeroPoliza?, aseguradoraId?,
                                           page?, pageSize? }
POST   /api/polizas              → crear póliza
GET    /api/polizas/:id          → detalle + historial
PUT    /api/polizas/:id          → actualizar
POST   /api/polizas/:id/renovar  → renovar (crea historial, determina RENOVACION vs NUEVA_CONTRATACION)
POST   /api/polizas/:id/log      → registrar gestión
POST   /api/polizas/export       → exportar a Excel (body con mismos filtros que /search)
```

### Admin (backend listo, sin frontend)
```
GET    /api/admin/usuarios
POST   /api/admin/usuarios       → crear asesor con credenciales por defecto
PUT    /api/admin/usuarios/:id
GET    /api/admin/aseguradoras
POST   /api/admin/aseguradoras
PUT    /api/admin/aseguradoras/:id
POST   /api/admin/aseguradoras/:id/ramas
POST   /api/admin/asesor-aseguradoras  → asignar asesor a aseguradora
```

---

## 5. Arquitectura de UI (React + TypeScript + MUI)

### 5.1 Páginas, rutas y hooks por página

Cada página tiene su propia carpeta con su hook de lógica. Los hooks genéricos viven en `src/hooks/` y son importados por los hooks de página. **Ninguna función se duplica.**

```
src/
├── hooks/                          # Hooks genéricos reutilizables
│   ├── useApiClient.ts             # instancia axios + interceptores JWT
│   ├── useFilters.ts               # estado de filtros + reset genérico
│   ├── usePagination.ts            # estado página/pageSize
│   └── useExcelExport.ts           # dispara POST /export y descarga el blob
│
└── pages/
    ├── Login/
    │   ├── LoginPage.tsx
    │   └── hooks/
    │       └── useLogin.ts         # mutation login, manejo de token Zustand
    │
    ├── Dashboard/
    │   ├── DashboardPage.tsx
    │   └── hooks/
    │       └── useDashboard.ts     # POST /dashboard/search, usa useFilters + usePagination
    │
    ├── Clients/
    │   ├── ClientesListPage.tsx
    │   ├── ClienteFormPage.tsx     # pantalla completa, NO modal
    │   ├── ClienteDetallePage.tsx
    │   └── hooks/
    │       ├── useClientes.ts      # GET /clientes lista paginada
    │       ├── useClienteDetalle.ts # GET /clientes/:id
    │       └── useClienteForm.ts   # POST/PUT cliente + validación react-hook-form
    │
    ├── Policies/
    │   ├── PolizasInformePage.tsx
    │   └── hooks/
    │       └── usePolizasInforme.ts # POST /polizas/search, usa useFilters + usePagination
    │                                # + llama useExcelExport para /polizas/export
    │
    └── Policy/
        ├── PolizaDetallePage.tsx
        └── hooks/
            ├── usePolizaDetalle.ts  # GET /polizas/:id
            ├── useRenovar.ts        # POST /polizas/:id/renovar
            └── useGestion.ts        # POST /polizas/:id/log
```

**Regla de responsabilidad única:**
- Un hook = un recurso o una acción. `usePolizaDetalle` solo lee. `useRenovar` solo muta.
- Los componentes no llaman `axios` directamente — siempre a través de un hook.
- `useFilters` y `usePagination` son los únicos que manejan ese estado; nunca se reimplementan por página.

### 5.2 Componentes clave

| Componente | Propósito |
|---|---|
| `PolicyStatusChip` | Chip MUI con color por estado de póliza |
| `DashboardCard` | Tarjeta de conteo clickeable por estado |
| `PolicyTable` | DataGrid MUI con sort y paginación — recibe datos como prop |
| `ClienteForm` | Formulario completo de cliente (no modal) |
| `PolizaForm` | Formulario de póliza con aseguradora/tipo |
| `RenovarDialog` | Modal para ingresar nueva fecha de fin de vigencia |
| `LogTimeline` | Timeline MUI de gestiones registradas |
| `ExcelImportStepper` | Stepper: subir → validar → confirmar migración |
| `FilterBar` | Barra de filtros reutilizable — acepta `fields` como configuración |

### 5.3 Estado global

- **Zustand**: solo para auth state (usuario, accessToken, rol)
- **React Query (TanStack Query)**: cache de servidor — todas las llamadas API
- No Redux, no Context para datos de servidor

### 5.4 Colores de estado de póliza

| Estado | Color MUI |
|---|---|
| VIGENTE | `success` |
| PROXIMA_VENCER | `warning` |
| VENCIDA_RENOVABLE | `orange` (#f57c00) |
| VENCIDA_CRITICA | `error` |
| VENCIDA_PERDIDA | `grey` |
| NUEVA_CONTRATACION / RENOVACION | `info` |

---

## 6. Flujos Críticos

### 6.1 Renovación de póliza
```
Asesor hace clic "Renovar" en póliza
  → RenovarDialog: ingresa nueva fechaFinVig
  → POST /api/polizas/:id/renovar
  → Backend: calcula diasVencido = hoy - fechaFinVigActual
    - diasVencido <= 30: tipoContratacion = 'RENOVACION'
    - diasVencido > 30:  tipoContratacion = 'NUEVA_CONTRATACION'
  → Actualiza poliza: nueva fechaInicioVig, fechaFinVig, tipoContratacion, estado recalculado
  → Inserta registro en poliza_historial (snapshots del periodo anterior)
  → React Query invalida /dashboard y /polizas
```

### 6.2 Importación Excel
```
Asesor descarga plantilla → llena datos → sube Excel
  → Multer recibe archivo en memoria
  → excelParser valida: campos nulos, email válido, tipoDoc válido
  → Retorna preview con errores por fila
  → Asesor confirma → se persisten clientes + pólizas
  → Logs de importación registrados
```

### 6.3 Cron job de estados
```
node-cron: '0 6 * * *' (6am Colombia, UTC-5)
  → Consulta todas las pólizas activas
  → Recalcula estado con calcularEstadoPoliza()
  → UPDATE batch en SQLite
  → NotificationService.dispatch() (no-op en MVP, preparado para nodemailer)
```

---

## 7. Seguridad

- Contraseñas: `bcrypt` con salt rounds 12
- JWT access token: 15 minutos, firmado con `JWT_SECRET`
- Refresh token: 7 días, almacenado en httpOnly cookie
- Middleware `requireRole('ASESOR')` y `requireRole('ADMIN')` en todas las rutas protegidas
- Cada query de datos filtra por `asesorId` del JWT — aislamiento multi-tenant
- Rate limiting en `/api/auth/login` (5 intentos/min por IP)
- Helmet.js para headers HTTP seguros

---

## 8. Testing (2-3 casos críticos)

```typescript
// tests/renovation.test.ts
describe('Renovación de póliza', () => {
  it('renueva como RENOVACION si vencida hace <= 30 días')
  it('crea NUEVA_CONTRATACION si vencida hace > 30 días')
})

// tests/policyStatus.test.ts
describe('calcularEstadoPoliza()', () => {
  it('retorna VIGENTE si vence en más de 30 días')
  it('retorna PROXIMA_VENCER si vence en 1-30 días')
  it('retorna VENCIDA_CRITICA si vencida hace 20-29 días')
  it('retorna VENCIDA_PERDIDA si vencida hace >= 30 días')
})
```

---

## 9. Mock Data (seed.ts)

- 3 aseguradoras: Sura (Auto, Hogar,Vida), HDI (Hogar, Vida), AXA Colpatria (Vida, Auto, Hogar)
- 1 usuario ADMIN + 2 usuarios ASESOR
- 15 clientes distribuidos entre asesores
- 25 pólizas con estados variados (vigentes, próximas, vencidas) — fechas relativas a `now`

---

## 10. Scripts de arranque (README — 3 comandos)

```bash
git clone <repo> && cd agentemotor
npm run install:all        # instala backend + frontend
npm run dev                # levanta ambos servidores en paralelo
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- Variables de entorno en `.env.example` — copiar a `.env` antes de arrancar

---

## 11. Notificaciones (preparado, no implementado en MVP)

```typescript
// backend/src/modules/notifications/NotificationService.ts
interface NotificationPayload {
  asesorEmail: string;
  polizasCriticas: Poliza[];
  tipo: 'PROXIMA_VENCER' | 'VENCIDA_CRITICA';
}

class NotificationService {
  async dispatch(payload: NotificationPayload): Promise<void> {
    // TODO: implementar con nodemailer + plantilla HTML
    // Conectar al cron job en policyStatusJob.ts
  }
}
```

La infraestructura de cron + servicio está lista. Solo falta la implementación del transporte de email cuando se requiera.
