import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../lib/apiClient';
import type { ClienteFormData, Cliente } from '../../../types';

const clienteSchema = z.object({
  nombres: z.string().min(1, 'Nombres es obligatorio'),
  apellidos: z.string().min(1, 'Apellidos es obligatorio'),
  tipoDoc: z.enum(['CC', 'NIT', 'CE'] as const),
  documento: z.string().min(1, 'Documento es obligatorio'),
  celular: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  estadoGestion: z
    .enum(['COTIZACION', 'POLIZA_CONTRATADA', 'NO_VIGENTE', 'SIN_CONTACTO', 'GESTIONADO'])
    .optional(),
});

interface UseClienteFormOptions {
  editingCliente?: Cliente | null;
}

export function useClienteForm({ editingCliente }: UseClienteFormOptions = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!editingCliente;

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: editingCliente
      ? {
          nombres: editingCliente.nombres,
          apellidos: editingCliente.apellidos,
          tipoDoc: editingCliente.tipoDoc,
          documento: editingCliente.documento,
          celular: editingCliente.celular ?? '',
          email: editingCliente.email ?? '',
          telefono: editingCliente.telefono ?? '',
          fechaNacimiento: editingCliente.fechaNacimiento ?? '',
          estadoGestion: editingCliente.estadoGestion,
        }
      : {
          nombres: '',
          apellidos: '',
          tipoDoc: 'CC',
          documento: '',
          celular: '',
          email: '',
          telefono: '',
          fechaNacimiento: '',
          estadoGestion: 'SIN_CONTACTO',
        },
  });

  useEffect(() => {
    if (editingCliente) {
      form.reset({
        nombres: editingCliente.nombres,
        apellidos: editingCliente.apellidos,
        tipoDoc: editingCliente.tipoDoc,
        documento: editingCliente.documento,
        celular: editingCliente.celular ?? '',
        email: editingCliente.email ?? '',
        telefono: editingCliente.telefono ?? '',
        fechaNacimiento: editingCliente.fechaNacimiento ?? '',
        estadoGestion: editingCliente.estadoGestion,
      });
    }
  }, [editingCliente, form]);

  const mutation = useMutation({
    mutationFn: async (data: ClienteFormData) => {
      if (isEditing) {
        await apiClient.put(`/clientes/${editingCliente!.id}`, data);
      } else {
        await apiClient.post('/clientes', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['cliente', editingCliente!.id] });
      }
      navigate('/clientes');
    },
  });

  return {
    form,
    submit: form.handleSubmit((data) => mutation.mutate(data)),
    isSubmitting: mutation.isPending,
    error: mutation.error,
    isEditing,
  };
}
