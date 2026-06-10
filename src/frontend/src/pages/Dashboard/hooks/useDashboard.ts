import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useFilters } from '../../../hooks/useFilters';
import { usePagination } from '../../../hooks/usePagination';
import type { DashboardResponse, DashboardSearchParams, PolicyStatus } from '../../../types';

const INITIAL_FILTERS: DashboardSearchParams = {
  estado: undefined,
  tipo: undefined,
  numeroPoliza: undefined,
  documento: undefined,
  nombre: undefined,
};

export function useDashboard() {
  const { filters, setFilter, resetFilters, activeFilterCount } =
    useFilters<DashboardSearchParams>(INITIAL_FILTERS);
  const { page, pageSize, setPage, setPageSize, resetPagination } = usePagination();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const query = useQuery({
    queryKey: ['dashboard', filters, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.post<DashboardResponse>('/dashboard/search', {
        ...filters,
        page,
        pageSize,
      });
      return data;
    },
  });

  const filterByStatus = (status: PolicyStatus) => {
    // Toggle: if same status clicked, clear filter
    if (filters.estado === status) {
      setFilter('estado', undefined);
    } else {
      setFilter('estado', status);
    }
    resetPagination();
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    filters,
    setFilter: (key: keyof DashboardSearchParams, value: unknown) => {
      setFilter(key, value as DashboardSearchParams[typeof key]);
      resetPagination();
    },
    resetFilters: () => {
      resetFilters();
      resetPagination();
    },
    activeFilterCount,
    filterByStatus,
    page,
    pageSize,
    setPage,
    setPageSize,
    filterDrawerOpen,
    openFilterDrawer: () => setFilterDrawerOpen(true),
    closeFilterDrawer: () => setFilterDrawerOpen(false),
  };
}
