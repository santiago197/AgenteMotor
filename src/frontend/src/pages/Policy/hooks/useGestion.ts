import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type { LogFormData } from '../../../types';

export function useGestion(polizaId: number | undefined, clienteId?: number) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: LogFormData) => {
      await apiClient.post(`/polizas/${polizaId}/log`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poliza', polizaId] });
      queryClient.invalidateQueries({ queryKey: ['clienteLogs', clienteId] });
    },
  });

  return {
    registrarGestion: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
