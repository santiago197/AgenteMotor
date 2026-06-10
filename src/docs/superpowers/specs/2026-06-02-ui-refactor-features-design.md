# Design: UI Refactor + New Features
**Date:** 2026-06-02  
**Status:** Approved  

---

## Scope

Four independent work streams executed in parallel (Option C):

1. **Backend** — Excel template download + seed 50+ datos
2. **Hooks extraction** — SRP refactor, logic only
3. **UI Features** — dark mode, logout, filter drawer, history drawer

---

## Stream 1: Backend

### 1.1 Template Excel descargable (`GET /api/clientes/template`)

**Current behavior:** Returns JSON array.  
**New behavior:** Returns a `.xlsx` file using ExcelJS.

- Headers: `nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion`
- 3 example rows with realistic Colombian data
- Response headers: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="plantilla-clientes.xlsx"`

**Frontend — Descargar plantilla:** Button "Descargar plantilla" in `ClientesListPage` calls this endpoint and triggers browser download via `<a>` tag with `blob` URL.

**Frontend — Cargar plantilla (importar clientes):**  
A second button "Importar clientes" in `ClientesListPage` opens a modal with:
- **Drag & drop zone** (MUI `Box` with dashed border + `onDragOver`/`onDrop` handlers) — accepts `.xlsx` / `.xls` files only
- **"Seleccionar archivo"** fallback button triggers hidden `<input type="file">`
- Preview: shows selected filename + row count once parsed client-side (read with `xlsx` library before upload)
- **"Subir"** button calls `POST /api/clientes/upload` (existing endpoint) with `multipart/form-data`
- Results step: table showing imported rows (green) vs rejected rows (red) with rejection reason
- **"Cerrar"** and **"Descargar plantilla"** shortcut link inside the modal footer

**Hook:** `useClientesListPage.ts` owns modal open state, file selection, upload mutation, and results state.  
**Component:** `ExcelImportStepper.tsx` already exists — evaluate reuse vs replace. If the existing stepper covers drag & drop and results display adequately, wire it to the new hook. If not, replace with a simpler 2-step modal (select → results).

### 1.2 Seed 50+ datos

**File:** `backend/src/services/seed.ts`

**Distribution — 55+ pólizas:**

| Estado | Count | Fechas (relativas a hoy) |
|---|---|---|
| VIGENTE | 12 | `fechaFinVig` = today + 60..180 days |
| PROXIMA_VENCER | 10 | `fechaFinVig` = today + 1..29 days |
| VENCIDA_RENOVABLE | 8 | `fechaFinVig` = today - 1..20 days |
| VENCIDA_CRITICA | 8 | `fechaFinVig` = today - 21..30 days |
| VENCIDA_PERDIDA | 7 | `fechaFinVig` = today - 31..90 days |
| HOGAR / VIDA / OTRA | 10 | Mix of states |

**Total: 55 pólizas, 10 clientes, 3 aseguradoras**

**Estados calculados con `calculatePolicyStatus(fechaFinVig)` — fechas always relative to seeding date, never hardcoded.**

**AUTO policy `notas` format:**
```
placa: ABC-123 | marca: Renault | modelo: Sandero | año: 2021 | cilindraje: 1600cc
```

**Fields per AUTO policy (realistic validation data):**
- `placa`: Colombian format (3 letters + 3 digits, e.g. `ABC-123`)
- `marca`: Renault, Chevrolet, Mazda, Toyota, Kia, Hyundai, Ford
- `modelo`: Sandero, Spark, 3, Corolla, Picanto, Tucson, EcoSport
- `año`: 2015–2024
- `cilindraje`: 1000cc–2500cc

**Mix:** 60% NUEVA_CONTRATACION, 40% RENOVACION across all policies.  
**Aseguradoras:** Sura (id 1), HDI (id 2), AXA (id 3) distributed evenly.

---

## Stream 2: Hooks Extraction (SRP)

**Rule:** Each page component contains only JSX + hook calls. No `useState`, `useMutation`, or `useQuery` directly in page components.

### New hooks

| Hook | File | Extracts from |
|---|---|---|
| `useDashboardFilters` | `pages/Dashboard/hooks/useDashboardFilters.ts` | Filter state, card toggle logic, drawer open state |
| `usePolizasFilters` | `pages/Policies/hooks/usePolizasFilters.ts` | Filter state, Excel export logic, drawer open state |
| `useLogForm` | `pages/Policy/hooks/useLogForm.ts` | `accion`, `notas`, `logSaved` state, submit handler, inline `logsQuery` |
| `useClientesListPage` | `pages/Clients/hooks/useClientesListPage.ts` | Import modal state, template download handler |

### Existing hooks — no changes needed
`usePolizaDetalle`, `useRenovar`, `useGestion`, `useClienteDetalle`, `useClienteForm`, `useClientes`, `useDashboard`, `usePolizasInforme` — all already correctly extracted.

---

## Stream 3: UI Features

### 3.1 Dark / Light Mode Toggle

**Store:** `src/store/themeStore.ts` (Zustand)
```ts
{ mode: 'light' | 'dark', toggle: () => void }
// persists to localStorage key: 'agentemotor-theme'
// default: 'light'
```

**Theme:** `src/theme/theme.ts` changes from exporting a static object to exporting `createAppTheme(mode: 'light' | 'dark')`.

**App.tsx:** Reads `mode` from `themeStore`, passes to `ThemeProvider`.

**AppBar button:** 
- Icon: `LightModeIcon` when dark (click → go light), `DarkModeIcon` when light (click → go dark)
- Tooltip: "Modo claro" / "Modo oscuro"
- Position: Left of logout button

### 3.2 Logout Button

**Hook:** `useLogout` in `src/pages/Login/hooks/useLogout.ts`
- Calls `POST /api/auth/logout`
- Clears `authStore`
- Navigates to `/login`

**AppBar button:**
- Icon: `LogoutIcon`
- Tooltip: "Cerrar sesión"
- Position: Rightmost in AppBar

### 3.3 Filter Drawer (Dashboard + PolizasInforme)

**Component:** `src/components/common/FilterDrawer.tsx`
- MUI `Drawer` with `anchor="right"`, width 320px
- Props: `open`, `onClose`, `onApply`, `onClear`, `children` (filter fields)
- Footer: "Limpiar" (outlined) + "Aplicar" (contained) buttons

**Integration:**
- Both `DashboardPage` and `PolizasInformePage` replace inline `FilterBar` with a button
- Button: `FilterListIcon` + "Filtros" label in `PageHeader` actions
- Active filter count badge on the button when filters are applied
- Existing `FilterBar.tsx` component is rendered inside `FilterDrawer` — not rewritten

**Behavior:** Applying closes the drawer. Filters display as summary chips below the page header.

### 3.4 History Drawer (PolizaDetallePage)

**Component:** Inline in `PolizaDetallePage` (no separate file needed — single use)
- MUI `Drawer`, `anchor="right"`, width 400px
- Header: "Log de gestiones" + close button

**Button:** `HistoryIcon` + "Historial" in `PageHeader` actions area

**Content:** `LogTimeline` component with `logsQuery.data`

**Body change:** The "Log de gestiones" Paper section currently at the bottom of `PolizaDetallePage` is **removed** from the body. The "Registrar gestión" Paper section **stays** in the body.

---

## File Change Summary

### Backend
| File | Change |
|---|---|
| `backend/src/routes/clientes.ts` | `GET /template` → returns `.xlsx` via ExcelJS |
| `backend/src/services/seed.ts` | Full rewrite — 10 clientes, 55+ pólizas, relative dates |

### Frontend — New files
| File | Purpose |
|---|---|
| `src/store/themeStore.ts` | Zustand store for light/dark mode |
| `src/components/common/FilterDrawer.tsx` | Reusable right-side filter drawer |
| `src/pages/Dashboard/hooks/useDashboardFilters.ts` | Dashboard filter + drawer state |
| `src/pages/Policies/hooks/usePolizasFilters.ts` | Informe filter + drawer + export state |
| `src/pages/Policy/hooks/useLogForm.ts` | Log form state + logsQuery |
| `src/pages/Clients/hooks/useClientesListPage.ts` | Import modal open state, file selection, upload mutation, results state, template download |
| `src/pages/Login/hooks/useLogout.ts` | Logout mutation + navigation |

### Frontend — Modified files
| File | Change |
|---|---|
| `src/theme/theme.ts` | Export `createAppTheme(mode)` instead of static object |
| `src/App.tsx` | Use `themeStore`, pass mode to `ThemeProvider` |
| `src/components/layout/AppLayout.tsx` | Add theme toggle + logout buttons to AppBar |
| `src/pages/Dashboard/DashboardPage.tsx` | Use `useDashboardFilters`, replace FilterBar with drawer button |
| `src/pages/Policies/PolizasInformePage.tsx` | Use `usePolizasFilters`, replace FilterBar with drawer button |
| `src/pages/Policy/PolizaDetallePage.tsx` | Use `useLogForm`, add History drawer, remove log section from body |
| `src/pages/Clients/ClientesListPage.tsx` | Use `useClientesListPage`, add "Descargar plantilla" + "Importar clientes" buttons, render import modal |

---

## Out of Scope
- Component decomposition (only hook extraction)
- Role UI for ASEGURADORA / ADMINISTRADOR
- Aseguradora column in informe table
