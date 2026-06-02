import { useMemo, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import AutoRenewIcon from '@mui/icons-material/AutoRenew';
import DashboardCard from '../../components/DashboardCard';
import FilterBar from '../../components/FilterBar';
import PolicyTable from '../../components/PolicyTable';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useDashboard } from './hooks/useDashboard';
import type { FilterFieldConfig, PolicyStatus } from '../../types';

const STATUS_CARDS: Array<{ status: PolicyStatus; title: string; icon: JSX.Element }> = [
  { status: 'VIGENTE', title: 'Vigentes', icon: <CheckCircleOutlineIcon /> },
  { status: 'PROXIMA_VENCER', title: 'Próximas a vencer', icon: <WarningAmberIcon /> },
  { status: 'VENCIDA_RENOVABLE', title: 'Vencidas renovables', icon: <AutoRenewIcon /> },
  { status: 'VENCIDA_CRITICA', title: 'Críticas', icon: <ErrorOutlineOutlinedIcon /> },
  { status: 'VENCIDA_PERDIDA', title: 'Perdidas', icon: <HistoryToggleOffIcon /> },
];

const FILTER_FIELDS: FilterFieldConfig[] = [
  {
    name: 'estado',
    label: 'Estado',
    type: 'select',
    options: STATUS_CARDS.map((card) => ({ value: card.status, label: card.title })),
  },
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
  { name: 'numeroPoliza', label: 'Número de póliza', type: 'text' },
  { name: 'documento', label: 'Documento', type: 'text' },
  { name: 'nombre', label: 'Nombre', type: 'text' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    error,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    filterByStatus,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useDashboard();

  const cards = useMemo(
    () =>
      STATUS_CARDS.map((card) => ({
        ...card,
        count: data?.dashboard?.[card.status] ?? 0,
      })),
    [data]
  );

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Visualiza el estado de tu cartera y filtra las pólizas críticas en tiempo real."
        actions={
          <Button variant="outlined" startIcon={<FilterAltIcon />} onClick={resetFilters}>
            Reiniciar filtros
          </Button>
        }
      />

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

      <FilterBar
        fields={FILTER_FIELDS}
        values={filters}
        onChange={setFilter}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />

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
    </Box>
  );
}
