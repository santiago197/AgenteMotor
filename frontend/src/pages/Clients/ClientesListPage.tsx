import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useClientes } from './hooks/useClientes';
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

export default function ClientesListPage() {
  const navigate = useNavigate();
  const { clientes, isLoading, error, refetch } = useClientes();

  const columns: GridColDef<Cliente>[] = useMemo(
    () => [
      {
        field: 'cliente',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 220,
        valueGetter: (params) => `${params.row.nombres} ${params.row.apellidos}`,
      },
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
          description="Crea un cliente nuevo para comenzar a administrar su cartera de pólizas."
          action={
            <Button variant="contained" onClick={() => navigate('/clientes/nuevo')}>
              Crear cliente
            </Button>
          }
        />
      )}
    </Box>
  );
}
