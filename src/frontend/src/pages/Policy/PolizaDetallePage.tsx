import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import { usePolizaDetalle } from './hooks/usePolizaDetalle';
import { useRenovar } from './hooks/useRenovar';
import { useLogForm } from './hooks/useLogForm';

export default function PolizaDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const polizaId = id ? Number(id) : undefined;
  const { poliza, historial, isLoading, error } = usePolizaDetalle(polizaId);

  const { renovar, isLoading: isRenovating } = useRenovar(polizaId);
  const {
    accion,
    setAccion,
    notas,
    setNotas,
    submit,
    isLogging,
    gestionError,
    logs,
    logsError,
    historyDrawerOpen,
    openHistoryDrawer,
    closeHistoryDrawer,
    LOG_ACTIONS,
  } = useLogForm(polizaId, poliza?.clienteId);

  const [dialogOpen, setDialogOpen] = useState(false);

  const historyColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'tipo',
        headerName: 'Tipo',
        width: 160,
        valueFormatter: (params) =>
          params.value === 'RENOVACION' ? 'Renovación' : 'Nueva contratación',
      },
      {
        field: 'fechaInicioVig',
        headerName: 'Inicio de vigencia',
        width: 150,
      },
      {
        field: 'fechaFinVig',
        headerName: 'Fin de vigencia',
        width: 150,
      },
      {
        field: 'creadoEn',
        headerName: 'Registrado el',
        width: 170,
      },
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
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }} >
            <Button variant="outlined" onClick={() => navigate('/polizas')}>
              Volver a pólizas
            </Button>
            <Button variant="outlined" startIcon={<HistoryIcon />} onClick={openHistoryDrawer}>
              Historial
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Actualizar
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
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Resumen
                    </Typography>
                    <PolicyStatusChip status={poliza.estado} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {poliza.numeroPoliza}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tipo: {poliza.tipo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contratación: {poliza.tipoContratacion === 'RENOVACION' ? 'Renovación' : 'Nueva contratación'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fecha expedición: {poliza.fechaExpedicion}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inicio vigencia: {poliza.fechaInicioVig}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fin vigencia: {poliza.fechaFinVig}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fecha renovación: {poliza.fechaRenovacion ?? 'No registrada'}
                  </Typography>
                  <Button variant="contained" onClick={() => setDialogOpen(true)}>
                    Renovar póliza
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Historial de renovaciones
                  </Typography>
                </Stack>
                {historial.length ? (
                  <Paper sx={{ height: 360, borderRadius: 3, overflow: 'hidden' }}>
                    <DataGrid
                      rows={historial}
                      columns={historyColumns}
                      disableRowSelectionOnClick
                      pageSizeOptions={[5, 10]}
                      initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                      sx={{ border: 'none' }}
                    />
                  </Paper>
                ) : (
                  <EmptyState
                    title="Sin historial de renovaciones"
                    description="Esta póliza no tiene renovaciones registradas aún."
                  />
                )}
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Registrar gestión
            </Typography>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Acción"
                  select
                  fullWidth
                  value={accion}
                  onChange={(event) => setAccion(event.target.value as typeof LOG_ACTIONS[number])}
                >
                  {LOG_ACTIONS.map((actionOption) => (
                    <MenuItem key={actionOption} value={actionOption}>
                      {actionOption}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                  label="Notas"
                  multiline
                  rows={3}
                  fullWidth
                  value={notas}
                  onChange={(event) => setNotas(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <LoadingButton
                  variant="contained"
                  loading={isLogging}
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={submit}
                  fullWidth
                >
                  Registrar
                </LoadingButton>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      ) : (
        !isLoading && (
          <EmptyState
            title="Póliza no encontrada"
            description="Verifica que el enlace sea correcto o regresa al listado de pólizas."
            action={
              <Button variant="contained" onClick={() => navigate('/polizas')}>
                Volver a pólizas
              </Button>
            }
          />
        )
      )}

      <RenovarDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={(data) => {
          renovar(data);
          setDialogOpen(false);
        }}
        loading={isRenovating}
      />

      <Drawer anchor="right" open={historyDrawerOpen} onClose={closeHistoryDrawer} PaperProps={{ sx: { width: 400, p: 2 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Log de gestiones</Typography>
          <IconButton onClick={closeHistoryDrawer} size="small"><CloseIcon /></IconButton>
        </Stack>
        <LogTimeline logs={logs} />
      </Drawer>
    </Box>
  );
}
