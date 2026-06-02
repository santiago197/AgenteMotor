import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import LogTimeline from '../../components/LogTimeline';
import { useClienteDetalle } from './hooks/useClienteDetalle';
import type { Cliente } from '../../types';

const getStatusLabel = (estado: Cliente['estadoGestion']) => {
  switch (estado) {
    case 'COTIZACION':
      return { label: 'Cotización', color: 'info' as const };
    case 'POLIZA_CONTRATADA':
      return { label: 'Póliza contratada', color: 'success' as const };
    case 'NO_VIGENTE':
      return { label: 'No vigente', color: 'warning' as const };
    case 'GESTIONADO':
      return { label: 'Gestionado', color: 'secondary' as const };
    default:
      return { label: 'Sin contacto', color: 'default' as const };
  }
};

export default function ClienteDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const clienteId = id ? Number(id) : undefined;
  const { cliente, polizas, logs, isLoading, error } = useClienteDetalle(clienteId);

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'numeroPoliza', headerName: 'Número de póliza', flex: 1, minWidth: 160 },
      { field: 'tipo', headerName: 'Tipo', width: 110 },
      { field: 'estado', headerName: 'Estado', width: 180 },
      { field: 'fechaFinVig', headerName: 'Fin de vigencia', width: 140 },
      { field: 'tipoContratacion', headerName: 'Tipo contratación', width: 170 },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Cliente"
        subtitle="Visualiza los datos del cliente, sus pólizas y el historial de gestión."
        breadcrumbs={[{ label: 'Clientes', href: '/clientes' }, { label: cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'Detalle' }]}
        actions={
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/clientes/${clienteId}/editar`)}
            disabled={!cliente}
          >
            Editar cliente
          </Button>
        }
      />

      <ErrorAlert error={error ?? null} />
      <LoadingOverlay open={isLoading} message="Cargando cliente..." />

      {cliente ? (
        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Datos del cliente
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {cliente.nombres} {cliente.apellidos}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Documento:</strong> {cliente.tipoDoc} {cliente.documento}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Email:</strong> {cliente.email ?? 'No registrado'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Celular:</strong> {cliente.celular ?? 'No registrado'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Teléfono:</strong> {cliente.telefono ?? 'No registrado'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Fecha de nacimiento:</strong> {cliente.fechaNacimiento || 'No disponible'}
                </Typography>
                <Chip
                  label={getStatusLabel(cliente.estadoGestion).label}
                  color={getStatusLabel(cliente.estadoGestion).color}
                  size="small"
                  sx={{ mt: 2 }}
                />
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pólizas del cliente
                  </Typography>
                  <Button variant="outlined" size="small" onClick={() => navigate('/polizas')}>
                    Ver todas las pólizas
                  </Button>
                </Stack>
                {polizas.length ? (
                  <Paper sx={{ height: 320, borderRadius: 3, overflow: 'hidden' }}>
                    <DataGrid
                      rows={polizas}
                      columns={columns}
                      disableRowSelectionOnClick
                      onRowClick={(params) => navigate(`/polizas/${params.id}`)}
                      pageSizeOptions={[5, 10]}
                      initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                      sx={{ border: 'none' }}
                    />
                  </Paper>
                ) : (
                  <EmptyState
                    title="Este cliente no tiene pólizas"
                    description="Registra una póliza para comenzar a darle seguimiento a su cartera."
                  />
                )}
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Historial de gestión
            </Typography>
            <LogTimeline logs={logs} />
          </Paper>
        </Stack>
      ) : (
        !isLoading && (
          <EmptyState
            title="Cliente no encontrado"
            description="Verifica que el enlace sea correcto o regresa al listado de clientes."
            action={
              <Button variant="contained" onClick={() => navigate('/clientes')}>
                Volver a clientes
              </Button>
            }
          />
        )
      )}
    </Box>
  );
}
