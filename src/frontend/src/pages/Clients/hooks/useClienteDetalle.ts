import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type { ClienteDetalleResponse } from '../../../types';

export function useClienteDetalle(clienteId: number | undefined) {
  const query = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: async () => {
      const { data } = await apiClient.get<ClienteDetalleResponse>(`/clientes/${clienteId}`);
      return data;
    },
    enabled: !!clienteId,
  });

  return {
    cliente: query.data?.cliente ?? null,
    polizas: query.data?.polizas ?? [],
    logs: query.data?.logs ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
