# UI Refactor + New Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Excel template download/upload, extract logic to hooks, dark/light mode toggle, logout button in AppBar, filter drawers for Dashboard and PolizasInforme, history drawer in PolizaDetallePage, and rewrite seed with 55+ realistic policies across all states.

**Architecture:** Three independent streams — (A) Backend, (B) Hooks extraction, (C) UI features — all can start in parallel. Stream B and C share no state with each other until the final integration tasks (AppLayout changes apply to both).

**Tech Stack:** TypeScript, React 18, MUI v6, React Query (TanStack), Zustand, Zod, ExcelJS (already installed), better-sqlite3

---

## Stream A — Backend

### Task A1: Template endpoint returns .xlsx

**Files:**
- Modify: `backend/src/routes/clientes.ts`

- [ ] **Step 1: Replace JSON template with ExcelJS .xlsx**

Replace the `router.get('/template', ...)` handler (lines 143–158) with:

```typescript
router.get('/template', async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Clientes');

  sheet.columns = [
    { header: 'nombres', key: 'nombres', width: 20 },
    { header: 'apellidos', key: 'apellidos', width: 20 },
    { header: 'tipoDoc', key: 'tipoDoc', width: 10 },
    { header: 'documento', key: 'documento', width: 18 },
    { header: 'celular', key: 'celular', width: 16 },
    { header: 'email', key: 'email', width: 28 },
    { header: 'telefono', key: 'telefono', width: 16 },
    { header: 'fechaNacimiento', key: 'fechaNacimiento', width: 16 },
    { header: 'estadoGestion', key: 'estadoGestion', width: 20 },
  ];

  sheet.addRows([
    { nombres: 'Carlos', apellidos: 'Ramírez Torres', tipoDoc: 'CC', documento: '1020304050', celular: '+573001234567', email: 'carlos@email.com', telefono: '+5712345678', fechaNacimiento: '1985-03-15', estadoGestion: 'SIN_CONTACTO' },
    { nombres: 'María', apellidos: 'González Pérez', tipoDoc: 'CC', documento: '1030405060', celular: '+573109876543', email: 'maria@email.com', telefono: '', fechaNacimiento: '1990-07-22', estadoGestion: 'COTIZACION' },
    { nombres: 'Empresa XYZ', apellidos: 'S.A.S', tipoDoc: 'NIT', documento: '900123456', celular: '+573013334455', email: 'contacto@xyz.com', telefono: '+5712001122', fechaNacimiento: '', estadoGestion: 'POLIZA_CONTRATADA' },
  ]);

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C63FF' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="plantilla-clientes.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});
```

Also add `import ExcelJS from 'exceljs';` at the top of the file (already imported in polizas.ts — verify it's available in package.json: it is).

- [ ] **Step 2: Verify build compiles**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "clientes.ts"
```

Expected: no output (no errors in clientes.ts).

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/clientes.ts
git commit -m "feat(backend): GET /api/clientes/template returns .xlsx with ExcelJS"
```

---

### Task A2: Rewrite seed with 55+ policies

**Files:**
- Modify: `backend/src/services/seed.ts`

- [ ] **Step 1: Rewrite seed.ts completely**

```typescript
import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { normalizeDate, calculatePolicyStatus } from './policyStatus.js';

function accountExists(db: Database.Database): boolean {
  return Boolean(db.prepare('SELECT 1 FROM usuarios LIMIT 1').get());
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function randomPlate(seed: number): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const l = (n: number) => letters[n % letters.length];
  return `${l(seed)}${l(seed + 3)}${l(seed + 7)}-${(seed % 10)}${((seed + 1) % 10)}${((seed + 3) % 10)}`;
}

const VEHICLES = [
  { marca: 'Renault', modelo: 'Sandero', cilindraje: '1600cc', year: 2020 },
  { marca: 'Chevrolet', modelo: 'Spark GT', cilindraje: '1200cc', year: 2019 },
  { marca: 'Mazda', modelo: '3', cilindraje: '2000cc', year: 2021 },
  { marca: 'Toyota', modelo: 'Corolla', cilindraje: '1800cc', year: 2022 },
  { marca: 'Kia', modelo: 'Picanto', cilindraje: '1000cc', year: 2021 },
  { marca: 'Hyundai', modelo: 'Tucson', cilindraje: '2000cc', year: 2019 },
  { marca: 'Ford', modelo: 'EcoSport', cilindraje: '1500cc', year: 2020 },
  { marca: 'Chevrolet', modelo: 'Onix', cilindraje: '1000cc', year: 2023 },
  { marca: 'Renault', modelo: 'Duster', cilindraje: '1600cc', year: 2018 },
  { marca: 'Mazda', modelo: 'CX-5', cilindraje: '2500cc', year: 2022 },
];

function autoNotas(idx: number): string {
  const v = VEHICLES[idx % VEHICLES.length];
  return `placa: ${randomPlate(idx * 7 + 3)} | marca: ${v.marca} | modelo: ${v.modelo} | año: ${v.year} | cilindraje: ${v.cilindraje}`;
}

// [finVigOffset, inicioVigOffset, tipo, tipoContratacion, clienteIdx, aseguradoraIdx]
type PolicyDef = [number, number, 'AUTO' | 'HOGAR' | 'VIDA' | 'OTRA', 'NUEVA_CONTRATACION' | 'RENOVACION', number, number];

const POLICY_DEFS: PolicyDef[] = [
  // VIGENTE (12 AUTO)
  [60,  -305, 'AUTO', 'NUEVA_CONTRATACION', 0, 0],
  [75,  -290, 'AUTO', 'RENOVACION',         1, 1],
  [90,  -275, 'AUTO', 'NUEVA_CONTRATACION', 2, 2],
  [100, -265, 'AUTO', 'RENOVACION',         3, 0],
  [120, -245, 'AUTO', 'NUEVA_CONTRATACION', 4, 1],
  [130, -235, 'AUTO', 'RENOVACION',         5, 2],
  [145, -220, 'AUTO', 'NUEVA_CONTRATACION', 6, 0],
  [150, -215, 'AUTO', 'RENOVACION',         7, 1],
  [160, -205, 'AUTO', 'NUEVA_CONTRATACION', 8, 2],
  [165, -200, 'AUTO', 'RENOVACION',         9, 0],
  [170, -195, 'AUTO', 'NUEVA_CONTRATACION', 0, 1],
  [180, -185, 'AUTO', 'RENOVACION',         1, 2],
  // PROXIMA_VENCER (10 AUTO)
  [1,  -364, 'AUTO', 'NUEVA_CONTRATACION', 2, 0],
  [5,  -360, 'AUTO', 'RENOVACION',         3, 1],
  [10, -355, 'AUTO', 'NUEVA_CONTRATACION', 4, 2],
  [14, -351, 'AUTO', 'RENOVACION',         5, 0],
  [18, -347, 'AUTO', 'NUEVA_CONTRATACION', 6, 1],
  [21, -344, 'AUTO', 'RENOVACION',         7, 2],
  [24, -341, 'AUTO', 'NUEVA_CONTRATACION', 8, 0],
  [26, -339, 'AUTO', 'RENOVACION',         9, 1],
  [28, -337, 'AUTO', 'NUEVA_CONTRATACION', 0, 2],
  [29, -336, 'AUTO', 'RENOVACION',         1, 0],
  // VENCIDA_RENOVABLE (8 AUTO)
  [-1,  -366, 'AUTO', 'RENOVACION',         2, 1],
  [-5,  -370, 'AUTO', 'NUEVA_CONTRATACION', 3, 2],
  [-10, -375, 'AUTO', 'RENOVACION',         4, 0],
  [-12, -377, 'AUTO', 'NUEVA_CONTRATACION', 5, 1],
  [-15, -380, 'AUTO', 'RENOVACION',         6, 2],
  [-17, -382, 'AUTO', 'NUEVA_CONTRATACION', 7, 0],
  [-19, -384, 'AUTO', 'RENOVACION',         8, 1],
  [-20, -385, 'AUTO', 'NUEVA_CONTRATACION', 9, 2],
  // VENCIDA_CRITICA (8 AUTO)
  [-21, -386, 'AUTO', 'RENOVACION',         0, 0],
  [-23, -388, 'AUTO', 'NUEVA_CONTRATACION', 1, 1],
  [-25, -390, 'AUTO', 'RENOVACION',         2, 2],
  [-26, -391, 'AUTO', 'NUEVA_CONTRATACION', 3, 0],
  [-27, -392, 'AUTO', 'RENOVACION',         4, 1],
  [-28, -393, 'AUTO', 'NUEVA_CONTRATACION', 5, 2],
  [-29, -394, 'AUTO', 'RENOVACION',         6, 0],
  [-30, -395, 'AUTO', 'NUEVA_CONTRATACION', 7, 1],
  // VENCIDA_PERDIDA (7 AUTO)
  [-31, -396, 'AUTO', 'RENOVACION',         8, 2],
  [-40, -405, 'AUTO', 'NUEVA_CONTRATACION', 9, 0],
  [-50, -415, 'AUTO', 'RENOVACION',         0, 1],
  [-60, -425, 'AUTO', 'NUEVA_CONTRATACION', 1, 2],
  [-70, -435, 'AUTO', 'RENOVACION',         2, 0],
  [-80, -445, 'AUTO', 'NUEVA_CONTRATACION', 3, 1],
  [-90, -455, 'AUTO', 'RENOVACION',         4, 2],
  // OTHER TYPES (10: mix HOGAR/VIDA/OTRA)
  [45,  -320, 'HOGAR', 'NUEVA_CONTRATACION', 5, 0],
  [80,  -285, 'HOGAR', 'RENOVACION',         6, 1],
  [120, -245, 'VIDA',  'NUEVA_CONTRATACION', 7, 2],
  [15,  -350, 'VIDA',  'RENOVACION',         8, 0],
  [-5,  -370, 'VIDA',  'NUEVA_CONTRATACION', 9, 1],
  [-35, -400, 'HOGAR', 'RENOVACION',         0, 2],
  [5,   -360, 'OTRA',  'NUEVA_CONTRATACION', 1, 0],
  [-25, -390, 'OTRA',  'RENOVACION',         2, 1],
  [100, -265, 'HOGAR', 'NUEVA_CONTRATACION', 3, 2],
  [-55, -420, 'VIDA',  'RENOVACION',         4, 0],
];

export function seedDatabase(db: Database.Database): void {
  if (accountExists(db)) return;

  const insertAseguradora = db.prepare('INSERT INTO aseguradoras (razonSocial, nit, telefono, email) VALUES (?, ?, ?, ?)');
  const insertRama       = db.prepare('INSERT INTO aseguradora_ramas (aseguradoraId, rama) VALUES (?, ?)');
  const insertUser       = db.prepare('INSERT INTO usuarios (nombres, apellidos, email, passwordHash, rol) VALUES (?, ?, ?, ?, ?)');
  const insertAsesorAseg = db.prepare('INSERT INTO asesor_aseguradoras (usuarioId, aseguradoraId, codigo) VALUES (?, ?, ?)');
  const insertCliente    = db.prepare('INSERT INTO clientes (asesorId, nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertPoliza     = db.prepare('INSERT INTO polizas (clienteId, asesorId, aseguradoraId, numeroPoliza, tipo, fechaExpedicion, fechaInicioVig, fechaFinVig, estado, tipoContratacion, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertHistorial  = db.prepare('INSERT INTO poliza_historial (polizaId, tipo, fechaInicioVig, fechaFinVig) VALUES (?, ?, ?, ?)');

  const suraId = insertAseguradora.run('Sura', '900123456-7', '+57 1 2345678', 'contacto@sura.com').lastInsertRowid as number;
  const hdiId  = insertAseguradora.run('HDI Seguros', '900987654-3', '+57 1 8765432', 'info@hdi.com').lastInsertRowid as number;
  const axaId  = insertAseguradora.run('AXA Colpatria', '900112233-5', '+57 1 4455667', 'soporte@axa.com').lastInsertRowid as number;
  const asegIds = [suraId, hdiId, axaId];

  ['AUTO', 'HOGAR', 'VIDA'].forEach((r) => insertRama.run(suraId, r));
  ['HOGAR', 'VIDA', 'AUTO'].forEach((r) => insertRama.run(hdiId, r));
  ['VIDA', 'AUTO', 'HOGAR'].forEach((r) => insertRama.run(axaId, r));

  const adminHash  = bcrypt.hashSync('Admin123!', 12);
  const asesorHash = bcrypt.hashSync('Asesor123!', 12);

  insertUser.run('Administrador', 'Agentemotor', 'admin@agentemotor.com', adminHash, 'ADMIN');
  const asesorId = insertUser.run('Andrea', 'Vargas', 'andrea@agentemotor.com', asesorHash, 'ASESOR').lastInsertRowid as number;

  insertAsesorAseg.run(asesorId, suraId, 'ASA-SURA-001');
  insertAsesorAseg.run(asesorId, hdiId,  'ASA-HDI-007');
  insertAsesorAseg.run(asesorId, axaId,  'ASA-AXA-003');

  const CLIENTS: [string, string, string, string, string, string, string, string, string][] = [
    ['Carlos',     'Ramírez Torres',   'CC',  '1020304050', '+573001234567', 'carlos.ramirez@email.com',   '+5712345678', '1985-03-15', 'POLIZA_CONTRATADA'],
    ['María',      'González Pérez',   'CC',  '1030405060', '+573109876543', 'maria.gonzalez@email.com',   '+5719876543', '1990-07-22', 'POLIZA_CONTRATADA'],
    ['Juan',       'Martínez López',   'CC',  '1040506070', '+573201112233', 'juan.martinez@email.com',    '',            '1978-11-30', 'COTIZACION'],
    ['Ana',        'Rodríguez Vargas', 'CC',  '1050607080', '+573154445566', 'ana.rodriguez@email.com',    '+5713456789', '1995-01-08', 'POLIZA_CONTRATADA'],
    ['Pedro',      'Hernández Ruiz',   'CC',  '1060708090', '+573007778899', 'pedro.hernandez@email.com',  '',            '1982-06-14', 'NO_VIGENTE'],
    ['Luisa',      'Castro Moreno',    'CC',  '1070809010', '+573122223333', 'luisa.castro@email.com',     '+5716677889', '1993-09-25', 'POLIZA_CONTRATADA'],
    ['Santiago',   'Díaz Ospina',      'CC',  '1080900110', '+573185556677', 'santiago.diaz@email.com',    '',            '1988-04-03', 'GESTIONADO'],
    ['Valentina',  'Torres Quintero',  'CC',  '1090011020', '+573218889900', 'valentina.torres@email.com', '+5714455667', '1997-12-18', 'POLIZA_CONTRATADA'],
    ['Andrés',     'López Ávila',      'CC',  '1001112030', '+573162233445', 'andres.lopez@email.com',     '',            '1975-08-07', 'SIN_CONTACTO'],
    ['Empresa',    'Logística S.A.S',  'NIT', '900123456',  '+573013334455', 'contacto@logistica.com',     '+5712001122', '',           'POLIZA_CONTRATADA'],
  ];

  const clientIds: number[] = [];
  for (const c of CLIENTS) {
    clientIds.push(insertCliente.run(asesorId, ...c).lastInsertRowid as number);
  }

  let polizaCounter = 1;
  for (const [finOffset, inicioOffset, tipo, tipoContratacion, clienteIdx, asegIdx] of POLICY_DEFS) {
    const finVig      = offsetDate(finOffset);
    const inicioVig   = offsetDate(inicioOffset);
    const expedicion  = offsetDate(inicioOffset - 2);
    const estado      = calculatePolicyStatus(finVig);
    const clienteId   = clientIds[clienteIdx];
    const aseguradoraId = asegIds[asegIdx];
    const notas       = tipo === 'AUTO' ? autoNotas(polizaCounter) : null;
    const numeroPoliza = `POL-${tipo.slice(0,2)}-${String(polizaCounter).padStart(3, '0')}-2026`;

    const polizaId = insertPoliza.run(
      clienteId, asesorId, aseguradoraId, numeroPoliza,
      tipo, expedicion, inicioVig, finVig,
      estado, tipoContratacion, notas
    ).lastInsertRowid as number;

    insertHistorial.run(polizaId, tipoContratacion, inicioVig, finVig);
    polizaCounter++;
  }
}
```

- [ ] **Step 2: Delete existing database to force re-seed**

```bash
# The DB file is created at runtime. Check config.ts for the path.
cd backend && node -e "const c = require('./dist/config.js'); console.log(c.config.databaseFile)" 2>/dev/null || echo "Check backend/src/config.ts for databaseFile path"
```

Find and delete the `.db` file (e.g., `agentemotor.db` or `data/agentemotor.db`), then restart the backend — seed runs automatically on first request.

- [ ] **Step 3: Verify seed count**

Start backend with `npm run dev`, then:

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"andrea@agentemotor.com","password":"Asesor123!"}' \
  | grep -o '"accessToken":"[^"]*"' | head -1
```

Use the token:

```bash
TOKEN="<paste_token>"
curl -s -X POST http://localhost:3001/api/polizas/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page":1,"pageSize":100}' | python -c "import sys,json; d=json.load(sys.stdin); print('Total polizas:', d['total'])"
```

Expected: `Total polizas: 55`

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/seed.ts
git commit -m "feat(seed): 55+ policies across all 5 states with realistic AUTO vehicle data"
```

---

## Stream B — Hooks Extraction

### Task B1: Add filter drawer state to useDashboard

**Files:**
- Modify: `frontend/src/pages/Dashboard/hooks/useDashboard.ts`

- [ ] **Step 1: Add `filterDrawerOpen`, `openFilterDrawer`, `closeFilterDrawer` to hook return**

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useFilters } from '../../../hooks/useFilters';
import { usePagination } from '../../../hooks/usePagination';
import type { DashboardResponse, DashboardSearchParams, PolicyStatus } from '../../../types';

const INITIAL_FILTERS: DashboardSearchParams = {
  estado: undefined,
  tipo: undefined,
  numeroPoliza: undefined,
  documento: undefined,
  nombre: undefined,
};

export function useDashboard() {
  const { filters, setFilter, resetFilters, activeFilterCount } =
    useFilters<DashboardSearchParams>(INITIAL_FILTERS);
  const { page, pageSize, setPage, setPageSize, resetPagination } = usePagination();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const query = useQuery({
    queryKey: ['dashboard', filters, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.post<DashboardResponse>('/dashboard/search', {
        ...filters,
        page,
        pageSize,
      });
      return data;
    },
  });

  const filterByStatus = (status: PolicyStatus) => {
    if (filters.estado === status) {
      setFilter('estado', undefined);
    } else {
      setFilter('estado', status);
    }
    resetPagination();
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    filters,
    setFilter: (key: keyof DashboardSearchParams, value: unknown) => {
      setFilter(key, value as DashboardSearchParams[typeof key]);
      resetPagination();
    },
    resetFilters: () => {
      resetFilters();
      resetPagination();
    },
    activeFilterCount,
    filterByStatus,
    page,
    pageSize,
    setPage,
    setPageSize,
    filterDrawerOpen,
    openFilterDrawer: () => setFilterDrawerOpen(true),
    closeFilterDrawer: () => setFilterDrawerOpen(false),
  };
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "useDashboard"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard/hooks/useDashboard.ts
git commit -m "refactor(hooks): add filterDrawer state to useDashboard"
```

---

### Task B2: Add filter drawer state to usePolizasInforme

**Files:**
- Modify: `frontend/src/pages/Policies/hooks/usePolizasInforme.ts`

- [ ] **Step 1: Add drawer state**

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useFilters } from '../../../hooks/useFilters';
import { usePagination } from '../../../hooks/usePagination';
import { useExcelExport } from '../../../hooks/useExcelExport';
import type { PolizaSearchResponse } from '../../../types';

interface PolizaFilters {
  tipo?: string;
  estado?: string;
  tipoContratacion?: string;
  desde?: string;
  hasta?: string;
  documento?: string;
  numeroPoliza?: string;
  aseguradoraId?: number;
}

const INITIAL_FILTERS: PolizaFilters = {};

export function usePolizasInforme() {
  const { filters, setFilter, resetFilters, activeFilterCount } =
    useFilters<PolizaFilters>(INITIAL_FILTERS);
  const { page, pageSize, setPage, setPageSize, resetPagination } = usePagination();
  const { exportToExcel, isExporting } = useExcelExport({
    url: '/polizas/export',
    filename: 'polizas-export.xlsx',
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const query = useQuery({
    queryKey: ['polizas', filters, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.post<PolizaSearchResponse>('/polizas/search', {
        ...filters,
        page,
        pageSize,
      });
      return data;
    },
  });

  return {
    polizas: query.data?.polizas ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    filters,
    setFilter: (key: keyof PolizaFilters, value: unknown) => {
      setFilter(key, value as PolizaFilters[typeof key]);
      resetPagination();
    },
    resetFilters: () => {
      resetFilters();
      resetPagination();
    },
    activeFilterCount,
    page,
    pageSize,
    setPage,
    setPageSize,
    exportToExcel: () => exportToExcel(filters),
    isExporting,
    filterDrawerOpen,
    openFilterDrawer: () => setFilterDrawerOpen(true),
    closeFilterDrawer: () => setFilterDrawerOpen(false),
  };
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "usePolizasInforme"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Policies/hooks/usePolizasInforme.ts
git commit -m "refactor(hooks): add filterDrawer state to usePolizasInforme"
```

---

### Task B3: Extract useLogForm from PolizaDetallePage

**Files:**
- Create: `frontend/src/pages/Policy/hooks/useLogForm.ts`

- [ ] **Step 1: Create useLogForm.ts**

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useGestion } from './useGestion';
import type { LogEntry } from '../../../types';

const LOG_ACTIONS = ['LLAMADA', 'EMAIL', 'VISITA', 'RENOVACION'] as const;
export type LogAction = typeof LOG_ACTIONS[number];
export { LOG_ACTIONS };

export function useLogForm(polizaId: number | undefined, clienteId: number | undefined) {
  const [accion, setAccion] = useState<LogAction>('LLAMADA');
  const [notas, setNotas] = useState('');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const { registrarGestion, isLoading: isLogging, error: gestionError } = useGestion(polizaId, clienteId);

  const logsQuery = useQuery({
    queryKey: ['clienteLogs', clienteId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ logs: LogEntry[] }>(`/clientes/${clienteId}`);
      return data.logs;
    },
    enabled: !!clienteId,
  });

  const submit = () => {
    registrarGestion(
      { accion, notas: notas || undefined },
      {
        onSuccess: () => {
          setNotas('');
        },
      }
    );
  };

  return {
    accion,
    setAccion,
    notas,
    setNotas,
    submit,
    isLogging,
    gestionError,
    logs: logsQuery.data ?? [],
    logsError: logsQuery.error,
    historyDrawerOpen,
    openHistoryDrawer: () => setHistoryDrawerOpen(true),
    closeHistoryDrawer: () => setHistoryDrawerOpen(false),
    LOG_ACTIONS,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "useLogForm"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Policy/hooks/useLogForm.ts
git commit -m "refactor(hooks): extract useLogForm from PolizaDetallePage"
```

---

### Task B4: Create useClientesListPage hook

**Files:**
- Create: `frontend/src/pages/Clients/hooks/useClientesListPage.ts`

- [ ] **Step 1: Create useClientesListPage.ts**

```typescript
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type { ImportResponse } from '../../../types';

export function useClientesListPage() {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post<ImportResponse>('/clientes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const downloadTemplate = async () => {
    const response = await apiClient.get('/clientes/template', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-clientes.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    importModalOpen,
    openImportModal: () => setImportModalOpen(true),
    closeImportModal: () => {
      setImportModalOpen(false);
      uploadMutation.reset();
    },
    uploadMutation,
    downloadTemplate,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "useClientesListPage"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Clients/hooks/useClientesListPage.ts
git commit -m "refactor(hooks): extract useClientesListPage with import modal + template download"
```

---

## Stream C — UI Features

### Task C1: Theme store + createAppTheme

**Files:**
- Create: `frontend/src/store/themeStore.ts`
- Modify: `frontend/src/theme/theme.ts`

- [ ] **Step 1: Create themeStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  mode: 'light' | 'dark';
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      toggle: () => set({ mode: get().mode === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'agentemotor-theme' }
  )
);
```

- [ ] **Step 2: Rewrite theme.ts to export createAppTheme(mode)**

Replace the entire file content with:

```typescript
import { createTheme, alpha } from '@mui/material/styles';
import type { PolicyStatus } from '../types';

export const policyStatusColors: Record<PolicyStatus, { main: string; light: string; dark: string }> = {
  VIGENTE:           { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
  PROXIMA_VENCER:    { main: '#ff9800', light: '#ffb74d', dark: '#f57c00' },
  VENCIDA_RENOVABLE: { main: '#f57c00', light: '#ffb74d', dark: '#e65100' },
  VENCIDA_CRITICA:   { main: '#f44336', light: '#e57373', dark: '#d32f2f' },
  VENCIDA_PERDIDA:   { main: '#9e9e9e', light: '#bdbdbd', dark: '#757575' },
};

export const policyStatusLabels: Record<PolicyStatus, string> = {
  VIGENTE:           'Vigente',
  PROXIMA_VENCER:    'Próxima a vencer',
  VENCIDA_RENOVABLE: 'Vencida - Renovable',
  VENCIDA_CRITICA:   'Vencida - Crítica',
  VENCIDA_PERDIDA:   'Vencida - Perdida',
};

export function createAppTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary:    { main: '#6C63FF', light: '#8B83FF', dark: '#4B44B2', contrastText: '#ffffff' },
      secondary:  { main: '#00D9FF', light: '#33E1FF', dark: '#00A3BF', contrastText: '#000000' },
      background: isDark
        ? { default: '#0A0E1A', paper: '#111827' }
        : { default: '#F1F5F9', paper: '#FFFFFF' },
      error:   { main: '#FF5252', light: '#FF7B7B', dark: '#D32F2F' },
      warning: { main: '#FFB74D', light: '#FFD180', dark: '#FF9800' },
      success: { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
      info:    { main: '#40C4FF', light: '#80D8FF', dark: '#0091EA' },
      text: isDark
        ? { primary: '#F1F5F9', secondary: '#94A3B8' }
        : { primary: '#1E293B', secondary: '#64748B' },
      divider: alpha(isDark ? '#94A3B8' : '#64748B', 0.12),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
      h2: { fontSize: '2rem',   fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 },
      h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontSize: '1.25rem', fontWeight: 600 },
      h5: { fontSize: '1.1rem',  fontWeight: 600 },
      h6: { fontSize: '1rem',    fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
      body1: { fontSize: '0.938rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#374151 transparent' : '#CBD5E1 transparent',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-1px)' },
          },
          contained: {
            boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
            '&:hover': { boxShadow: '0 6px 20px rgba(108, 99, 255, 0.6)' },
          },
          outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${alpha(isDark ? '#94A3B8' : '#64748B', 0.08)}`,
            backgroundImage: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.03em' } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.8rem',
            backgroundColor: isDark ? '#1E293B' : '#334155',
          },
        },
      },
    },
  });
}

// Keep a default export for backwards compat (light mode)
export default createAppTheme('light');
```

- [ ] **Step 3: Update App.tsx to use themeStore**

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useMemo } from 'react';
import { createAppTheme } from './theme/theme';
import { useThemeStore } from './store/themeStore';
import { queryClient } from './lib/queryClient';
import Router from './router';

function App() {
  const mode = useThemeStore((s) => s.mode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 4: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "theme|App\.tsx"
```

Expected: no errors in theme.ts or App.tsx.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/store/themeStore.ts frontend/src/theme/theme.ts frontend/src/App.tsx
git commit -m "feat(ui): add themeStore + createAppTheme(mode) with light/dark support"
```

---

### Task C2: Add theme toggle + logout buttons to AppBar

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Update AppLayout to always show AppBar with theme toggle + logout**

Replace the entire `AppLayout.tsx` content with the following. Key changes:
- AppBar is always visible (not just on mobile)  
- On desktop, AppBar is offset by `DRAWER_WIDTH`: `sx={{ width: calc(100% - DRAWER_WIDTH), ml: DRAWER_WIDTH }}`
- AppBar right side: theme toggle icon + logout icon
- Main content `mt` accounts for AppBar height on all screen sizes

```typescript
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PolicyIcon from '@mui/icons-material/Policy';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ShieldIcon from '@mui/icons-material/Shield';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import apiClient from '../../lib/apiClient';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Clientes',  icon: <PeopleIcon />,    path: '/clientes' },
  { label: 'Pólizas',   icon: <PolicyIcon />,    path: '/polizas' },
];

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { mode, toggle } = useThemeStore();

  const handleLogout = async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #6C63FF 0%, #00D9FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldIcon sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>AgenteMotor</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Gestión de pólizas</Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, borderColor: 'divider' }} />

      <List sx={{ px: 1, py: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
              sx={{ mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={<Typography sx={{ fontWeight: isActive ? 600 : 400, fontSize: '0.9rem' }}>{item.label}</Typography>} />
              {isActive && <Box sx={{ width: 4, height: 24, borderRadius: 2, backgroundColor: 'primary.main', ml: 1 }} />}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ mx: 2, borderColor: 'divider' }} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, backgroundColor: 'rgba(108, 99, 255, 0.06)' }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700, background: 'linear-gradient(135deg, #6C63FF 0%, #00D9FF 100%)' }}>
            {user?.nombres?.[0]}{user?.apellidos?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{user?.nombres} {user?.apellidos}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user?.rol === 'ADMIN' ? 'Administrador' : 'Asesor'}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar — always visible, offset on desktop */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Mobile: hamburger + logo */}
          {isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(!mobileOpen)}>
                <MenuIcon />
              </IconButton>
              <ShieldIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>AgenteMotor</Typography>
            </Box>
          ) : (
            <Box /> /* spacer on desktop */
          )}

          {/* Right side: theme toggle + logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              <IconButton onClick={toggle} color="inherit">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Cerrar sesión">
              <IconButton onClick={handleLogout} color="inherit">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main content — pushed below AppBar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: '64px', /* AppBar height */
          maxWidth: '100%',
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "AppLayout"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/AppLayout.tsx
git commit -m "feat(ui): add theme toggle + logout button to AppBar, visible on all screen sizes"
```

---

### Task C3: Create FilterDrawer component

**Files:**
- Create: `frontend/src/components/common/FilterDrawer.tsx`

- [ ] **Step 1: Create FilterDrawer.tsx**

```typescript
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import FilterBar from '../FilterBar';
import type { FilterFieldConfig } from '../../types';

interface FilterDrawerProps<T extends Record<string, unknown>> {
  open: boolean;
  onClose: () => void;
  fields: FilterFieldConfig[];
  values: T;
  onChange: (name: keyof T, value: unknown) => void;
  onClear: () => void;
  activeCount?: number;
}

export default function FilterDrawer<T extends Record<string, unknown>>({
  open,
  onClose,
  fields,
  values,
  onChange,
  onClear,
  activeCount = 0,
}: FilterDrawerProps<T>) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 320, display: 'flex', flexDirection: 'column' } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Filtros {activeCount > 0 && `(${activeCount} activos)`}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      {/* Filter fields — rendered in vertical stack */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <FilterBar
          fields={fields}
          values={values}
          onChange={onChange}
          onReset={onClear}
          activeCount={activeCount}
        />
      </Box>

      <Divider />

      {/* Footer actions */}
      <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => { onClear(); onClose(); }}
          disabled={activeCount === 0}
        >
          Limpiar
        </Button>
        <Button variant="contained" fullWidth onClick={onClose}>
          Aplicar
        </Button>
      </Stack>
    </Drawer>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "FilterDrawer"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/common/FilterDrawer.tsx
git commit -m "feat(ui): add FilterDrawer component — right-side drawer wrapping FilterBar"
```

---

### Task C4: Update DashboardPage to use FilterDrawer

**Files:**
- Modify: `frontend/src/pages/Dashboard/DashboardPage.tsx`

- [ ] **Step 1: Replace inline FilterBar with FilterDrawer + trigger button**

```typescript
import { useMemo, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import AutoRenewIcon from '@mui/icons-material/AutoRenew';
import DashboardCard from '../../components/DashboardCard';
import FilterDrawer from '../../components/common/FilterDrawer';
import PolicyTable from '../../components/PolicyTable';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useDashboard } from './hooks/useDashboard';
import type { FilterFieldConfig, PolicyStatus } from '../../types';

const STATUS_CARDS: Array<{ status: PolicyStatus; title: string; icon: JSX.Element }> = [
  { status: 'VIGENTE',           title: 'Vigentes',             icon: <CheckCircleOutlineIcon /> },
  { status: 'PROXIMA_VENCER',    title: 'Próximas a vencer',    icon: <WarningAmberIcon /> },
  { status: 'VENCIDA_RENOVABLE', title: 'Vencidas renovables',  icon: <AutoRenewIcon /> },
  { status: 'VENCIDA_CRITICA',   title: 'Críticas',             icon: <ErrorOutlineOutlinedIcon /> },
  { status: 'VENCIDA_PERDIDA',   title: 'Perdidas',             icon: <HistoryToggleOffIcon /> },
];

const FILTER_FIELDS: FilterFieldConfig[] = [
  { name: 'estado', label: 'Estado', type: 'select', options: STATUS_CARDS.map((c) => ({ value: c.status, label: c.title })) },
  { name: 'tipo', label: 'Tipo de póliza', type: 'select', options: [
    { value: 'AUTO', label: 'Auto' },
    { value: 'HOGAR', label: 'Hogar' },
    { value: 'VIDA', label: 'Vida' },
    { value: 'OTRA', label: 'Otra' },
  ]},
  { name: 'numeroPoliza', label: 'Número de póliza', type: 'text' },
  { name: 'documento', label: 'Documento', type: 'text' },
  { name: 'nombre', label: 'Nombre', type: 'text' },
];

const FILTER_LABELS: Record<string, string> = {
  estado: 'Estado', tipo: 'Tipo', numeroPoliza: 'Póliza', documento: 'Doc.', nombre: 'Nombre',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    data, isLoading, error,
    filters, setFilter, resetFilters, activeFilterCount, filterByStatus,
    page, pageSize, setPage, setPageSize,
    filterDrawerOpen, openFilterDrawer, closeFilterDrawer,
  } = useDashboard();

  const cards = useMemo(
    () => STATUS_CARDS.map((card) => ({ ...card, count: data?.dashboard?.[card.status] ?? 0 })),
    [data]
  );

  const activeChips = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => ({ key: k, label: `${FILTER_LABELS[k] ?? k}: ${v}` }));

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Visualiza el estado de tu cartera y filtra las pólizas críticas en tiempo real."
        actions={
          <Badge badgeContent={activeFilterCount} color="primary">
            <Button variant="outlined" startIcon={<FilterListIcon />} onClick={openFilterDrawer}>
              Filtros
            </Button>
          </Badge>
        }
      />

      {activeChips.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} size="small" onDelete={() => setFilter(chip.key as keyof typeof filters, undefined)} />
          ))}
        </Stack>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={card.status}>
            <DashboardCard
              title={card.title}
              count={card.count}
              status={card.status}
              icon={card.icon}
              onClick={() => filterByStatus(card.status)}
              loading={isLoading}
              active={filters.estado === card.status}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <ErrorAlert error={error ?? null} />
        {data?.polizas?.length ? (
          <PolicyTable
            polizas={data.polizas}
            loading={isLoading}
            page={page}
            pageSize={pageSize}
            total={data.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRowClick={(id) => navigate(`/polizas/${id}`)}
          />
        ) : (
          <EmptyState
            title={isLoading ? 'Cargando pólizas...' : 'No hay pólizas para mostrar'}
            description="Ajusta los filtros para encontrar las pólizas más relevantes de tu cartera."
          />
        )}
      </Box>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={closeFilterDrawer}
        fields={FILTER_FIELDS}
        values={filters}
        onChange={setFilter}
        onClear={resetFilters}
        activeCount={activeFilterCount}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "DashboardPage"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard/DashboardPage.tsx
git commit -m "feat(ui): Dashboard — replace FilterBar with FilterDrawer + active filter chips"
```

---

### Task C5: Update PolizasInformePage to use FilterDrawer

**Files:**
- Modify: `frontend/src/pages/Policies/PolizasInformePage.tsx`

- [ ] **Step 1: Replace inline FilterBar with FilterDrawer + trigger button**

```typescript
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import FilterListIcon from '@mui/icons-material/FilterList';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import PageHeader from '../../components/common/PageHeader';
import FilterDrawer from '../../components/common/FilterDrawer';
import PolicyTable from '../../components/PolicyTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorAlert from '../../components/common/ErrorAlert';
import { usePolizasInforme } from './hooks/usePolizasInforme';
import type { FilterFieldConfig } from '../../types';

const FILTER_FIELDS: FilterFieldConfig[] = [
  { name: 'tipo', label: 'Tipo de póliza', type: 'select', options: [
    { value: 'AUTO', label: 'Auto' },
    { value: 'HOGAR', label: 'Hogar' },
    { value: 'VIDA', label: 'Vida' },
    { value: 'OTRA', label: 'Otra' },
  ]},
  { name: 'estado', label: 'Estado', type: 'select', options: [
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'PROXIMA_VENCER', label: 'Próxima a vencer' },
    { value: 'VENCIDA_RENOVABLE', label: 'Vencida renovable' },
    { value: 'VENCIDA_CRITICA', label: 'Vencida crítica' },
    { value: 'VENCIDA_PERDIDA', label: 'Vencida perdida' },
  ]},
  { name: 'tipoContratacion', label: 'Tipo contratación', type: 'select', options: [
    { value: 'NUEVA_CONTRATACION', label: 'Nueva contratación' },
    { value: 'RENOVACION', label: 'Renovación' },
  ]},
  { name: 'desde', label: 'Desde', type: 'date' },
  { name: 'hasta', label: 'Hasta', type: 'date' },
  { name: 'documento', label: 'Documento', type: 'text' },
  { name: 'numeroPoliza', label: 'Número de póliza', type: 'text' },
];

const FILTER_LABELS: Record<string, string> = {
  tipo: 'Tipo', estado: 'Estado', tipoContratacion: 'Contratación',
  desde: 'Desde', hasta: 'Hasta', documento: 'Doc.', numeroPoliza: 'Póliza',
};

export default function PolizasInformePage() {
  const navigate = useNavigate();
  const {
    polizas, total, isLoading, error,
    filters, setFilter, resetFilters, activeFilterCount,
    page, pageSize, setPage, setPageSize,
    exportToExcel, isExporting,
    filterDrawerOpen, openFilterDrawer, closeFilterDrawer,
  } = usePolizasInforme();

  const activeChips = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => ({ key: k, label: `${FILTER_LABELS[k] ?? k}: ${v}` }));

  return (
    <Box>
      <PageHeader
        title="Informe de pólizas"
        subtitle="Explora y exporta tu informe de pólizas con filtros rápidos y paginación."
        actions={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button variant="outlined" startIcon={<FilterListIcon />} onClick={openFilterDrawer}>
                Filtros
              </Button>
            </Badge>
            <Button
              variant="contained"
              startIcon={<ContentPasteGoIcon />}
              onClick={exportToExcel}
              disabled={isExporting}
            >
              Exportar Excel
            </Button>
          </Stack>
        }
      />

      {activeChips.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} size="small" onDelete={() => setFilter(chip.key as keyof typeof filters, undefined)} />
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 3 }}>
        <ErrorAlert error={error ?? null} />
        {polizas.length ? (
          <PolicyTable
            polizas={polizas}
            loading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRowClick={(id) => navigate(`/polizas/${id}`)}
          />
        ) : (
          <EmptyState
            title={isLoading ? 'Cargando pólizas...' : 'No hay resultados para esos filtros'}
            description="Ajusta los filtros para ver resultados o exportar un informe específico."
          />
        )}
      </Box>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={closeFilterDrawer}
        fields={FILTER_FIELDS}
        values={filters}
        onChange={setFilter}
        onClear={resetFilters}
        activeCount={activeFilterCount}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "PolizasInformePage"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Policies/PolizasInformePage.tsx
git commit -m "feat(ui): PolizasInforme — replace FilterBar with FilterDrawer + active filter chips"
```

---

### Task C6: Add drag & drop to ExcelImportStepper + History Drawer in PolizaDetallePage + wiring ClientesListPage

**Files:**
- Modify: `frontend/src/components/ExcelImportStepper.tsx`
- Modify: `frontend/src/pages/Clients/ClientesListPage.tsx`
- Modify: `frontend/src/pages/Policy/PolizaDetallePage.tsx`

#### Part 1: Add drag & drop to ExcelImportStepper

- [ ] **Step 1: Update ExcelImportStepper.tsx**

Replace file content (the component now accepts `importResponse` + `onUpload` as controlled props so the hook owns state; but to keep changes minimal and not break the existing API, we instead lift state to `useClientesListPage` and pass down via props. The simplest approach: keep internal state but add drag & drop to step 0):

```typescript
import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoadingButton from '@mui/lab/LoadingButton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import type { ImportResponse } from '../types';

interface ExcelImportStepperProps {
  onComplete: () => void;
  onDownloadTemplate?: () => void;
}

const STEPS = ['Subir archivo', 'Validar datos', 'Resultado'];

export default function ExcelImportStepper({ onComplete, onDownloadTemplate }: ExcelImportStepperProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post<ImportResponse>('/clientes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveStep(2);
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const handleFileSelect = useCallback((selected: File | null) => {
    if (selected && (selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls'))) {
      setFile(selected);
      setActiveStep(1);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  const importedCount = result?.summary.filter((r) => r.status === 'imported').length ?? 0;
  const rejectedCount = result?.summary.filter((r) => r.status === 'rejected').length ?? 0;

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {/* Step 0: Upload with drag & drop */}
      {activeStep === 0 && (
        <Box>
          <Box
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: isDragOver ? 'primary.main' : 'divider',
              borderRadius: 3,
              textAlign: 'center',
              py: 6,
              px: 3,
              backgroundColor: isDragOver ? 'rgba(108, 99, 255, 0.06)' : 'transparent',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.7 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>Arrastra tu archivo aquí</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Formato .xlsx — columnas: nombres, apellidos, tipoDoc, documento, celular, email
            </Typography>
            <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
              Seleccionar archivo
              <input type="file" hidden accept=".xlsx,.xls" onChange={handleInputChange} />
            </Button>
          </Box>

          {onDownloadTemplate && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button variant="text" size="small" onClick={onDownloadTemplate}>
                Descargar plantilla de ejemplo
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Step 1: Confirm */}
      {activeStep === 1 && file && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
          </Alert>
          {uploadMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error al importar: {(uploadMutation.error as Error)?.message}
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => { setFile(null); setActiveStep(0); }}>
              Cambiar archivo
            </Button>
            <LoadingButton variant="contained" loading={uploadMutation.isPending} onClick={handleUpload} startIcon={<CloudUploadIcon />}>
              Importar
            </LoadingButton>
          </Box>
        </Box>
      )}

      {/* Step 2: Results */}
      {activeStep === 2 && result && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Alert severity="success" sx={{ flex: 1 }}>
              <strong>{importedCount}</strong> clientes importados correctamente
            </Alert>
            {rejectedCount > 0 && (
              <Alert severity="warning" sx={{ flex: 1 }}>
                <strong>{rejectedCount}</strong> registros rechazados
              </Alert>
            )}
          </Box>

          {rejectedCount > 0 && (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Estado</TableCell>
                    <TableCell>Datos</TableCell>
                    <TableCell>Razón</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.summary.filter((r) => r.status === 'rejected').map((row, i) => (
                    <TableRow key={i}>
                      <TableCell><Chip label="Rechazado" color="error" size="small" /></TableCell>
                      <TableCell><Typography variant="body2">{String(row.row?.nombres ?? '')} {String(row.row?.apellidos ?? '')}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="error.light">{row.reason}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={onComplete}>
              Finalizar
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
```

#### Part 2: Wire ClientesListPage with import modal + download button

- [ ] **Step 2: Update ClientesListPage.tsx**

```typescript
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorAlert from '../../components/common/ErrorAlert';
import ExcelImportStepper from '../../components/ExcelImportStepper';
import { useClientes } from './hooks/useClientes';
import { useClientesListPage } from './hooks/useClientesListPage';
import type { Cliente } from '../../types';

const getStatusLabel = (estado: Cliente['estadoGestion']) => {
  switch (estado) {
    case 'COTIZACION':       return { label: 'Cotización',       color: 'info' as const };
    case 'POLIZA_CONTRATADA': return { label: 'Póliza contratada', color: 'success' as const };
    case 'NO_VIGENTE':       return { label: 'No vigente',       color: 'warning' as const };
    case 'GESTIONADO':       return { label: 'Gestionado',       color: 'secondary' as const };
    default:                 return { label: 'Sin contacto',     color: 'default' as const };
  }
};

export default function ClientesListPage() {
  const navigate = useNavigate();
  const { clientes, isLoading, error, refetch } = useClientes();
  const { importModalOpen, openImportModal, closeImportModal, downloadTemplate } = useClientesListPage();

  const columns: GridColDef<Cliente>[] = useMemo(
    () => [
      { field: 'cliente', headerName: 'Cliente', flex: 1, minWidth: 220, valueGetter: (_value: unknown, row: Cliente) => `${row.nombres} ${row.apellidos}` },
      { field: 'tipoDoc', headerName: 'Tipo doc.', width: 100 },
      { field: 'documento', headerName: 'Documento', width: 150 },
      { field: 'celular', headerName: 'Celular', width: 150 },
      {
        field: 'estadoGestion',
        headerName: 'Estado gestión',
        width: 170,
        renderCell: (params: GridRenderCellParams<string, Cliente>) => {
          const { label, color } = getStatusLabel(params.value as Cliente['estadoGestion']);
          return <Chip label={label} color={color} size="small" />;
        },
      },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Clientes"
        subtitle="Gestiona tu cartera de clientes y accede a su historial de pólizas con un solo clic."
        actions={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()}>
              Actualizar
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate}>
              Descargar plantilla
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={openImportModal}>
              Importar clientes
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/clientes/nuevo')}>
              Nuevo cliente
            </Button>
          </Stack>
        }
      />

      <ErrorAlert error={error ?? null} />

      {clientes.length ? (
        <Paper sx={{ height: 600, borderRadius: 3, overflow: 'hidden' }}>
          <DataGrid<Cliente>
            rows={clientes}
            columns={columns}
            loading={isLoading}
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/clientes/${params.id}`)}
            initialState={{ pagination: { paginationModel: { pageSize: 20, page: 0 } } }}
            pageSizeOptions={[10, 20, 50]}
            sx={{ border: 'none' }}
          />
        </Paper>
      ) : (
        <EmptyState
          title={isLoading ? 'Cargando clientes...' : 'No hay clientes registrados'}
          description="Crea un cliente nuevo o importa desde Excel para comenzar a administrar su cartera."
          action={
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={openImportModal}>
                Importar clientes
              </Button>
              <Button variant="contained" onClick={() => navigate('/clientes/nuevo')}>
                Crear cliente
              </Button>
            </Stack>
          }
        />
      )}

      {/* Import modal */}
      <Dialog open={importModalOpen} onClose={closeImportModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Importar clientes desde Excel
          <IconButton size="small" onClick={closeImportModal}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <ExcelImportStepper
            onComplete={closeImportModal}
            onDownloadTemplate={downloadTemplate}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
```

#### Part 3: Update PolizaDetallePage to use useLogForm + History Drawer

- [ ] **Step 3: Update PolizaDetallePage.tsx**

```typescript
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import LoadingButton from '@mui/lab/LoadingButton';
import PageHeader from '../../components/common/PageHeader';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import EmptyState from '../../components/common/EmptyState';
import PolicyStatusChip from '../../components/PolicyStatusChip';
import LogTimeline from '../../components/LogTimeline';
import RenovarDialog from '../../components/RenovarDialog';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { usePolizaDetalle } from './hooks/usePolizaDetalle';
import { useRenovar } from './hooks/useRenovar';
import { useLogForm } from './hooks/useLogForm';
import { useState } from 'react';

export default function PolizaDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const polizaId = id ? Number(id) : undefined;
  const { poliza, historial, isLoading, error } = usePolizaDetalle(polizaId);
  const { renovar, isLoading: isRenovating } = useRenovar(polizaId);
  const {
    accion, setAccion, notas, setNotas, submit, isLogging, gestionError,
    logs, logsError, historyDrawerOpen, openHistoryDrawer, closeHistoryDrawer, LOG_ACTIONS,
  } = useLogForm(polizaId, poliza?.clienteId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const historyColumns: GridColDef[] = useMemo(
    () => [
      { field: 'tipo', headerName: 'Tipo', width: 160, valueFormatter: (params) => params.value === 'RENOVACION' ? 'Renovación' : 'Nueva contratación' },
      { field: 'fechaInicioVig', headerName: 'Inicio de vigencia', width: 150 },
      { field: 'fechaFinVig', headerName: 'Fin de vigencia', width: 150 },
      { field: 'creadoEn', headerName: 'Registrado el', width: 170 },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Detalle de póliza"
        subtitle="Revisa la vigencia, el historial y registra gestiones desde una sola vista."
        breadcrumbs={[
          { label: 'Pólizas', href: '/polizas' },
          { label: poliza ? poliza.numeroPoliza : 'Detalle' },
        ]}
        actions={
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => navigate('/polizas')}>
              Volver a pólizas
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => window.location.reload()}>
              Actualizar
            </Button>
            <Button variant="contained" startIcon={<HistoryIcon />} onClick={openHistoryDrawer}>
              Historial
            </Button>
          </Stack>
        }
      />

      <ErrorAlert error={error ?? null} />
      <ErrorAlert error={gestionError ?? null} />
      <ErrorAlert error={logsError ?? null} />
      <LoadingOverlay open={isLoading} message="Cargando póliza..." />

      {poliza ? (
        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">Resumen</Typography>
                    <PolicyStatusChip status={poliza.estado} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{poliza.numeroPoliza}</Typography>
                  <Typography variant="body2" color="text.secondary">Tipo: {poliza.tipo}</Typography>
                  <Typography variant="body2" color="text.secondary">Contratación: {poliza.tipoContratacion === 'RENOVACION' ? 'Renovación' : 'Nueva contratación'}</Typography>
                  <Typography variant="body2" color="text.secondary">Fecha expedición: {poliza.fechaExpedicion}</Typography>
                  <Typography variant="body2" color="text.secondary">Inicio vigencia: {poliza.fechaInicioVig}</Typography>
                  <Typography variant="body2" color="text.secondary">Fin vigencia: {poliza.fechaFinVig}</Typography>
                  <Typography variant="body2" color="text.secondary">Fecha renovación: {poliza.fechaRenovacion ?? 'No registrada'}</Typography>
                  <Button variant="contained" onClick={() => setDialogOpen(true)}>Renovar póliza</Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Historial de renovaciones</Typography>
                {historial.length ? (
                  <Paper sx={{ height: 360, borderRadius: 3, overflow: 'hidden' }}>
                    <DataGrid rows={historial} columns={historyColumns} disableRowSelectionOnClick pageSizeOptions={[5, 10]} initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }} sx={{ border: 'none' }} />
                  </Paper>
                ) : (
                  <EmptyState title="Sin historial de renovaciones" description="Esta póliza no tiene renovaciones registradas aún." />
                )}
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Registrar gestión</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Acción" select fullWidth value={accion} onChange={(e) => setAccion(e.target.value as typeof LOG_ACTIONS[number])}>
                  {LOG_ACTIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField label="Notas" multiline rows={3} fullWidth value={notas} onChange={(e) => setNotas(e.target.value)} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="contained" loading={isLogging} startIcon={<AddCircleOutlineIcon />} onClick={submit}>
                Registrar gestión
              </LoadingButton>
            </Box>
          </Paper>
        </Stack>
      ) : (
        !isLoading && (
          <EmptyState
            title="Póliza no encontrada"
            description="Verifica que el enlace sea correcto o regresa al listado de pólizas."
            action={<Button variant="contained" onClick={() => navigate('/polizas')}>Volver a pólizas</Button>}
          />
        )
      )}

      {/* History Drawer */}
      <Drawer anchor="right" open={historyDrawerOpen} onClose={closeHistoryDrawer} PaperProps={{ sx: { width: 400, display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Log de gestiones</Typography>
          <IconButton size="small" onClick={closeHistoryDrawer}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          <LogTimeline logs={logs} />
        </Box>
      </Drawer>

      <RenovarDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={(data) => { renovar(data); setDialogOpen(false); }}
        loading={isRenovating}
      />
    </Box>
  );
}
```

- [ ] **Step 4: Type-check all**

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: no new errors beyond pre-existing backend type issues (those are in backend, not frontend).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ExcelImportStepper.tsx \
        frontend/src/pages/Clients/ClientesListPage.tsx \
        frontend/src/pages/Policy/PolizaDetallePage.tsx
git commit -m "feat(ui): drag&drop import, ClientesListPage modal, PolizaDetalle history drawer"
```

---

## Final verification

- [ ] **Run frontend type check — must be clean**

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Run backend tests**

```bash
cd backend && npm test 2>&1
```

Expected: all tests pass (6 tests — 4 policy status + 2 renovation).

- [ ] **Final commit**

```bash
git add -A
git status  # review what's staged
git commit -m "feat: complete UI refactor — hooks SRP, dark mode, drawers, seed 55+ policies, Excel template"
```
