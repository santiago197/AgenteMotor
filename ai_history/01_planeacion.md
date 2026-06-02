 Actua como ingeniero senior full-stack creando un MVP listo para producción desde cero. Primero diseña toda la
arquitectura del sistema, luego construye la versión definida en @spec.md escalable. Incluye: Arquitectura del sistema,
 estructura de arhivos, Esquema de base de datos, Enpoints de apis, Arquitectura de UI, código listo para priducción
  ⎿  Read spec.md (153 lines)

● Skill(superpowers:brainstorming)
  ⎿  Successfully loaded skill

● Bash(ls -la /c/Users/santi/Desktop/DESARROLLOS/Agentemotor/ && git -C /c/Users/santi/Desktop/DESARROLLOS/Agentemotor
      log --oneline -10)
  ⎿  total 20
     drwxr-xr-x 1 Natalia 197121    0 Jun  2 11:00 .
     drwxr-xr-x 1 Natalia 197121    0 Jun  2 09:06 ..
     … +6 lines (ctrl+o to expand)

● Vamos a diseñar la arquitectura completa del sistema. Algunas partes de este proceso involucran decisiones de UI
  (layouts del dashboard, tablas, formularios). ¿Quieres que use el navegador para mostrarte mockups y wireframes
  visuales mientras definimos el diseño? Puedo generar diagramas de componentes, layouts de pantallas y comparaciones de
   opciones de UI en tiempo real.

  ▎ Requiere abrir una URL local. Es una feature experimental y puede ser intensiva en tokens.

✻ Churned for 1m 15s

> No

● El spec dice que no está claro si el sistema debe ser multi-tenant. Para el MVP, ¿cómo lo ves?

  A) Un solo asesor por deployment (más simple, cero complejidad de aislamiento de datos)

  B) Multi-tenant desde el inicio — múltiples asesores con sus propios clientes y pólizas aislados (requiere tenantId /
  asesorId en cada tabla, más lógica de auth)

  C) Un asesor por ahora, pero con la estructura de DB lista para multi-tenant cuando escale

  Mi recomendación: C — costo mínimo ahora, sin reescritura después.

> Multi-tenant desde el inicio, multiples asesores con sus propios clientes y polizas aisladas por aseguradora. En
cliente puede tomar el seguro de vida con Axa Colpatria y ese mismo cliente puede tomar el seguro de hogar con HDI y el
 seguro de Auto con Sura

● Entendido. Siguiente pregunta sobre roles y administración:

  El spec contempla roles: Asesor, Aseguradora, Administrador. Para el MVP, ¿quién crea los asesores y las aseguradoras
  en el sistema?

  A) Solo un Administrador (superusuario) los crea desde un panel admin — el asesor solo accede con credenciales que le
  da el admin

  B) Auto-registro — cualquiera puede crear su cuenta de asesor y agregar sus aseguradoras

  C) Seeding/bootstrap — los datos de aseguradoras y asesores se crean con datos mock para el MVP, sin panel de gestión
  aún

  Mi recomendación: A — es la base correcta para multi-tenant real, y es lo que el spec describe implícitamente con
  "contraseña asignada por defecto".

> Solo un administrador puede crear la cuenta desde el panel de admin. Ese mismo administrador asigna las diferentes
ramas de seguro de las aseguradoras, por ahora se deben crear datos mockeados, dejar lista la infraestructura, pero el
frontend solo para la gestión del asesor

● Perfecto. Última pregunta de clarificación antes de pasar al diseño:

  El spec menciona "Clientes a contactar URGENTE" en el dashboard. ¿El sistema debe enviar notificaciones automáticas
  (email/WhatsApp al asesor) cuando una póliza entra en estado crítico, o por ahora solo el dashboard visual es
  suficiente para que el asesor revise manualmente?

  A) Solo dashboard visual — el asesor entra y ve el estado

  B) Notificación por email al asesor cuando pólizas pasen a "Próximas a vencer" o "Vencidas críticas"

  C) Dashboard ahora, con la arquitectura preparada para agregar notificaciones después (webhook/queue ready)

> Dashboard por ahora, pero debe quedar la arquitectura preparada para notificar al asesor vía email cada X periodo de
tiempo

● Aquí las 3 opciones de arquitectura con sus trade-offs:

  ---
  Opción A — Monorepo con workspaces (RECOMENDADA)

  agentemotor/
    ├── backend/   (Express + SQLite)
    └── frontend/  (React + Vite + MUI)

  - Un solo git clone + 2 comandos para levantar todo
  - Backend y frontend totalmente separados pero en el mismo repo
  - Se puede desplegar independientemente después
  - Trade-off: requiere coordinar versiones entre packages

  ---
  Opción B — Backend sirve el frontend compilado

  agentemotor/
    └── server/   (Express sirve /dist del React)

  - Un solo proceso, un solo puerto
  - Deploy ultra-simple (1 Dockerfile)
  - Trade-off: build del frontend acoplado al backend, dev experience peor (no hot-reload simultáneo fácil)

  ---
  Opción C — Repos separados

  - Frontend en Vercel, Backend en Railway/Render
  - Máxima independencia de despliegue
  - Trade-off: 2 repos, 2 pipelines, más configuración de CORS/env — overkill para MVP

  ---
  Recomiendo A — la separación backend/frontend es correcta para el spec (distintos equipos potenciales, distinto ciclo
  de deploy), pero sin la complejidad operacional de 2 repos. Los 3 comandos del README quedan como:

  git clone <repo> && cd agentemotor
  npm run install:all
  npm run dev

  ¿Apruebas este enfoque?

> Opcion A, el proyecto debe correr localmente inicialmente

● Perfecto. Presento el diseño por secciones. Primero la estructura de archivos y arquitectura general:

  ---
  Sección 1 — Estructura del proyecto

  agentemotor/
  ├── package.json                  # workspace root
  ├── README.md
  ├── .env.example
  │
  ├── backend/
  │   ├── package.json
  │   ├── src/
  │   │   ├── index.ts              # entry point Express
  │   │   ├── config/
  │   │   │   ├── database.ts       # better-sqlite3 setup
  │   │   │   └── env.ts
  │   │   ├── middleware/
  │   │   │   ├── auth.ts           # JWT verify
  │   │   │   ├── errorHandler.ts
  │   │   │   └── rateLimiter.ts    # preparado para abuse
  │   │   ├── modules/
  │   │   │   ├── auth/             # login, refresh token
  │   │   │   ├── aseguradoras/
  │   │   │   ├── asesores/
  │   │   │   ├── clientes/         # CRUD + import excel
  │   │   │   ├── polizas/          # CRUD + estado automático
  │   │   │   ├── logs/             # seguimiento gestión
  │   │   │   └── notifications/    # servicio listo (no UI)
  │   │   ├── jobs/
  │   │   │   └── policyStatusJob.ts # cron que actualiza estados
  │   │   ├── utils/
  │   │   │   ├── policyStatus.ts   # lógica de estados por fecha
  │   │   │   ├── excelParser.ts
  │   │   │   └── excelExporter.ts
  │   │   └── db/
  │   │       ├── migrations/       # SQL ordenados 001_, 002_...
  │   │       └── seed.ts           # mock data
  │   └── tests/
  │       ├── renovation.test.ts    # caso crítico 1
  │       └── newContract.test.ts   # caso crítico 2
  │
  └── frontend/
      ├── package.json
      ├── vite.config.ts
      └── src/
          ├── main.tsx
          ├── App.tsx
          ├── api/                  # axios instances + react-query hooks
          ├── components/           # componentes MUI reutilizables
          ├── pages/
          │   ├── Login/
          │   ├── Dashboard/        # pólizas críticas
          │   ├── Clients/          # lista + detalle + crear
          │   ├── Policies/         # informe + exportar
          │   └── Policy/           # detalle + gestión + renovar
          ├── store/                # Zustand (auth state)
          └── types/                # tipos compartidos TS

  ¿Esta estructura se ve bien?

> Bien, escribe el diseño

● Bash(mkdir -p /c/Users/santi/Desktop/DESARROLLOS/Agentemotor/docs/superpowers/specs)
  ⎿  Done

● Write(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Wrote 368 lines to docs\superpowers\specs\2026-06-02-agentemotor-design.md
      1 # Agentemotor — Design Spec
      2 **Date:** 2026-06-02
      3 **Status:** Approved
      4
      5 ---
      6
      7 ## 1. Contexto y Problema
      8
      9 Un asesor comercial maneja carteras de pólizas (Auto, Hogar, Vida, Otra) para múltiples clientes en múlti
        ples aseguradoras. El flujo crítico: las pólizas de Auto pierden historial si no se renuevan dentro de lo
        s 30 días posteriores al vencimiento. Hoy el asesor usa hojas de cálculo. El sistema reemplaza eso con un
        a herramienta web enfocada en seguimiento proactivo, estado automático de pólizas y gestión de cartera.
     … +358 lines (ctrl+o to expand)

● Ahora hago la auto-revisión del spec antes de pasártelo...

  Read 1 file (ctrl+o to expand)

● Encontré dos inconsistencias a corregir:

  1. Los estados NUEVA_CONTRATACION y RENOVACION están mezclados con los estados temporales en la tabla polizas — el
  spec los separa (dashboard solo usa 5 estados temporales, pero el informe usa los 7)
  2. Los rangos exactos de días en calcularEstadoPoliza no coincidían con el spec (1-20 vs 0-19)

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 6 lines, removed 3 lines
      100    fechaInicioVig   TEXT NOT NULL,
      101    fechaFinVig      TEXT NOT NULL,
      102    fechaRenovacion  TEXT,
      103 +  -- Estado temporal (calculado por cron diario según fechas)
      104    estado           TEXT NOT NULL DEFAULT 'VIGENTE'
      105                     CHECK(estado IN (
      105 -                     'NUEVA_CONTRATACION','RENOVACION','VIGENTE',
      106 -                     'PROXIMA_VENCER','VENCIDA_RENOVABLE',
      107 -                     'VENCIDA_CRITICA','VENCIDA_PERDIDA'
      106 +                     'VIGENTE','PROXIMA_VENCER',
      107 +                     'VENCIDA_RENOVABLE','VENCIDA_CRITICA','VENCIDA_PERDIDA'
      108                     )),
      109 +  -- Origen de la vigencia actual (se establece al crear o renovar)
      110 +  tipoContratacion TEXT NOT NULL DEFAULT 'NUEVA_CONTRATACION'
      111 +                   CHECK(tipoContratacion IN ('NUEVA_CONTRATACION','RENOVACION')),
      112    notas            TEXT,
      113    createdAt        TEXT NOT NULL DEFAULT (datetime('now')),
      114    UNIQUE(aseguradoraId, numeroPoliza)

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 6 lines, removed 6 lines
      150  La función `calcularEstadoPoliza(fechaFinVig: string): PolicyStatus` calcula el estado en tiempo real:
      151
      152  ```
      153 -hoy - fechaFinVig (días):
      154 -  < -30          → VIGENTE
      155 -  -30 a -1       → PROXIMA_VENCER
      156 -  0 a 19         → VENCIDA_RENOVABLE
      157 -  20 a 29        → VENCIDA_CRITICA
      158 -  >= 30          → VENCIDA_PERDIDA
      153 +diasVencidos = hoy - fechaFinVig (positivo = ya venció):
      154 +  diasVencidos < -30      → VIGENTE          (vence en más de 30 días)
      155 +  -30 <= diasVencidos <= 0 → PROXIMA_VENCER   (vence en 1-30 días o hoy)
      156 +  1 <= diasVencidos <= 20  → VENCIDA_RENOVABLE
      157 +  21 <= diasVencidos <= 30 → VENCIDA_CRITICA
      158 +  diasVencidos > 30        → VENCIDA_PERDIDA
      159  ```
      160
      161  El cron job diario persiste el estado calculado en la columna `estado` de cada póliza y dispara el `No
           tificationService` (preparado, no implementado).

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 4 lines, removed 3 lines
      268    → RenovarDialog: ingresa nueva fechaFinVig
      269    → POST /api/polizas/:id/renovar
      270    → Backend: calcula diasVencido = hoy - fechaFinVigActual
      271 -    - diasVencido <= 30: tipo = 'RENOVACION', actualiza fechas
      272 -    - diasVencido > 30:  tipo = 'NUEVA_CONTRATACION', crea nueva póliza
      273 -  → Inserta registro en poliza_historial
      271 +    - diasVencido <= 30: tipoContratacion = 'RENOVACION'
      272 +    - diasVencido > 30:  tipoContratacion = 'NUEVA_CONTRATACION'
      273 +  → Actualiza poliza: nueva fechaInicioVig, fechaFinVig, tipoContratacion, estado recalculado
      274 +  → Inserta registro en poliza_historial (snapshots del periodo anterior)
      275    → React Query invalida /dashboard y /polizas
      276  ```
      277

● Spec revisado y corregido. Está en docs/superpowers/specs/2026-06-02-agentemotor-design.md.

  Resumen del diseño:

  - Monorepo — backend/ (Express+SQLite) + frontend/ (React+Vite+MUI), 3 comandos para correr
  - Multi-tenant por asesorId — cada asesor ve solo sus clientes; un cliente puede tener pólizas con distintas
  aseguradoras
  - 9 tablas SQLite — usuarios, aseguradoras, aseguradora_ramas, asesor_aseguradoras, clientes, polizas (con estado
  temporal + tipoContratacion), poliza_historial, logs, refresh_tokens
  - 5 estados temporales calculados por fecha + cron diario a las 6am (Colombia)
  - Admin backend listo (CRUD usuarios/aseguradoras), sin frontend en MVP
  - NotificationService preparado para email, conectado al cron, sin transporte implementado
  - 21 endpoints REST organizados por módulo
  - 4 tests críticos (renovación + estado de póliza)

  Por favor, revisa el spec completo en docs/superpowers/specs/2026-06-02-agentemotor-design.md y dime si quieres algún
  cambio antes de pasar al plan de implementación.

✻ Brewed for 2m 39s

> Ajusta las apis "/api/dashboard" y "/api/polizas"  cambiarlo a metodo POST, ya que los filtros pueden crecer mucho y
por qs afecta la escalabilidad. 5.1 Páginas y rutas: En los componentes se deben crear una carpeta de hooks y useXXX
para cada componente. Aplicar el principio de responsabilidad unica. No se deben repetir funciones, se debe tener un
hook con las funciones genericas.

  Read 1 file (ctrl+o to expand)

● Actualizo el spec con los tres cambios:

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 8 lines, removed 5 lines
      173
      174  ### Dashboard
      175  ```
      176 -GET    /api/dashboard            → resumen con conteos por estado + lista pólizas críticas
      177 -                                   query: ?estado=&tipo=&numeroPoliza=&documento=&nombre=
      176 +POST   /api/dashboard/search     → resumen con conteos por estado + lista pólizas críticas
      177 +                                   body: { estado?, tipo?, numeroPoliza?, documento?, nombre?,
      178 +                                           page?, pageSize? }
      179  ```
      180
      181  ### Clientes
     ...
      190
      191  ### Pólizas
      192  ```
      192 -GET    /api/polizas              → informe con filtros
      193 -                                   query: ?tipo=&estado=&desde=&hasta=&documento=&numeroPoliza=
      193 +POST   /api/polizas/search       → informe con filtros (body escalable)
      194 +                                   body: { tipo?, estado?, tipoContratacion?, desde?, hasta?,
      195 +                                           documento?, numeroPoliza?, aseguradoraId?,
      196 +                                           page?, pageSize? }
      197  POST   /api/polizas              → crear póliza
      198  GET    /api/polizas/:id          → detalle + historial
      199  PUT    /api/polizas/:id          → actualizar
      200  POST   /api/polizas/:id/renovar  → renovar (crea historial, determina RENOVACION vs NUEVA_CONTRATACION
           )
      201  POST   /api/polizas/:id/log      → registrar gestión
      199 -GET    /api/polizas/export       → exportar a Excel con filtros aplicados
      202 +POST   /api/polizas/export       → exportar a Excel (body con mismos filtros que /search)
      203  ```
      204
      205  ### Admin (backend listo, sin frontend)

● Ahora actualizo la arquitectura de UI con el patrón de hooks:

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 49 lines, removed 10 lines
      218
      219  ## 5. Arquitectura de UI (React + TypeScript + MUI)
      220
      221 -### 5.1 Páginas y rutas
      221 +### 5.1 Páginas, rutas y hooks por página
      222
      223 +Cada página tiene su propia carpeta con su hook de lógica. Los hooks genéricos viven en `src/hooks/` y
          + son importados por los hooks de página. **Ninguna función se duplica.**
      224 +
      225  ```
      224 -/login                          → LoginPage
      225 -/dashboard                      → DashboardPage (ruta principal)
      226 -/clientes                       → ClientesListPage
      227 -/clientes/nuevo                 → ClienteFormPage (pantalla completa, NO modal)
      228 -/clientes/:id                   → ClienteDetallePage (historial + pólizas + logs)
      229 -/polizas                        → PolizasInformePage (tabla con filtros + export)
      230 -/polizas/:id                    → PolizaDetallePage (ver + gestionar + renovar)
      226 +src/
      227 +├── hooks/                          # Hooks genéricos reutilizables
      228 +│   ├── useApiClient.ts             # instancia axios + interceptores JWT
      229 +│   ├── useFilters.ts               # estado de filtros + reset genérico
      230 +│   ├── usePagination.ts            # estado página/pageSize
      231 +│   └── useExcelExport.ts           # dispara POST /export y descarga el blob
      232 +│
      233 +└── pages/
      234 +    ├── Login/
      235 +    │   ├── LoginPage.tsx
      236 +    │   └── hooks/
      237 +    │       └── useLogin.ts         # mutation login, manejo de token Zustand
      238 +    │
      239 +    ├── Dashboard/
      240 +    │   ├── DashboardPage.tsx
      241 +    │   └── hooks/
      242 +    │       └── useDashboard.ts     # POST /dashboard/search, usa useFilters + usePagination
      243 +    │
      244 +    ├── Clients/
      245 +    │   ├── ClientesListPage.tsx
      246 +    │   ├── ClienteFormPage.tsx     # pantalla completa, NO modal
      247 +    │   ├── ClienteDetallePage.tsx
      248 +    │   └── hooks/
      249 +    │       ├── useClientes.ts      # GET /clientes lista paginada
      250 +    │       ├── useClienteDetalle.ts # GET /clientes/:id
      251 +    │       └── useClienteForm.ts   # POST/PUT cliente + validación react-hook-form
      252 +    │
      253 +    ├── Policies/
      254 +    │   ├── PolizasInformePage.tsx
      255 +    │   └── hooks/
      256 +    │       └── usePolizasInforme.ts # POST /polizas/search, usa useFilters + usePagination
      257 +    │                                # + llama useExcelExport para /polizas/export
      258 +    │
      259 +    └── Policy/
      260 +        ├── PolizaDetallePage.tsx
      261 +        └── hooks/
      262 +            ├── usePolizaDetalle.ts  # GET /polizas/:id
      263 +            ├── useRenovar.ts        # POST /polizas/:id/renovar
      264 +            └── useGestion.ts        # POST /polizas/:id/log
      265  ```
      266
      267 +**Regla de responsabilidad única:**
      268 +- Un hook = un recurso o una acción. `usePolizaDetalle` solo lee. `useRenovar` solo muta.
      269 +- Los componentes no llaman `axios` directamente — siempre a través de un hook.
      270 +- `useFilters` y `usePagination` son los únicos que manejan ese estado; nunca se reimplementan por pág
          +ina.
      271 +
      272  ### 5.2 Componentes clave
      273
      274  | Componente | Propósito |
      275  |---|---|
      276  | `PolicyStatusChip` | Chip MUI con color por estado de póliza |
      277  | `DashboardCard` | Tarjeta de conteo clickeable por estado |
      239 -| `PolicyTable` | DataGrid MUI con filtros, sort y paginación |
      278 +| `PolicyTable` | DataGrid MUI con sort y paginación — recibe datos como prop |
      279  | `ClienteForm` | Formulario completo de cliente (no modal) |
      280  | `PolizaForm` | Formulario de póliza con aseguradora/tipo |
      281  | `RenovarDialog` | Modal para ingresar nueva fecha de fin de vigencia |
      282  | `LogTimeline` | Timeline MUI de gestiones registradas |
      283  | `ExcelImportStepper` | Stepper: subir → validar → confirmar migración |
      245 -| `FilterBar` | Barra de filtros reutilizable |
      284 +| `FilterBar` | Barra de filtros reutilizable — acepta `fields` como configuración |
      285
      286  ### 5.3 Estado global
      287

● También actualizo la estructura de archivos del monorepo para que refleje los cambios:

  Searched for 1 pattern, read 1 file (ctrl+o to expand)

● El spec está actualizado. Los cambios aplicados:

  APIs modificadas:
  - GET /api/dashboard → POST /api/dashboard/search — filtros en body
  - GET /api/polizas → POST /api/polizas/search — filtros en body (tipo, estado, tipoContratacion, fechas, doc, número,
  aseguradora, paginación)
  - GET /api/polizas/export → POST /api/polizas/export — mismos filtros que /search en body

  Arquitectura de hooks (SRP):
  - src/hooks/ — 4 hooks genéricos compartidos: useApiClient, useFilters, usePagination, useExcelExport
  - Cada página tiene su carpeta hooks/ con hooks específicos de 1 sola responsabilidad
  - Ningún componente llama axios directamente, ninguna función de filtros/paginación se repite

  Spec en docs/superpowers/specs/2026-06-02-agentemotor-design.md. Revísalo y dime si quieres ajustar algo más antes de
  pasar al plan de implementación.

✻ Cooked for 1m 11s

> Sí, procede con el plan de implementación

● Skill(superpowers:writing-plans)
  ⎿  Successfully loaded skill

● Using the writing-plans skill to create the implementation plan.

  Este proyecto tiene dos subsistemas independientes (backend y frontend). Crearé un plan único con dos fases claramente
   separadas — cada fase produce software funcional y testeable por sí sola.

● Bash(mkdir -p /c/Users/santi/Desktop/DESARROLLOS/Agentemotor/docs/superpowers/plans)
  ⎿  Done

  /btw ¿Que te falta por escribir?

    - calcularEstadoPoliza utility + tests (TDD)
    - Módulo Clientes (CRUD)
    - Módulo Pólizas (search POST, crear, renovar, log)
    - Módulo Dashboard (POST /search)
    - Módulo Admin (rutas protegidas, sin frontend)
    - Excel import/export + cron job + NotificationService stub
    - Tests críticos de renovación

    Fase Frontend (tareas 14-21)
    - Setup Vite + React + MUI + React Query + Zustand
    - Tipos compartidos + tema MUI + axios client
    - Auth store (Zustand) + 4 hooks genéricos compartidos
    - Componentes reutilizables (PolicyStatusChip, FilterBar, PolicyTable, etc.)
    - Login page
    - Dashboard page
    - Páginas de Clientes (lista, formulario pantalla completa, detalle)
    - Páginas de Pólizas (informe, detalle, renovar, gestión) + ExcelImportStepper

    Cada tarea tiene archivos exactos, código completo sin placeholders, comandos para verificar y paso de commit.

  ↑/↓ to scroll · Space, Enter, or Escape to dismiss

● How is Claude doing this session? (optional)
  1: Bad    2: Fine   3: Good   0: Dismiss

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
> 
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle) · esc to interrupt · ctrl+t to hide tasks
╭─── Claude Code v2.1.88 ──────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                    │ Tips for getting started                                        │
│               Welcome back Santiago!               │ Run /init to create a CLAUDE.md file with instructions for Cla… │
│                                                    │ ─────────────────────────────────────────────────────────────── │
│                       ▐▛███▜▌                      │ Recent activity                                                 │
│                      ▝▜█████▛▘                     │ No recent activity                                              │
│                        ▘▘ ▝▝                       │                                                                 │
│   Sonnet 4.6 · Claude Pro ·                        │                                                                 │
│   santiagor.rodriguez19@gmail.com's Organization   │                                                                 │
│         ~\Desktop\DESARROLLOS\Agentemotor          │                                                                 │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

> Actua como ingeniero senior full-stack creando un MVP listo para producción desde cero. Primero diseña toda la
arquitectura del sistema, luego construye la versión definida en @spec.md escalable. Incluye: Arquitectura del sistema,
 estructura de arhivos, Esquema de base de datos, Enpoints de apis, Arquitectura de UI, código listo para priducción
  ⎿  Read spec.md (153 lines)

● Skill(superpowers:brainstorming)
  ⎿  Successfully loaded skill

● Bash(ls -la /c/Users/santi/Desktop/DESARROLLOS/Agentemotor/ && git -C /c/Users/santi/Desktop/DESARROLLOS/Agentemotor
      log --oneline -10)
  ⎿  total 20
     drwxr-xr-x 1 Natalia 197121    0 Jun  2 11:00 .
     drwxr-xr-x 1 Natalia 197121    0 Jun  2 09:06 ..
     … +6 lines (ctrl+o to expand)

● Vamos a diseñar la arquitectura completa del sistema. Algunas partes de este proceso involucran decisiones de UI
  (layouts del dashboard, tablas, formularios). ¿Quieres que use el navegador para mostrarte mockups y wireframes
  visuales mientras definimos el diseño? Puedo generar diagramas de componentes, layouts de pantallas y comparaciones de
   opciones de UI en tiempo real.

  ▎ Requiere abrir una URL local. Es una feature experimental y puede ser intensiva en tokens.

✻ Churned for 1m 15s

> No

● El spec dice que no está claro si el sistema debe ser multi-tenant. Para el MVP, ¿cómo lo ves?

  A) Un solo asesor por deployment (más simple, cero complejidad de aislamiento de datos)

  B) Multi-tenant desde el inicio — múltiples asesores con sus propios clientes y pólizas aislados (requiere tenantId /
  asesorId en cada tabla, más lógica de auth)

  C) Un asesor por ahora, pero con la estructura de DB lista para multi-tenant cuando escale

  Mi recomendación: C — costo mínimo ahora, sin reescritura después.

> Multi-tenant desde el inicio, multiples asesores con sus propios clientes y polizas aisladas por aseguradora. En
cliente puede tomar el seguro de vida con Axa Colpatria y ese mismo cliente puede tomar el seguro de hogar con HDI y el
 seguro de Auto con Sura

● Entendido. Siguiente pregunta sobre roles y administración:

  El spec contempla roles: Asesor, Aseguradora, Administrador. Para el MVP, ¿quién crea los asesores y las aseguradoras
  en el sistema?

  A) Solo un Administrador (superusuario) los crea desde un panel admin — el asesor solo accede con credenciales que le
  da el admin

  B) Auto-registro — cualquiera puede crear su cuenta de asesor y agregar sus aseguradoras

  C) Seeding/bootstrap — los datos de aseguradoras y asesores se crean con datos mock para el MVP, sin panel de gestión
  aún

  Mi recomendación: A — es la base correcta para multi-tenant real, y es lo que el spec describe implícitamente con
  "contraseña asignada por defecto".

> Solo un administrador puede crear la cuenta desde el panel de admin. Ese mismo administrador asigna las diferentes
ramas de seguro de las aseguradoras, por ahora se deben crear datos mockeados, dejar lista la infraestructura, pero el
frontend solo para la gestión del asesor

● Perfecto. Última pregunta de clarificación antes de pasar al diseño:

  El spec menciona "Clientes a contactar URGENTE" en el dashboard. ¿El sistema debe enviar notificaciones automáticas
  (email/WhatsApp al asesor) cuando una póliza entra en estado crítico, o por ahora solo el dashboard visual es
  suficiente para que el asesor revise manualmente?

  A) Solo dashboard visual — el asesor entra y ve el estado

  B) Notificación por email al asesor cuando pólizas pasen a "Próximas a vencer" o "Vencidas críticas"

  C) Dashboard ahora, con la arquitectura preparada para agregar notificaciones después (webhook/queue ready)

> Dashboard por ahora, pero debe quedar la arquitectura preparada para notificar al asesor vía email cada X periodo de
tiempo

● Aquí las 3 opciones de arquitectura con sus trade-offs:

  ---
  Opción A — Monorepo con workspaces (RECOMENDADA)

  agentemotor/
    ├── backend/   (Express + SQLite)
    └── frontend/  (React + Vite + MUI)

  - Un solo git clone + 2 comandos para levantar todo
  - Backend y frontend totalmente separados pero en el mismo repo
  - Se puede desplegar independientemente después
  - Trade-off: requiere coordinar versiones entre packages

  ---
  Opción B — Backend sirve el frontend compilado

  agentemotor/
    └── server/   (Express sirve /dist del React)

  - Un solo proceso, un solo puerto
  - Deploy ultra-simple (1 Dockerfile)
  - Trade-off: build del frontend acoplado al backend, dev experience peor (no hot-reload simultáneo fácil)

  ---
  Opción C — Repos separados

  - Frontend en Vercel, Backend en Railway/Render
  - Máxima independencia de despliegue
  - Trade-off: 2 repos, 2 pipelines, más configuración de CORS/env — overkill para MVP

  ---
  Recomiendo A — la separación backend/frontend es correcta para el spec (distintos equipos potenciales, distinto ciclo
  de deploy), pero sin la complejidad operacional de 2 repos. Los 3 comandos del README quedan como:

  git clone <repo> && cd agentemotor
  npm run install:all
  npm run dev

  ¿Apruebas este enfoque?

> Opcion A, el proyecto debe correr localmente inicialmente

● Perfecto. Presento el diseño por secciones. Primero la estructura de archivos y arquitectura general:

  ---
  Sección 1 — Estructura del proyecto

  agentemotor/
  ├── package.json                  # workspace root
  ├── README.md
  ├── .env.example
  │
  ├── backend/
  │   ├── package.json
  │   ├── src/
  │   │   ├── index.ts              # entry point Express
  │   │   ├── config/
  │   │   │   ├── database.ts       # better-sqlite3 setup
  │   │   │   └── env.ts
  │   │   ├── middleware/
  │   │   │   ├── auth.ts           # JWT verify
  │   │   │   ├── errorHandler.ts
  │   │   │   └── rateLimiter.ts    # preparado para abuse
  │   │   ├── modules/
  │   │   │   ├── auth/             # login, refresh token
  │   │   │   ├── aseguradoras/
  │   │   │   ├── asesores/
  │   │   │   ├── clientes/         # CRUD + import excel
  │   │   │   ├── polizas/          # CRUD + estado automático
  │   │   │   ├── logs/             # seguimiento gestión
  │   │   │   └── notifications/    # servicio listo (no UI)
  │   │   ├── jobs/
  │   │   │   └── policyStatusJob.ts # cron que actualiza estados
  │   │   ├── utils/
  │   │   │   ├── policyStatus.ts   # lógica de estados por fecha
  │   │   │   ├── excelParser.ts
  │   │   │   └── excelExporter.ts
  │   │   └── db/
  │   │       ├── migrations/       # SQL ordenados 001_, 002_...
  │   │       └── seed.ts           # mock data
  │   └── tests/
  │       ├── renovation.test.ts    # caso crítico 1
  │       └── newContract.test.ts   # caso crítico 2
  │
  └── frontend/
      ├── package.json
      ├── vite.config.ts
      └── src/
          ├── main.tsx
          ├── App.tsx
          ├── api/                  # axios instances + react-query hooks
          ├── components/           # componentes MUI reutilizables
          ├── pages/
          │   ├── Login/
          │   ├── Dashboard/        # pólizas críticas
          │   ├── Clients/          # lista + detalle + crear
          │   ├── Policies/         # informe + exportar
          │   └── Policy/           # detalle + gestión + renovar
          ├── store/                # Zustand (auth state)
          └── types/                # tipos compartidos TS

  ¿Esta estructura se ve bien?

> Bien, escribe el diseño

● Bash(mkdir -p /c/Users/santi/Desktop/DESARROLLOS/Agentemotor/docs/superpowers/specs)
  ⎿  Done

● Write(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Wrote 368 lines to docs\superpowers\specs\2026-06-02-agentemotor-design.md
      1 # Agentemotor — Design Spec
      2 **Date:** 2026-06-02
      3 **Status:** Approved
      4
      5 ---
      6
      7 ## 1. Contexto y Problema
      8
      9 Un asesor comercial maneja carteras de pólizas (Auto, Hogar, Vida, Otra) para múltiples clientes en múlti
        ples aseguradoras. El flujo crítico: las pólizas de Auto pierden historial si no se renuevan dentro de lo
        s 30 días posteriores al vencimiento. Hoy el asesor usa hojas de cálculo. El sistema reemplaza eso con un
        a herramienta web enfocada en seguimiento proactivo, estado automático de pólizas y gestión de cartera.
     … +358 lines (ctrl+o to expand)

● Ahora hago la auto-revisión del spec antes de pasártelo...

  Read 1 file (ctrl+o to expand)

● Encontré dos inconsistencias a corregir:

  1. Los estados NUEVA_CONTRATACION y RENOVACION están mezclados con los estados temporales en la tabla polizas — el
  spec los separa (dashboard solo usa 5 estados temporales, pero el informe usa los 7)
  2. Los rangos exactos de días en calcularEstadoPoliza no coincidían con el spec (1-20 vs 0-19)

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 6 lines, removed 3 lines
      100    fechaInicioVig   TEXT NOT NULL,
      101    fechaFinVig      TEXT NOT NULL,
      102    fechaRenovacion  TEXT,
      103 +  -- Estado temporal (calculado por cron diario según fechas)
      104    estado           TEXT NOT NULL DEFAULT 'VIGENTE'
      105                     CHECK(estado IN (
      105 -                     'NUEVA_CONTRATACION','RENOVACION','VIGENTE',
      106 -                     'PROXIMA_VENCER','VENCIDA_RENOVABLE',
      107 -                     'VENCIDA_CRITICA','VENCIDA_PERDIDA'
      106 +                     'VIGENTE','PROXIMA_VENCER',
      107 +                     'VENCIDA_RENOVABLE','VENCIDA_CRITICA','VENCIDA_PERDIDA'
      108                     )),
      109 +  -- Origen de la vigencia actual (se establece al crear o renovar)
      110 +  tipoContratacion TEXT NOT NULL DEFAULT 'NUEVA_CONTRATACION'
      111 +                   CHECK(tipoContratacion IN ('NUEVA_CONTRATACION','RENOVACION')),
      112    notas            TEXT,
      113    createdAt        TEXT NOT NULL DEFAULT (datetime('now')),
      114    UNIQUE(aseguradoraId, numeroPoliza)

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 6 lines, removed 6 lines
      150  La función `calcularEstadoPoliza(fechaFinVig: string): PolicyStatus` calcula el estado en tiempo real:
      151
      152  ```
      153 -hoy - fechaFinVig (días):
      154 -  < -30          → VIGENTE
      155 -  -30 a -1       → PROXIMA_VENCER
      156 -  0 a 19         → VENCIDA_RENOVABLE
      157 -  20 a 29        → VENCIDA_CRITICA
      158 -  >= 30          → VENCIDA_PERDIDA
      153 +diasVencidos = hoy - fechaFinVig (positivo = ya venció):
      154 +  diasVencidos < -30      → VIGENTE          (vence en más de 30 días)
      155 +  -30 <= diasVencidos <= 0 → PROXIMA_VENCER   (vence en 1-30 días o hoy)
      156 +  1 <= diasVencidos <= 20  → VENCIDA_RENOVABLE
      157 +  21 <= diasVencidos <= 30 → VENCIDA_CRITICA
      158 +  diasVencidos > 30        → VENCIDA_PERDIDA
      159  ```
      160
      161  El cron job diario persiste el estado calculado en la columna `estado` de cada póliza y dispara el `No
           tificationService` (preparado, no implementado).

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 4 lines, removed 3 lines
      268    → RenovarDialog: ingresa nueva fechaFinVig
      269    → POST /api/polizas/:id/renovar
      270    → Backend: calcula diasVencido = hoy - fechaFinVigActual
      271 -    - diasVencido <= 30: tipo = 'RENOVACION', actualiza fechas
      272 -    - diasVencido > 30:  tipo = 'NUEVA_CONTRATACION', crea nueva póliza
      273 -  → Inserta registro en poliza_historial
      271 +    - diasVencido <= 30: tipoContratacion = 'RENOVACION'
      272 +    - diasVencido > 30:  tipoContratacion = 'NUEVA_CONTRATACION'
      273 +  → Actualiza poliza: nueva fechaInicioVig, fechaFinVig, tipoContratacion, estado recalculado
      274 +  → Inserta registro en poliza_historial (snapshots del periodo anterior)
      275    → React Query invalida /dashboard y /polizas
      276  ```
      277

● Spec revisado y corregido. Está en docs/superpowers/specs/2026-06-02-agentemotor-design.md.

  Resumen del diseño:

  - Monorepo — backend/ (Express+SQLite) + frontend/ (React+Vite+MUI), 3 comandos para correr
  - Multi-tenant por asesorId — cada asesor ve solo sus clientes; un cliente puede tener pólizas con distintas
  aseguradoras
  - 9 tablas SQLite — usuarios, aseguradoras, aseguradora_ramas, asesor_aseguradoras, clientes, polizas (con estado
  temporal + tipoContratacion), poliza_historial, logs, refresh_tokens
  - 5 estados temporales calculados por fecha + cron diario a las 6am (Colombia)
  - Admin backend listo (CRUD usuarios/aseguradoras), sin frontend en MVP
  - NotificationService preparado para email, conectado al cron, sin transporte implementado
  - 21 endpoints REST organizados por módulo
  - 4 tests críticos (renovación + estado de póliza)

  Por favor, revisa el spec completo en docs/superpowers/specs/2026-06-02-agentemotor-design.md y dime si quieres algún
  cambio antes de pasar al plan de implementación.

✻ Brewed for 2m 39s

> Ajusta las apis "/api/dashboard" y "/api/polizas"  cambiarlo a metodo POST, ya que los filtros pueden crecer mucho y
por qs afecta la escalabilidad. 5.1 Páginas y rutas: En los componentes se deben crear una carpeta de hooks y useXXX
para cada componente. Aplicar el principio de responsabilidad unica. No se deben repetir funciones, se debe tener un
hook con las funciones genericas.

  Read 1 file (ctrl+o to expand)

● Actualizo el spec con los tres cambios:

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 8 lines, removed 5 lines
      173
      174  ### Dashboard
      175  ```
      176 -GET    /api/dashboard            → resumen con conteos por estado + lista pólizas críticas
      177 -                                   query: ?estado=&tipo=&numeroPoliza=&documento=&nombre=
      176 +POST   /api/dashboard/search     → resumen con conteos por estado + lista pólizas críticas
      177 +                                   body: { estado?, tipo?, numeroPoliza?, documento?, nombre?,
      178 +                                           page?, pageSize? }
      179  ```
      180
      181  ### Clientes
     ...
      190
      191  ### Pólizas
      192  ```
      192 -GET    /api/polizas              → informe con filtros
      193 -                                   query: ?tipo=&estado=&desde=&hasta=&documento=&numeroPoliza=
      193 +POST   /api/polizas/search       → informe con filtros (body escalable)
      194 +                                   body: { tipo?, estado?, tipoContratacion?, desde?, hasta?,
      195 +                                           documento?, numeroPoliza?, aseguradoraId?,
      196 +                                           page?, pageSize? }
      197  POST   /api/polizas              → crear póliza
      198  GET    /api/polizas/:id          → detalle + historial
      199  PUT    /api/polizas/:id          → actualizar
      200  POST   /api/polizas/:id/renovar  → renovar (crea historial, determina RENOVACION vs NUEVA_CONTRATACION
           )
      201  POST   /api/polizas/:id/log      → registrar gestión
      199 -GET    /api/polizas/export       → exportar a Excel con filtros aplicados
      202 +POST   /api/polizas/export       → exportar a Excel (body con mismos filtros que /search)
      203  ```
      204
      205  ### Admin (backend listo, sin frontend)

● Ahora actualizo la arquitectura de UI con el patrón de hooks:

● Update(docs\superpowers\specs\2026-06-02-agentemotor-design.md)
  ⎿  Added 49 lines, removed 10 lines
      218
      219  ## 5. Arquitectura de UI (React + TypeScript + MUI)
      220
      221 -### 5.1 Páginas y rutas
      221 +### 5.1 Páginas, rutas y hooks por página
      222
      223 +Cada página tiene su propia carpeta con su hook de lógica. Los hooks genéricos viven en `src/hooks/` y
          + son importados por los hooks de página. **Ninguna función se duplica.**
      224 +
      225  ```
      224 -/login                          → LoginPage
      225 -/dashboard                      → DashboardPage (ruta principal)
      226 -/clientes                       → ClientesListPage
      227 -/clientes/nuevo                 → ClienteFormPage (pantalla completa, NO modal)
      228 -/clientes/:id                   → ClienteDetallePage (historial + pólizas + logs)
      229 -/polizas                        → PolizasInformePage (tabla con filtros + export)
      230 -/polizas/:id                    → PolizaDetallePage (ver + gestionar + renovar)
      226 +src/
      227 +├── hooks/                          # Hooks genéricos reutilizables
      228 +│   ├── useApiClient.ts             # instancia axios + interceptores JWT
      229 +│   ├── useFilters.ts               # estado de filtros + reset genérico
      230 +│   ├── usePagination.ts            # estado página/pageSize
      231 +│   └── useExcelExport.ts           # dispara POST /export y descarga el blob
      232 +│
      233 +└── pages/
      234 +    ├── Login/
      235 +    │   ├── LoginPage.tsx
      236 +    │   └── hooks/
      237 +    │       └── useLogin.ts         # mutation login, manejo de token Zustand
      238 +    │
      239 +    ├── Dashboard/
      240 +    │   ├── DashboardPage.tsx
      241 +    │   └── hooks/
      242 +    │       └── useDashboard.ts     # POST /dashboard/search, usa useFilters + usePagination
      243 +    │
      244 +    ├── Clients/
      245 +    │   ├── ClientesListPage.tsx
      246 +    │   ├── ClienteFormPage.tsx     # pantalla completa, NO modal
      247 +    │   ├── ClienteDetallePage.tsx
      248 +    │   └── hooks/
      249 +    │       ├── useClientes.ts      # GET /clientes lista paginada
      250 +    │       ├── useClienteDetalle.ts # GET /clientes/:id
      251 +    │       └── useClienteForm.ts   # POST/PUT cliente + validación react-hook-form
      252 +    │
      253 +    ├── Policies/
      254 +    │   ├── PolizasInformePage.tsx
      255 +    │   └── hooks/
      256 +    │       └── usePolizasInforme.ts # POST /polizas/search, usa useFilters + usePagination
      257 +    │                                # + llama useExcelExport para /polizas/export
      258 +    │
      259 +    └── Policy/
      260 +        ├── PolizaDetallePage.tsx
      261 +        └── hooks/
      262 +            ├── usePolizaDetalle.ts  # GET /polizas/:id
      263 +            ├── useRenovar.ts        # POST /polizas/:id/renovar
      264 +            └── useGestion.ts        # POST /polizas/:id/log
      265  ```
      266
      267 +**Regla de responsabilidad única:**
      268 +- Un hook = un recurso o una acción. `usePolizaDetalle` solo lee. `useRenovar` solo muta.
      269 +- Los componentes no llaman `axios` directamente — siempre a través de un hook.
      270 +- `useFilters` y `usePagination` son los únicos que manejan ese estado; nunca se reimplementan por pág
          +ina.
      271 +
      272  ### 5.2 Componentes clave
      273
      274  | Componente | Propósito |
      275  |---|---|
      276  | `PolicyStatusChip` | Chip MUI con color por estado de póliza |
      277  | `DashboardCard` | Tarjeta de conteo clickeable por estado |
      239 -| `PolicyTable` | DataGrid MUI con filtros, sort y paginación |
      278 +| `PolicyTable` | DataGrid MUI con sort y paginación — recibe datos como prop |
      279  | `ClienteForm` | Formulario completo de cliente (no modal) |
      280  | `PolizaForm` | Formulario de póliza con aseguradora/tipo |
      281  | `RenovarDialog` | Modal para ingresar nueva fecha de fin de vigencia |
      282  | `LogTimeline` | Timeline MUI de gestiones registradas |
      283  | `ExcelImportStepper` | Stepper: subir → validar → confirmar migración |
      245 -| `FilterBar` | Barra de filtros reutilizable |
      284 +| `FilterBar` | Barra de filtros reutilizable — acepta `fields` como configuración |
      285
      286  ### 5.3 Estado global
      287

● También actualizo la estructura de archivos del monorepo para que refleje los cambios:

  Searched for 1 pattern, read 1 file (ctrl+o to expand)

● El spec está actualizado. Los cambios aplicados:

  APIs modificadas:
  - GET /api/dashboard → POST /api/dashboard/search — filtros en body
  - GET /api/polizas → POST /api/polizas/search — filtros en body (tipo, estado, tipoContratacion, fechas, doc, número,
  aseguradora, paginación)
  - GET /api/polizas/export → POST /api/polizas/export — mismos filtros que /search en body

  Arquitectura de hooks (SRP):
  - src/hooks/ — 4 hooks genéricos compartidos: useApiClient, useFilters, usePagination, useExcelExport
  - Cada página tiene su carpeta hooks/ con hooks específicos de 1 sola responsabilidad
  - Ningún componente llama axios directamente, ninguna función de filtros/paginación se repite

  Spec en docs/superpowers/specs/2026-06-02-agentemotor-design.md. Revísalo y dime si quieres ajustar algo más antes de
  pasar al plan de implementación.

✻ Cooked for 1m 11s

> Sí, procede con el plan de implementación

● Skill(superpowers:writing-plans)
  ⎿  Successfully loaded skill

● Using the writing-plans skill to create the implementation plan.

  Este proyecto tiene dos subsistemas independientes (backend y frontend). Crearé un plan único con dos fases claramente
   separadas — cada fase produce software funcional y testeable por sí sola.

● Bash(mkdir -p /c/Users/santi/Desktop/DESARROLLOS/Agentemotor/docs/superpowers/plans)
  ⎿  Done

  /btw escribe en el md lo qye tengas hasta el moment