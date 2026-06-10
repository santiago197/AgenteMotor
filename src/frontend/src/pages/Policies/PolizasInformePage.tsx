import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import FilterListIcon from '@mui/icons-material/FilterList';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterDrawer from '../../components/common/FilterDrawer';
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
    filterDrawerOpen,
    openFilterDrawer,
    closeFilterDrawer,
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
            <Badge badgeContent={activeFilterCount} color="primary" invisible={activeFilterCount === 0}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={openFilterDrawer}
              >
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

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={closeFilterDrawer}
        onApply={closeFilterDrawer}
        onClear={resetFilters}
      >
        <FilterBar
          fields={FILTER_FIELDS}
          values={filters}
          onChange={setFilter}
          onReset={resetFilters}
          activeCount={activeFilterCount}
        />
      </FilterDrawer>

      {activeFilterCount > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {FILTER_FIELDS.filter((f) => filters[f.name as keyof typeof filters] !== undefined && filters[f.name as keyof typeof filters] !== '').map((f) => {
            const key = f.name as keyof typeof filters;
            const rawValue = filters[key];
            const displayValue =
              f.options
                ? (f.options.find((o) => o.value === rawValue)?.label ?? String(rawValue))
                : String(rawValue);
            return (
              <Chip
                key={f.name}
                label={`${f.label}: ${displayValue}`}
                onDelete={() => setFilter(key, undefined)}
                size="small"
              />
            );
          })}
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
    </Box>
  );
}
