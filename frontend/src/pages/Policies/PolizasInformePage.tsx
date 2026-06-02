import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/FilterBar';
import PolicyTable from '../../components/PolicyTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorAlert from '../../components/common/ErrorAlert';
import { usePolizasInforme } from './hooks/usePolizasInforme';
import type { FilterFieldConfig } from '../../types';

const FILTER_FIELDS: FilterFieldConfig[] = [
  {
    name: 'tipo',
    label: 'Tipo de póliza',
    type: 'select',
    options: [
      { value: 'AUTO', label: 'Auto' },
      { value: 'HOGAR', label: 'Hogar' },
      { value: 'VIDA', label: 'Vida' },
      { value: 'OTRA', label: 'Otra' },
    ],
  },
  {
    name: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'VIGENTE', label: 'Vigente' },
      { value: 'PROXIMA_VENCER', label: 'Próxima a vencer' },
      { value: 'VENCIDA_RENOVABLE', label: 'Vencida renovable' },
      { value: 'VENCIDA_CRITICA', label: 'Vencida crítica' },
      { value: 'VENCIDA_PERDIDA', label: 'Vencida perdida' },
    ],
  },
  {
    name: 'tipoContratacion',
    label: 'Tipo contratación',
    type: 'select',
    options: [
      { value: 'NUEVA_CONTRATACION', label: 'Nueva contratación' },
      { value: 'RENOVACION', label: 'Renovación' },
    ],
  },
  { name: 'desde', label: 'Desde', type: 'date' },
  { name: 'hasta', label: 'Hasta', type: 'date' },
  { name: 'documento', label: 'Documento', type: 'text' },
  { name: 'numeroPoliza', label: 'Número de póliza', type: 'text' },
];

export default function PolizasInformePage() {
  const navigate = useNavigate();
  const {
    polizas,
    total,
    isLoading,
    error,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    page,
    pageSize,
    setPage,
    setPageSize,
    exportToExcel,
    isExporting,
  } = usePolizasInforme();

  const pageSubtitle = useMemo(
    () => 'Explora y exporta tu informe de pólizas con filtros rápidos y paginación.',
    []
  );

  return (
    <Box>
      <PageHeader
        title="Informe de pólizas"
        subtitle={pageSubtitle}
        actions={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<FilterAltIcon />}
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
            >
              Reiniciar filtros
            </Button>
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

      <FilterBar
        fields={FILTER_FIELDS}
        values={filters}
        onChange={setFilter}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />

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
    </Box>
  );
}
