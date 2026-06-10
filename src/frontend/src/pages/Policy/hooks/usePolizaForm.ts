import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../lib/apiClient';
import type { PolizaFormData } from '../../../types';

const polizaSchema = z.object({
  clienteId: z.number(),
  aseguradoraId: z.number({ invalid_type_error: 'Selecciona una aseguradora' }).min(1, 'Aseguradora es obligatoria'),
  numeroPoliza: z.string().min(1, 'Número de póliza es obligatorio'),
  tipo: z.enum(['AUTO', 'HOGAR', 'VIDA', 'OTRA'] as const),
  fechaExpedicion: z.string().min(1, 'Fecha de expedición es obligatoria'),
  fechaInicioVig: z.string().min(1, 'Fecha inicio de vigencia es obligatoria'),
  fechaFinVig: z.string().min(1, 'Fecha fin de vigencia es obligatoria'),
  notas: z.string().optional(),
});

interface UsePolizaFormOptions {
  clienteId: number;
}

export function usePolizaForm({ clienteId }: UsePolizaFormOptions) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<PolizaFormData>({
    resolver: zodResolver(polizaSchema),
    defaultValues: {
      clienteId,
      aseguradoraId: 0,
      numeroPoliza: '',
      tipo: 'AUTO',
      fechaExpedicion: '',
      fechaInicioVig: '',
      fechaFinVig: '',
      notas: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PolizaFormData) => {
      const { data: resp } = await apiClient.post<{ id: number }>('/polizas', data);
      return resp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] });
      navigate(`/clientes/${clienteId}`);
    },
  });

  return {
    form,
    submit: form.handleSubmit((data) => mutation.mutate(data)),
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
