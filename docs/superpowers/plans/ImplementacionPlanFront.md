# Agentemotor — Frontend Implementation Plan

## Contexto

El backend ya está construido con Express + SQLite + JWT. El frontend debe consumir la API REST existente en `localhost:3001` y proveer una interfaz de gestión de pólizas de seguros para asesores comerciales.

**Stack:** React 18 + TypeScript + MUI v5 + Zustand + TanStack React Query + Axios + React Router v6 + React Hook Form + Vite

---

## Proposed Changes

### Fase 1: Scaffolding & Configuración del Proyecto

#### [NEW] `frontend/` — Vite project

Se creará un nuevo proyecto Vite dentro del monorepo existente con:

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    └── vite-env.d.ts
```

**Dependencias:**
- `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- `@tanstack/react-query`
- `zustand`
- `axios`
- `react-router-dom`
- `react-hook-form`, `@hookform/resolvers`, `zod`
- `dayjs` (fechas)

#### [MODIFY] [package.json](file:///c:/Users/santi/Desktop/DESARROLLOS/Agentemotor/package.json)

Agregar npm workspace para `frontend/` y scripts del monorepo:
```json
{
  "workspaces": ["frontend"],
  "scripts": {
    "install:all": "npm install",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "...",
    "dev:frontend": "npm -w frontend run dev"
  }
}
```

---

### Fase 2: Capa Base — Types, API Client, Estado Global

#### [NEW] `frontend/src/types/` — Tipos compartidos

```
types/
├── index.ts          # Re-exports
├── auth.ts           # User, LoginRequest, LoginResponse, AuthState
├── cliente.ts        # Cliente, ClienteForm, ClienteDetalle
├── poliza.ts         # Poliza, PolicyStatus, PolicyType, PolizaForm
├── dashboard.ts      # DashboardResponse, DashboardCounts
└── common.ts         # PaginatedResponse<T>, ApiError, FilterState
```

Tipos derivados directamente de las respuestas del backend (ya analizadas en los routes):

| Endpoint | Respuesta |
|---|---|
| `POST /auth/login` | `{ accessToken, user: { id, nombres, apellidos, email, rol } }` |
| `POST /dashboard/search` | `{ page, pageSize, total, dashboard: Record<estado, count>, polizas[] }` |
| `GET /clientes` | `{ clientes[] }` |
| `GET /clientes/:id` | `{ cliente, polizas[], logs[] }` |
| `POST /polizas/search` | `{ page, pageSize, total, polizas[] }` |
| `GET /polizas/:id` | `{ poliza, historial[] }` |
| `POST /polizas/:id/renovar` | `{ success, tipoContratacion, estado }` |

#### [NEW] `frontend/src/lib/apiClient.ts` — Instancia Axios singleton

- `baseURL: 'http://localhost:3001/api'`
- Request interceptor: inyecta `Authorization: Bearer <token>` desde Zustand store
- Response interceptor: en `401`, intenta `POST /auth/refresh` (cookie httpOnly), actualiza token, reintenta request original. Si falla refresh → logout + redirect `/login`
- `withCredentials: true` para enviar cookies

#### [NEW] `frontend/src/store/authStore.ts` — Zustand

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}
```

Solo auth en Zustand. Todo dato de servidor se cachea en React Query.

#### [NEW] `frontend/src/lib/queryClient.ts` — React Query config

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

### Fase 3: Hooks Genéricos Reutilizables (SRP)

Cada hook tiene **una sola responsabilidad**. Los hooks de página componen estos hooks genéricos.

#### [NEW] `frontend/src/hooks/useFilters.ts`

```typescript
function useFilters<T extends Record<string, unknown>>(initialFilters: T) {
  // Retorna: { filters, setFilter, resetFilters, activeFilterCount }
  // Un solo hook para todo filtrado — nunca reimplementar en páginas
}
```

#### [NEW] `frontend/src/hooks/usePagination.ts`

```typescript
function usePagination(initialPage = 1, initialPageSize = 20) {
  // Retorna: { page, pageSize, setPage, setPageSize, offset }
}
```

#### [NEW] `frontend/src/hooks/useExcelExport.ts`

```typescript
function useExcelExport() {
  // Retorna: { exportToExcel, isExporting }
  // Usa useMutation con POST + responseType: 'blob'
  // Descarga automáticamente el archivo
}
```

#### [NEW] `frontend/src/hooks/useDebounce.ts`

```typescript
function useDebounce<T>(value: T, delay: number): T
// Para inputs de búsqueda — evita llamadas excesivas
```

---

### Fase 4: Componentes Reutilizables

#### [NEW] `frontend/src/components/PolicyStatusChip.tsx`

- Props: `{ status: PolicyStatus }`
- Chip MUI con color mapping del design spec (VIGENTE→success, etc.)
- Zero lógica interna — puro presentacional

#### [NEW] `frontend/src/components/DashboardCard.tsx`

- Props: `{ title: string; count: number; status: PolicyStatus; onClick: () => void; icon: ReactNode; loading?: boolean }`
- Card MUI con gradientes, elevación hover, animaciones micro
- Skeleton loading state

#### [NEW] `frontend/src/components/PolicyTable.tsx`

- Props: `{ polizas: Poliza[]; loading: boolean; page: number; pageSize: number; total: number; onPageChange; onPageSizeChange; onRowClick }`
- DataGrid MUI con columnas predefinidas + PolicyStatusChip en columna estado
- Responsive: en mobile, columnas se colapsan

#### [NEW] `frontend/src/components/FilterBar.tsx`

- Props: `{ fields: FilterFieldConfig[]; values: Record<string, unknown>; onChange; onReset }`
- `FilterFieldConfig = { name, label, type: 'text' | 'select' | 'date', options? }`
- Configuración declarativa — una sola instancia reutilizada en Dashboard, Polizas, Clientes
- Responsive: drawer en mobile

#### [NEW] `frontend/src/components/LogTimeline.tsx`

- Props: `{ logs: Log[] }`
- MUI Timeline con iconos por tipo de acción
- Empty state cuando no hay logs

#### [NEW] `frontend/src/components/RenovarDialog.tsx`

- Props: `{ open: boolean; onClose: () => void; onConfirm: (data: RenovarFormData) => void; loading: boolean }`
- Modal con DatePickers para fechaInicioVig y fechaFinVig
- Validación con react-hook-form + zod

#### [NEW] `frontend/src/components/ExcelImportStepper.tsx`

- Props: `{ onComplete: () => void }`
- 3 pasos: Upload → Preview/Validación → Confirmación
- Stepper MUI con estados de progreso

#### [NEW] `frontend/src/components/layout/AppLayout.tsx`

- Sidebar con navegación (Dashboard, Clientes, Pólizas)
- AppBar con usuario actual + logout
- Responsive: drawer colapsable en mobile

#### [NEW] `frontend/src/components/common/`

```
common/
├── LoadingOverlay.tsx    # Backdrop + CircularProgress
├── EmptyState.tsx        # Ilustración + mensaje cuando no hay datos
├── ConfirmDialog.tsx     # Diálogo de confirmación genérico
├── PageHeader.tsx        # Título de página + breadcrumbs + acciones
└── ErrorAlert.tsx        # Alert MUI para errores de API
```

---

### Fase 5: Hooks de Página (Lógica de negocio)

Cada hook de página **compone** hooks genéricos. No accede a `axios` directamente.

#### Login

##### [NEW] `frontend/src/pages/Login/hooks/useLogin.ts`

```typescript
// useMutation → POST /auth/login
// onSuccess: authStore.setAuth(user, token) → navigate('/dashboard')
// Retorna: { login, isLoading, error }
```

#### Dashboard

##### [NEW] `frontend/src/pages/Dashboard/hooks/useDashboard.ts`

```typescript
// Compone: useFilters + usePagination
// useQuery → POST /dashboard/search con filters + pagination
// Retorna: { data, filters, pagination, isLoading }
```

#### Clientes

##### [NEW] `frontend/src/pages/Clients/hooks/useClientes.ts`

```typescript
// useQuery → GET /clientes
// Retorna: { clientes, isLoading, refetch }
```

##### [NEW] `frontend/src/pages/Clients/hooks/useClienteDetalle.ts`

```typescript
// useQuery → GET /clientes/:id
// Retorna: { cliente, polizas, logs, isLoading }
```

##### [NEW] `frontend/src/pages/Clients/hooks/useClienteForm.ts`

```typescript
// useMutation → POST/PUT /clientes
// react-hook-form + zod schema
// Retorna: { form (register, handleSubmit, errors), submit, isSubmitting }
```

#### Pólizas

##### [NEW] `frontend/src/pages/Policies/hooks/usePolizasInforme.ts`

```typescript
// Compone: useFilters + usePagination + useExcelExport
// useQuery → POST /polizas/search
// Retorna: { polizas, filters, pagination, exportToExcel, isLoading }
```

#### Detalle Póliza

##### [NEW] `frontend/src/pages/Policy/hooks/usePolizaDetalle.ts`

```typescript
// useQuery → GET /polizas/:id
// Retorna: { poliza, historial, isLoading }
```

##### [NEW] `frontend/src/pages/Policy/hooks/useRenovar.ts`

```typescript
// useMutation → POST /polizas/:id/renovar
// onSuccess: invalidateQueries(['poliza', id], ['dashboard'])
// Retorna: { renovar, isLoading }
```

##### [NEW] `frontend/src/pages/Policy/hooks/useGestion.ts`

```typescript
// useMutation → POST /polizas/:id/log
// onSuccess: invalidateQueries(['poliza', id])
// Retorna: { registrarGestion, isLoading }
```

---

### Fase 6: Páginas

#### [NEW] `frontend/src/pages/Login/LoginPage.tsx`

- Página de login con branding Agentemotor
- Formulario email + password con react-hook-form
- Glassmorphism card + gradient background
- Redirige a `/dashboard` tras login exitoso

#### [NEW] `frontend/src/pages/Dashboard/DashboardPage.tsx`

- 5 DashboardCards con conteos por estado (VIGENTE → VENCIDA_PERDIDA)
- FilterBar con campos: estado, tipo, documento, nombre
- PolicyTable con pólizas filtradas
- Click en card → filtra por ese estado

#### [NEW] `frontend/src/pages/Clients/ClientesListPage.tsx`

- Lista de clientes con búsqueda
- Botón crear + importar Excel
- DataGrid con estadoGestion como chip

#### [NEW] `frontend/src/pages/Clients/ClienteFormPage.tsx`

- Formulario pantalla completa (NO modal, según spec)
- Modo crear y editar (reutiliza `useClienteForm`)
- Validación con zod

#### [NEW] `frontend/src/pages/Clients/ClienteDetallePage.tsx`

- Info del cliente + tabla de pólizas + LogTimeline
- Acciones: editar, crear póliza

#### [NEW] `frontend/src/pages/Policies/PolizasInformePage.tsx`

- FilterBar con 8 campos (tipo, estado, tipoContratacion, desde, hasta, documento, numeroPoliza, aseguradora)
- PolicyTable
- Botón exportar a Excel

#### [NEW] `frontend/src/pages/Policy/PolizaDetallePage.tsx`

- Detalle de póliza con PolicyStatusChip
- Historial de renovaciones (tabla)
- LogTimeline
- Botones: Renovar → RenovarDialog, Registrar gestión
- PolizaForm para edición inline

#### [NEW] `frontend/src/pages/Policy/PolizaFormPage.tsx`

- Formulario creación/edición de póliza
- Select de aseguradora + tipo
- DatePickers para fechas
- Validación con zod

---

### Fase 7: Theme, Routing & App Shell

#### [NEW] `frontend/src/theme/theme.ts`

Tema MUI personalizado con:
- Paleta oscura premium con acentos cálidos
- Typography con fuente **Inter** (Google Fonts)
- Colores de estado de póliza como custom palette
- Border radius, shadows, transitions personalizados
- Component overrides para look premium

#### [NEW] `frontend/src/router/index.tsx`

```
/login                → LoginPage
/dashboard            → DashboardPage (protected)
/clientes             → ClientesListPage (protected)
/clientes/nuevo       → ClienteFormPage (protected)
/clientes/:id         → ClienteDetallePage (protected)
/clientes/:id/editar  → ClienteFormPage (protected)
/polizas              → PolizasInformePage (protected)
/polizas/nueva        → PolizaFormPage (protected)
/polizas/:id          → PolizaDetallePage (protected)
/polizas/:id/editar   → PolizaFormPage (protected)
```

- `ProtectedRoute` wrapper que verifica `authStore.isAuthenticated`
- Redirect a `/login` si no autenticado

#### [MODIFY] `frontend/src/App.tsx`

- `ThemeProvider` + `CssBaseline`
- `QueryClientProvider`
- `RouterProvider`

---

## Estructura Final de Archivos

```
frontend/src/
├── main.tsx
├── App.tsx
├── vite-env.d.ts
│
├── theme/
│   └── theme.ts
│
├── types/
│   ├── index.ts
│   ├── auth.ts
│   ├── cliente.ts
│   ├── poliza.ts
│   ├── dashboard.ts
│   └── common.ts
│
├── lib/
│   ├── apiClient.ts
│   └── queryClient.ts
│
├── store/
│   └── authStore.ts
│
├── hooks/
│   ├── useFilters.ts
│   ├── usePagination.ts
│   ├── useExcelExport.ts
│   └── useDebounce.ts
│
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx
│   ├── common/
│   │   ├── LoadingOverlay.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── PageHeader.tsx
│   │   └── ErrorAlert.tsx
│   ├── PolicyStatusChip.tsx
│   ├── DashboardCard.tsx
│   ├── PolicyTable.tsx
│   ├── FilterBar.tsx
│   ├── LogTimeline.tsx
│   ├── RenovarDialog.tsx
│   └── ExcelImportStepper.tsx
│
├── pages/
│   ├── Login/
│   │   ├── LoginPage.tsx
│   │   └── hooks/
│   │       └── useLogin.ts
│   ├── Dashboard/
│   │   ├── DashboardPage.tsx
│   │   └── hooks/
│   │       └── useDashboard.ts
│   ├── Clients/
│   │   ├── ClientesListPage.tsx
│   │   ├── ClienteFormPage.tsx
│   │   ├── ClienteDetallePage.tsx
│   │   └── hooks/
│   │       ├── useClientes.ts
│   │       ├── useClienteDetalle.ts
│   │       └── useClienteForm.ts
│   ├── Policies/
│   │   ├── PolizasInformePage.tsx
│   │   └── hooks/
│   │       └── usePolizasInforme.ts
│   └── Policy/
│       ├── PolizaDetallePage.tsx
│       ├── PolizaFormPage.tsx
│       └── hooks/
│           ├── usePolizaDetalle.ts
│           ├── useRenovar.ts
│           └── useGestion.ts
│
└── router/
    └── index.tsx
```

---

## Principios de Diseño Aplicados

| Principio | Cómo se aplica |
|---|---|
| **SRP** | 1 hook = 1 recurso/acción. `usePolizaDetalle` solo lee. `useRenovar` solo muta. |
| **DRY** | `useFilters`, `usePagination`, `useExcelExport` son los únicos que manejan esos concerns. |
| **Composición** | Hooks de página componen hooks genéricos (ej: `useDashboard` usa `useFilters` + `usePagination`). |
| **Separación** | Componentes no llaman axios — siempre a través de hooks. |
| **Tipado fuerte** | Todos los tipos derivados de las respuestas reales del backend. |
| **Estado mínimo** | Zustand solo para auth. React Query para todo dato de servidor. |
| **Responsive** | Layout con drawer colapsable. Tables con columnas adaptativos. FilterBar en drawer en mobile. |

---

## Verification Plan

### Automated

```bash
# Build sin errores
cd frontend && npm run build

# Levantar dev server
npm run dev

# TypeScript strict mode — 0 errores
npx tsc --noEmit
```

### Manual

1. **Login flow**: email/password → redirect dashboard → token en Zustand
2. **Dashboard**: cards con conteos → click filtra tabla → paginación funciona
3. **CRUD Clientes**: crear, editar, ver detalle con pólizas y logs
4. **Pólizas**: filtrar, paginar, exportar Excel, ver detalle
5. **Renovación**: dialog → submit → historial actualizado → Query invalidated
6. **Responsive**: verificar en viewport 375px, 768px, 1440px
7. **Token refresh**: esperar 15min → siguiente request auto-refreshes
