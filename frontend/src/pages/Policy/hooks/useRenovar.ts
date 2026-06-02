import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type { RenovarFormData, RenovarResponse } from '../../../types';

export function useRenovar(polizaId: number | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: RenovarFormData) => {
      const { data: response } = await apiClient.post<RenovarResponse>(
        `/polizas/${polizaId}/renovar`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poliza', polizaId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
    },
  });

  return {
    renovar: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}
