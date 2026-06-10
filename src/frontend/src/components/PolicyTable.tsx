import { useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import type { Poliza } from '../types';
import PolicyStatusChip from './PolicyStatusChip';
import dayjs from 'dayjs';

interface PolicyTableProps {
  polizas: Poliza[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick?: (polizaId: number) => void;
}

const POLICY_TYPE_LABELS: Record<string, string> = {
  AUTO: 'Auto',
  HOGAR: 'Hogar',
  VIDA: 'Vida',
  OTRA: 'Otra',
};

export default function PolicyTable({
  polizas,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: PolicyTableProps) {
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'numeroPoliza',
        headerName: 'N° Póliza',
        flex: 1,
        minWidth: 140,
      },
      {
        field: 'clienteNombre',
        headerName: 'Cliente',
        flex: 1.2,
        minWidth: 160,
        valueGetter: (_value, row) => {
          if (row.clienteNombres && row.clienteApellidos) {
            return `${row.clienteNombres} ${row.clienteApellidos}`;
          }
          return '—';
        },
      },
      {
        field: 'tipo',
        headerName: 'Tipo',
        width: 100,
        valueFormatter: (value) => POLICY_TYPE_LABELS[value as string] ?? value,
      },
      {
        field: 'estado',
        headerName: 'Estado',
        width: 170,
        renderCell: (params) => <PolicyStatusChip status={params.value} />,
      },
      {
        field: 'fechaFinVig',
        headerName: 'Vence',
        width: 120,
        valueFormatter: (value) =>
          value ? dayjs(value as string).format('DD/MM/YYYY') : '—',
      },
      {
        field: '_diasVencida',
        headerName: 'Días',
        width: 110,
        sortable: false,
        valueGetter: (_value, row) => {
          if (!row.fechaFinVig) return null;
          return dayjs().startOf('day').diff(dayjs(row.fechaFinVig as string).startOf('day'), 'day');
        },
        renderCell: (params) => {
          const dias = params.value as number | null;
          if (dias === null) return '—';
          if (dias > 0) {
            const color = dias > 20 ? 'error' : 'warning';
            return (
              <Box sx={{ color: `${color}.main`, fontWeight: 600, fontSize: '0.82rem' }}>
                +{dias}d vencida
              </Box>
            );
          }
          if (dias < 0) {
            return (
              <Box sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.82rem' }}>
                {Math.abs(dias)}d restantes
              </Box>
            );
          }
          return (
            <Box sx={{ color: 'warning.main', fontWeight: 600, fontSize: '0.82rem' }}>
              Vence hoy
            </Box>
          );
        },
      },
      {
        field: 'fechaInicioVig',
        headerName: 'Inicio Vigencia',
        width: 130,
        valueFormatter: (value) =>
          value ? dayjs(value as string).format('DD/MM/YYYY') : '—',
      },
      {
        field: 'tipoContratacion',
        headerName: 'Contratación',
        width: 150,
        valueFormatter: (value) =>
          value === 'RENOVACION' ? 'Renovación' : 'Nueva contratación',
      },
    ],
    []
  );

  const handlePaginationChange = useCallback(
    (model: GridPaginationModel) => {
      if (model.page + 1 !== page) onPageChange(model.page + 1);
      if (model.pageSize !== pageSize) onPageSizeChange(model.pageSize);
    },
    [page, pageSize, onPageChange, onPageSizeChange]
  );

  return (
    <Box
      sx={{
        width: '100%',
        '& .MuiDataGrid-root': {
          border: '1px solid rgba(148, 163, 184, 0.08)',
          borderRadius: 3,
          '& .MuiDataGrid-row': {
            cursor: onRowClick ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(108, 99, 255, 0.06)',
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(17, 24, 39, 0.8)',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid rgba(148, 163, 184, 0.08)',
          },
        },
      }}
    >
      <DataGrid
        rows={polizas}
        columns={columns}
        loading={loading}
        rowCount={total}
        paginationMode="server"
        paginationModel={{ page: page - 1, pageSize }}
        onPaginationModelChange={handlePaginationChange}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        onRowClick={onRowClick ? (params) => onRowClick(params.row.id) : undefined}
        autoHeight
        sx={{ minHeight: 400 }}
        localeText={{
          noRowsLabel: 'No se encontraron pólizas',
        }}
      />
    </Box>
  );
}
