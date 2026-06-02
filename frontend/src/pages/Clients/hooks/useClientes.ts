import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type { ClienteListResponse } from '../../../types';

export function useClientes() {
  const query = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await apiClient.get<ClienteListResponse>('/clientes');
      return data;
    },
  });

  return {
    clientes: query.data?.clientes ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
