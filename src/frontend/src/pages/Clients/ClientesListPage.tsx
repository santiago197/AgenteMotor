import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import LoadingButton from '@mui/lab/LoadingButton';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import * as xlsx from 'xlsx';
import apiClient from '../../lib/apiClient';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useClientes } from './hooks/useClientes';
import { useClientesListPage } from './hooks/useClientesListPage';
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
  const { importModalOpen, openImportModal, closeImportModal, downloadTemplate } = useClientesListPage();

  const [step, setStep] = useState<'select' | 'results'>('select');
  const [file, setFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ row: Record<string, unknown>; status: string; reason?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = xlsx.read(e.target!.result, { type: 'array' });
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setRowCount(rows.length);
    };
    reader.readAsArrayBuffer(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await apiClient.post<{ summary: typeof results }>('/clientes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(data.summary);
      setStep('results');
      refetch();
    } catch {
      setResults([]);
    } finally {
      setUploading(false);
    }
  };

  const handleModalClose = () => {
    closeImportModal();
    setStep('select');
    setFile(null);
    setRowCount(0);
    setResults([]);
    setDragOver(false);
  };

  const columns: GridColDef<Cliente>[] = useMemo(
    () => [
      {
        field: 'cliente',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 220,
        valueGetter: (_value: unknown, row: Cliente) => `${row.nombres} ${row.apellidos}`,
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
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate}>
              Descargar plantilla
            </Button>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={openImportModal}>
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
          description="Crea un cliente nuevo para comenzar a administrar su cartera de pólizas."
          action={
            <Button variant="contained" onClick={() => navigate('/clientes/nuevo')}>
              Crear cliente
            </Button>
          }
        />
      )}

      <Dialog open={importModalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>{step === 'select' ? 'Importar clientes desde Excel' : 'Resultados de importación'}</DialogTitle>
        <DialogContent>
          {step === 'select' && (
            <Box>
              <Box
                sx={{
                  border: `2px dashed ${dragOver ? 'primary.main' : 'divider'}`,
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: dragOver ? 'action.hover' : 'background.default',
                  transition: 'all 0.2s',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFileSelect(f);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1">Arrastra un archivo .xlsx aquí</Typography>
                <Typography variant="body2" color="text.secondary">o haz clic para seleccionar</Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
              </Box>
              {file && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {file.name} — {rowCount} filas detectadas
                </Alert>
              )}
            </Box>
          )}
          {step === 'results' && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Documento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Razón</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i} sx={{ bgcolor: r.status === 'imported' ? 'success.light' : 'error.light', '& td': { color: 'common.black' } }}>
                    <TableCell>{String(r.row['documento'] ?? '')}</TableCell>
                    <TableCell>{r.status === 'imported' ? 'Importado' : 'Rechazado'}</TableCell>
                    <TableCell>{r.reason ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Cerrar</Button>
          <Button variant="outlined" onClick={downloadTemplate} size="small">Descargar plantilla</Button>
          {step === 'select' && (
            <LoadingButton variant="contained" loading={uploading} disabled={!file} onClick={handleUpload}>
              Subir
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
