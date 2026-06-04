 escribe un archivo seed para migrar todos los datos

  Searched for 1 pattern, read 4 files (ctrl+o to expand)

● Voy a crear backend/src/scripts/reseed.ts — un script que limpia la DB y re-siembra todos los datos:

● Write(backend\src\scripts\reseed.ts)
  ⎿  Wrote 36 lines to backend\src\scripts\reseed.ts
      1 /**
      2  * reseed.ts — Limpia todas las tablas y re-siembra la base de datos.
      3  * Uso: npm run reseed
      4  */
      5 import Database from 'better-sqlite3';
      6 import { config } from '../config.js';
      7 import { seedDatabase } from '../services/seed.js';
      8
      9 const db = new Database(config.databaseFile);
     … +26 lines (ctrl+o to expand)

● Update(backend\package.json)
  ⎿  Added 2 lines, removed 1 line
       7      "dev": "cross-env NODE_ENV=development tsx watch src/server.ts",
       8      "build": "tsc",
       9      "start": "node dist/server.js",
      10 -    "test": "vitest run"
      10 +    "test": "vitest run",
      11 +    "reseed": "tsx src/scripts/reseed.ts"
      12    },
      13    "dependencies": {
      14      "bcryptjs": "^2.4.3",

● Bash(cd "C:\Users\santi\Desktop\DESARROLLOS\Agentemotor" && git add backend/src/scripts/reseed.ts backend/package.json
       && git commit -m "feat(backend): add reseed sc…)
  ⎿  warning: in the working copy of 'backend/src/scripts/reseed.ts', LF will be replaced by CRLF the next time Git
      touches it
     [main 795b7f5] feat(backend): add reseed script to wipe and re-seed database
     … +2 lines (ctrl+o to expand)

● Listo. Para usarlo:

  # Desde la carpeta backend/
  npm run reseed

  El script:
  1. Deshabilita FK temporalmente
  2. Borra todas las tablas en orden seguro (hijos → padres)
  3. Resetea los autoincrement de SQLite (sqlite_sequence)
  4. Re-ejecuta seedDatabase → 10 clientes, 55 pólizas, 3 aseguradoras, 2 usuarios
  5. Reactiva FK y cierra la conexión

  Credenciales después del reseed:
  - andrea@agentemotor.com / Asesor123!
  - admin@agentemotor.com / Admin123!

✻ Cogitated for 44s

> Ajusta el header, en la sección donde está el boton de cerrar sesión, el contenido está quedando detras, el header
sobrepuesto, debería ocupar su propio espacio

  Read 1 file (ctrl+o to expand)

● El problema es que el AppBar con position="fixed" se saca del flujo del documento. La solución estándar de MUI es
  agregar un <Toolbar /> como spacer. También el sidebar necesita compensar la altura del AppBar.

● Update(frontend\src\components\layout\AppLayout.tsx)
  ⎿  Added 1 line, removed 1 line
      168    );
      169
      170    return (
      171 -    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      171 +    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      172        {/* App Bar — always visible */}
      173        <AppBar
      174          position="fixed"

● Update(frontend\src\components\layout\AppLayout.tsx)
  ⎿  Added 4 lines
      202          </Toolbar>
      203        </AppBar>
      204
      205 +      {/* Spacer — same height as AppBar Toolbar, pushes content below the fixed AppBar */}
      206 +      <Toolbar />
      207 +
      208 +      <Box sx={{ display: 'flex', flex: 1 }}>
      209        {/* Sidebar */}
      210        <Drawer
      211          variant={isMobile ? 'temporary' : 'permanent'}

● Update(frontend\src\components\layout\AppLayout.tsx)
  ⎿  Added 1 line, removed 1 line
      232          sx={{
      233            flexGrow: 1,
      234            p: { xs: 2, sm: 3, md: 4 },
      235 -          mt: 8,
      235            maxWidth: '100%',
      236            overflow: 'auto',
      237          }}
      238        >
      239          <Outlet />
      240        </Box>
      241 +      </Box>
      242      </Box>
      243    );
      244  }

● Ahora el sidebar también necesita saber que empieza después del AppBar. En permanent mode el Drawer es position: fixed
   así que le agrego el offset en el paper:

● Update(frontend\src\components\layout\AppLayout.tsx)
  ⎿  Added 1 line
      220              boxSizing: 'border-box',
      221              borderRight: '1px solid rgba(148, 163, 184, 0.06)',
      222              background: 'linear-gradient(180deg, #0F1629 0%, #111827 100%)',
      223 +            top: 'auto',
      224            },
      225          }}
      226        >

● Bash(cd "C:\Users\santi\Desktop\DESARROLLOS\Agentemotor" && git add frontend/src/components/layout/AppLayout.tsx &&
      git commit -m "fix(layout): AppBar spacer prevent…)
  ⎿  warning: in the working copy of 'frontend/src/components/layout/AppLayout.tsx', LF will be replaced by CRLF th
     e next time Git touches it
     [main f9059c5] fix(layout): AppBar spacer prevents content from hiding behind fixed header
      1 file changed, 7 insertions(+), 2 deletions(-)

● El fix consiste en tres cambios:

  1. Contenedor raíz → flexDirection: 'column' para apilar AppBar → spacer → fila (sidebar + main)
  2. <Toolbar /> spacer — componente vacío con la misma altura del AppBar que ocupa su espacio en el flujo normal del
  documento
  3. top: 'auto' en el paper del Drawer permanent — para que el sidebar respete la posición del spacer en vez de fijarse
   desde top: 0
  4. Eliminado mt: 8 del main — ya no es necesario porque el spacer hace ese trabajo de forma dinámica (se adapta a la
  altura real del AppBar en mobile/desktop)

✻ Brewed for 1m 6s

> En el dasboard, agrega una columna para identificar hace cuantos días se vencio la poliza. Ajusta el toobal de
filtros, no deben quedar horizontal, deben visualizar verticalmente

  Searched for 2 patterns, read 3 files (ctrl+o to expand)

● Dos cambios claros: columna de días en PolicyTable y layout vertical en FilterBar.

● Update(frontend\src\components\PolicyTable.tsx)
  ⎿  Added 34 lines
       73            value ? dayjs(value as string).format('DD/MM/YYYY') : '—',
       74        },
       75        {
       76 +        field: '_diasVencida',
       77 +        headerName: 'Días',
       78 +        width: 110,
       79 +        sortable: false,
       80 +        valueGetter: (_value, row) => {
       81 +          if (!row.fechaFinVig) return null;
       82 +          return dayjs().startOf('day').diff(dayjs(row.fechaFinVig as string).startOf('day'), 'day');
       83 +        },
       84 +        renderCell: (params) => {
       85 +          const dias = params.value as number | null;
       86 +          if (dias === null) return '—';
       87 +          if (dias > 0) {
       88 +            const color = dias > 20 ? 'error' : 'warning';
       89 +            return (
       90 +              <Box sx={{ color: `${color}.main`, fontWeight: 600, fontSize: '0.82rem' }}>
       91 +                +{dias}d vencida
       92 +              </Box>
       93 +            );
       94 +          }
       95 +          if (dias < 0) {
       96 +            return (
       97 +              <Box sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.82rem' }}>
       98 +                {Math.abs(dias)}d restantes
       99 +              </Box>
      100 +            );
      101 +          }
      102 +          return (
      103 +            <Box sx={{ color: 'warning.main', fontWeight: 600, fontSize: '0.82rem' }}>
      104 +              Vence hoy
      105 +            </Box>
      106 +          );
      107 +        },
      108 +      },
      109 +      {
      110          field: 'fechaInicioVig',
      111          headerName: 'Inicio Vigencia',
      112          width: 130,

● Ahora los filtros verticales en FilterBar:

● Update(frontend\src\components\FilterBar.tsx)
  ⎿  Added 2 lines, removed 12 lines
      26      <Box
      27        sx={{
      28          display: 'flex',
      29 -        flexWrap: 'wrap',
      29 +        flexDirection: 'column',
      30          gap: 2,
      31 -        alignItems: 'center',
      32 -        p: 2.5,
      33 -        borderRadius: 3,
      34 -        backgroundColor: 'rgba(17, 24, 39, 0.6)',
      35 -        border: '1px solid rgba(148, 163, 184, 0.08)',
      36 -        backdropFilter: 'blur(8px)',
      31        }}
      32      >
      39 -      <Badge badgeContent={activeCount} color="primary" sx={{ mr: 1 }}>
      40 -        <FilterListIcon sx={{ color: 'text.secondary' }} />
      41 -      </Badge>
      42 -
      33        {fields.map((field) => {
      34          if (field.type === 'select') {
      35            return (
     ...
      40                value={(values[field.name] as string) ?? ''}
      41                onChange={(e) => onChange(field.name as keyof T as keyof T, e.target.value || undefined)}
      42                size="small"
      53 -              sx={{ minWidth: 160 }}
      43 +              fullWidth
      44              >
      45                <MenuItem value="">
      46                  <em>Todos</em>

● Update(frontend\src\components\FilterBar.tsx)
  ⎿  Added 2 lines, removed 14 lines
      63                value={(values[field.name] as string) ?? ''}
      64                onChange={(e) => onChange(field.name as keyof T, e.target.value || undefined)}
      65                size="small"
      66 +              fullWidth
      67                slotProps={{ inputLabel: { shrink: true } }}
      67 -              sx={{ minWidth: 160 }}
      68              />
      69            );
      70          }
     ...
      77              value={(values[field.name] as string) ?? ''}
      78              onChange={(e) => onChange(field.name, e.target.value || undefined)}
      79              size="small"
      80 -            sx={{ minWidth: 160 }}
      80 +            fullWidth
      81            />
      82          );
      83        })}
      84 -
      85 -      {activeCount > 0 && (
      86 -        <Button
      87 -          variant="outlined"
      88 -          size="small"
      89 -          startIcon={<RestartAltIcon />}
      90 -          onClick={onReset}
      91 -          sx={{ ml: 'auto' }}
      92 -        >
      93 -          Limpiar
      94 -        </Button>
      95 -      )}
      84      </Box>
      85    );
      86  }

● El badge y el botón "Limpiar" ahora los maneja el FilterDrawer (tiene sus propios botones "Limpiar" y "Aplicar"), así
  que ya no son necesarios en FilterBar. Limpio también los imports sobrantes:

● Update(frontend\src\components\FilterBar.tsx)
  ⎿  Removed 4 lines
       1  import Box from '@mui/material/Box';
       2  import TextField from '@mui/material/TextField';
       3  import MenuItem from '@mui/material/MenuItem';
       4 -import Button from '@mui/material/Button';
       5 -import Badge from '@mui/material/Badge';
       6 -import FilterListIcon from '@mui/icons-material/FilterList';
       7 -import RestartAltIcon from '@mui/icons-material/RestartAlt';
       4  import type { FilterFieldConfig } from '../types';
       5
       6  interface FilterBarProps<T extends Record<string, unknown>> {

● Bash(cd "C:\Users\santi\Desktop\DESARROLLOS\Agentemotor" && git add frontend/src/components/PolicyTable.tsx
      frontend/src/components/FilterBar.tsx && git commit -m "f…)
  ⎿  warning: in the working copy of 'frontend/src/components/FilterBar.tsx', LF will be replaced by CRLF the next
     time Git touches it
     warning: in the working copy of 'frontend/src/components/PolicyTable.tsx', LF will be replaced by CRLF the nex
     … +3 lines (ctrl+o to expand)

● Listo. Los dos cambios:

  Columna "Días" en la tabla:
  - +Xd vencida en rojo (>20 días) o naranja (≤20 días) para pólizas vencidas
  - Xd restantes en verde para pólizas vigentes
  - Vence hoy en naranja para las que vencen hoy

  Filtros verticales en FilterBar:
  - Cambiado de flexWrap: 'wrap' horizontal a flexDirection: 'column'
  - Todos los campos ahora usan fullWidth para ocupar el ancho del drawer
  - Removidos el badge y botón "Limpiar" de FilterBar (el FilterDrawer ya tiene sus propios botones "Limpiar" y
  "Aplicar" en el footer)

✻ Crunched for 1m 15s

> Ajusta la sección del menu y las cards, no están tomando el modo claro, se quedan en modo oscuro al cambiar

  Searched for 1 pattern, read 1 file (ctrl+o to expand)

● El problema son colores hardcodeados en dark que no se adaptan al tema. Hay tres sitios afectados: el sidebar, las
  cards y el AppBar.

● Update(frontend\src\components\DashboardCard.tsx)
  ⎿  Added 1 line, removed 1 line
      34        <Card
      35          sx={{
      36            height: '100%',
      37 -          background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
      37 +          bgcolor: 'background.paper',
      38          }}
      39        >
      40          <CardContent sx={{ p: 3 }}>

● Update(frontend\src\components\DashboardCard.tsx)
  ⎿  Added 2 lines, removed 1 line
      52          height: '100%',
      53          position: 'relative',
      54          overflow: 'hidden',
      55 +        bgcolor: active ? 'transparent' : 'background.paper',
      56          background: active
      57            ? `linear-gradient(135deg, ${color.main}15 0%, ${color.dark}10 100%)`
      57 -          : 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
      58 +          : undefined,
      59          border: active
      60            ? `1.5px solid ${color.main}60`
      61            : '1px solid rgba(148, 163, 184, 0.08)',

● Ahora el sidebar en AppLayout — reemplazar el gradiente hardcodeado por tokens del tema:

● Update(frontend\src\components\layout\AppLayout.tsx)
  ⎿  Added 3 lines, removed 2 lines
      218            '& .MuiDrawer-paper': {
      219              width: DRAWER_WIDTH,
      220              boxSizing: 'border-box',
      221 -            borderRight: '1px solid rgba(148, 163, 184, 0.06)',
      222 -            background: 'linear-gradient(180deg, #0F1629 0%, #111827 100%)',
      221 +            borderRight: '1px solid',
      222 +            borderColor: 'divider',
      223 +            bgcolor: 'background.paper',
      224              top: 'auto',
      225            },
      226          }}

● Y el AppBar — background: 'background.paper' no resuelve tokens, debe ser bgcolor:

● Update(frontend\src\components\layout\AppLayout.tsx)
  ⎿  Added 3 lines, removed 2 lines
      174          position="fixed"
      175          elevation={0}
      176          sx={{
      177 -          background: 'background.paper',
      178 -          borderBottom: '1px solid divider',
      177 +          bgcolor: 'background.paper',
      178 +          borderBottom: '1px solid',
      179 +          borderColor: 'divider',
      180            zIndex: theme.zIndex.drawer + 1,
      181          }}
      182        >

● Bash(cd "C:\Users\santi\Desktop\DESARROLLOS\Agentemotor" && git add frontend/src/components/DashboardCard.tsx
      frontend/src/components/layout/AppLayout.tsx && git com…)
  ⎿  warning: in the working copy of 'frontend/src/components/DashboardCard.tsx', LF will be replaced by CRLF the n
     ext time Git touches it
     warning: in the working copy of 'frontend/src/components/layout/AppLayout.tsx', LF will be replaced by CRLF th
     … +3 lines (ctrl+o to expand)

● Listo. Los problemas eran:

  ┌───────────────┬───────────────────────────────────────────────┬─────────────────────────────────────────────────┐
  │  Componente   │                   Problema                    │                       Fix                       │
  ├───────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ DashboardCard │ background: 'linear-gradient(#111827...)'     │ bgcolor: 'background.paper' (usa token del      │
  │               │ hardcodeado                                   │ tema)                                           │
  ├───────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Sidebar       │ background: 'linear-gradient(#0F1629...)'     │ bgcolor: 'background.paper' + borderColor:      │
  │               │ hardcodeado                                   │ 'divider'                                       │
  ├───────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │               │ background: 'background.paper' — CSS          │ Cambiado a bgcolor: 'background.paper' (sx      │
  │ AppBar        │ background no resuelve tokens MUI             │ shorthand que sí resuelve) + borderColor:       │
  │               │                                               │ 'divider'                                       │
  └───────────────┴───────────────────────────────────────────────┴─────────────────────────────────────────────────┘

  En MUI el sx prop resuelve tokens del tema solo con las propiedades shorthand (bgcolor, color, borderColor), no con la
   propiedad CSS raw background.

✻ Brewed for 1m 11s

> [Image #1] Actua como fullstack senior en frontend realiza el ajuste visual, en la sección de los menus quedó
escondido el nombre del usuario, los botones en modo claro quedaron blancos y no se ven al igual que el texto. Ajusta
los estilos de "Registrar gestión", el boton y el cuadro de texto deben ser alineados. El modal "Renovar Póliza" no
está tomando el modo claro. Verifica todos los componentes.
  ⎿  [Image #1]

  Searched for 3 patterns, read 4 files (ctrl+o to expand)

● Tengo el mapa completo de los problemas. Hay 6 fixes:

  1. AppBar — color prop faltante, iconos heredan blanco
  2. Sidebar top — top: 'auto' no funciona en posición fija, se traslapa con AppBar
  3. RenovarDialog — gradiente oscuro hardcodeado
  4. LogTimeline — background oscuro hardcodeado en el Paper
  5. PolicyStatusChip — usa color.light (invisible en fondo blanco)
  6. Registrar gestión — botón fuera del Grid, desalineado

● Update(frontend\src\components\layout\AppLayout.tsx)
  ⎿  Added 1 line
      172        {/* App Bar — always visible */}
      173        <AppBar
      174          position="fixed"
      175 +        color="default"
      176          elevation={0}
      177          sx={{
      178            bgcolor: 'background.paper',

● Update(frontend\src\components\layout\AppLayout.tsx)
  ⎿  Added 2 lines, removed 1 line
      223              borderRight: '1px solid',
      224              borderColor: 'divider',
      225              bgcolor: 'background.paper',
      226 -            top: 'auto',
      226 +            top: 64,
      227 +            height: 'calc(100% - 64px)',
      228            },
      229          }}
      230        >

● Update(frontend\src\components\RenovarDialog.tsx)
  ⎿  Added 1 line, removed 3 lines
      43        fullWidth
      44        slotProps={{
      45          paper: {
      46 -          sx: {
      47 -            background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
      48 -          },
      46 +          sx: { bgcolor: 'background.paper' },
      47          },
      48        }}
      49      >

● Update(frontend\src\components\LogTimeline.tsx)
  ⎿  Added 3 lines, removed 2 lines
      73                  elevation={0}
      74                  sx={{
      75                    p: 2,
      76 -                  backgroundColor: 'rgba(17, 24, 39, 0.6)',
      77 -                  border: '1px solid rgba(148, 163, 184, 0.08)',
      76 +                  bgcolor: 'background.default',
      77 +                  border: '1px solid',
      78 +                  borderColor: 'divider',
      79                    borderRadius: 2,
      80                  }}
      81                >

● Update(frontend\src\components\PolicyStatusChip.tsx)
  ⎿  Added 2 lines, removed 2 lines
      15        label={policyStatusLabels[status]}
      16        size={size}
      17        sx={{
      18 -        backgroundColor: `${color.main}20`,
      19 -        color: color.light,
      18 +        backgroundColor: `${color.main}18`,
      19 +        color: color.dark,
      20          borderColor: `${color.main}40`,
      21          border: '1px solid',
      22          fontWeight: 600,

● Ahora el "Registrar gestión" — meto el botón dentro del Grid con alignItems="flex-end":

● Update(frontend\src\pages\Policy\PolizaDetallePage.tsx)
  ⎿  Added 14 lines, removed 13 lines
      185              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
      186                Registrar gestión
      187              </Typography>
      188 -            <Grid container spacing={3}>
      189 -              <Grid size={{ xs: 12, md: 4 }}>
      188 +            <Grid container spacing={2} alignItems="flex-end">
      189 +              <Grid size={{ xs: 12, md: 3 }}>
      190                  <TextField
      191                    label="Acción"
      192                    select
     ...
      201                    ))}
      202                  </TextField>
      203                </Grid>
      204 -              <Grid size={{ xs: 12, md: 8 }}>
      204 +              <Grid size={{ xs: 12, md: 7 }}>
      205                  <TextField
      206                    label="Notas"
      207                    multiline
     ...
      211                    onChange={(event) => setNotas(event.target.value)}
      212                  />
      213                </Grid>
      214 +              <Grid size={{ xs: 12, md: 2 }}>
      215 +                <LoadingButton
      216 +                  variant="contained"
      217 +                  loading={isLogging}
      218 +                  startIcon={<AddCircleOutlineIcon />}
      219 +                  onClick={submit}
      220 +                  fullWidth
      221 +                >
      222 +                  Registrar
      223 +                </LoadingButton>
      224 +              </Grid>
      225              </Grid>
      215 -            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
      216 -              <LoadingButton
      217 -                variant="contained"
      218 -                loading={isLogging}
      219 -                startIcon={<AddCircleOutlineIcon />}
      220 -                onClick={submit}
      221 -              >
      222 -                Registrar gestión
      223 -              </LoadingButton>
      224 -            </Box>
      226            </Paper>
      227          </Stack>
      228        ) : (

● Bash(cd "C:\Users\santi\Desktop\DESARROLLOS\Agentemotor\frontend" && npx tsc --noEmit 2>&1 | head -20)
  ⎿  (No output)

● Bash(cd "C:\Users\santi\Desktop\DESARROLLOS\Agentemotor" && git add frontend/src/components/layout/AppLayout.tsx
      frontend/src/components/RenovarDialog.tsx frontend/s…)
  ⎿  warning: in the working copy of 'frontend/src/components/LogTimeline.tsx', LF will be replaced by CRLF the nex
     t time Git touches it
     warning: in the working copy of 'frontend/src/components/PolicyStatusChip.tsx', LF will be replaced by CRLF th
     … +9 lines (ctrl+o to expand)

● Listo. Resumen de cada fix:

  ┌──────────────────┬────────────────────────────────────────────┬────────────────────────────────────────────────┐
  │    Componente    │                  Problema                  │                      Fix                       │
  ├──────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ AppBar           │ Sin color prop → íconos heredaban blanco   │ color="default" → usa colores del texto del    │
  │                  │ (contraste primario)                       │ tema                                           │
  ├──────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ Sidebar          │ top: 'auto' en posición fixed → volvía a   │ top: 64, height: 'calc(100% - 64px)' — offset  │
  │                  │ top: 0, tapadando el AppBar                │ exacto del AppBar                              │
  ├──────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ RenovarDialog    │ Gradiente #111827 hardcodeado              │ bgcolor: 'background.paper'                    │
  ├──────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ LogTimeline      │ backgroundColor: 'rgba(17,24,39,0.6)'      │ bgcolor: 'background.default' + borderColor:   │
  │                  │ hardcodeado                                │ 'divider'                                      │
  ├──────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ PolicyStatusChip │ color: color.light invisible en fondo      │ color: color.dark — versión oscura del color   │
  │                  │ blanco                                     │ visible en ambos modos                         │
  ├──────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ Registrar        │ Botón fuera del Grid en un Box aparte      │ Botón dentro del Grid md:2 con                 │
  │ gestión          │                                            │ alignItems="flex-end" — alineado al baseline   │
  └──────────────────┴────────────────────────────────────────────┴────────────────────────────────────────────────┘

