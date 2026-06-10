import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useFilters } from '../../../hooks/useFilters';
import { usePagination } from '../../../hooks/usePagination';
import { useExcelExport } from '../../../hooks/useExcelExport';
import type { PolizaSearchResponse } from '../../../types';

interface PolizaFilters {
  tipo?: string;
  estado?: string;
  tipoContratacion?: string;
  desde?: string;
  hasta?: string;
  documento?: string;
  numeroPoliza?: string;
  aseguradoraId?: number;
}

const INITIAL_FILTERS: PolizaFilters = {};

export function usePolizasInforme() {
  const { filters, setFilter, resetFilters, activeFilterCount } =
    useFilters<PolizaFilters>(INITIAL_FILTERS);
  const { page, pageSize, setPage, setPageSize, resetPagination } = usePagination();
  const { exportToExcel, isExporting } = useExcelExport({
    url: '/polizas/export',
    filename: 'polizas-export.xlsx',
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const query = useQuery({
    queryKey: ['polizas', filters, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.post<PolizaSearchResponse>('/polizas/search', {
        ...filters,
        page,
        pageSize,
      });
      return data;
    },
  });

  return {
    polizas: query.data?.polizas ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    filters,
    setFilter: (key: keyof PolizaFilters, value: unknown) => {
      setFilter(key, value as PolizaFilters[typeof key]);
      resetPagination();
    },
    resetFilters: () => {
      resetFilters();
      resetPagination();
    },
    activeFilterCount,
    page,
    pageSize,
    setPage,
    setPageSize,
    exportToExcel: () => exportToExcel(filters),
    isExporting,
    filterDrawerOpen,
    openFilterDrawer: () => setFilterDrawerOpen(true),
    closeFilterDrawer: () => setFilterDrawerOpen(false),
  };
}
