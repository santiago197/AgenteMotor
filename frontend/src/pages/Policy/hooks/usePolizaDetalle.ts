import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type { PolizaDetalleResponse } from '../../../types';

export function usePolizaDetalle(polizaId: number | undefined) {
  const query = useQuery({
    queryKey: ['poliza', polizaId],
    queryFn: async () => {
      const { data } = await apiClient.get<PolizaDetalleResponse>(`/polizas/${polizaId}`);
      return data;
    },
    enabled: !!polizaId,
  });

  return {
    poliza: query.data?.poliza ?? null,
    historial: query.data?.historial ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
