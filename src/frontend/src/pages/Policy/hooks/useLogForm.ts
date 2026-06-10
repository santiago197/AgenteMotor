import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useGestion } from './useGestion';
import type { LogEntry } from '../../../types';

export const LOG_ACTIONS = ['LLAMADA', 'EMAIL', 'VISITA', 'RENOVACION'] as const;
export type LogAction = typeof LOG_ACTIONS[number];

export function useLogForm(polizaId: number | undefined, clienteId: number | undefined) {
  const [accion, setAccion] = useState<LogAction>('LLAMADA');
  const [notas, setNotas] = useState('');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const { registrarGestion, isLoading: isLogging, error: gestionError } = useGestion(polizaId, clienteId);

  const logsQuery = useQuery({
    queryKey: ['clienteLogs', clienteId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ logs: LogEntry[] }>(`/clientes/${clienteId}`);
      return data.logs;
    },
    enabled: !!clienteId,
  });

  const submit = () => {
    registrarGestion(
      { accion, notas: notas || undefined },
      {
        onSuccess: () => {
          setNotas('');
        },
      }
    );
  };

  return {
    accion,
    setAccion,
    notas,
    setNotas,
    submit,
    isLogging,
    gestionError,
    logs: logsQuery.data ?? [],
    logsError: logsQuery.error,
    historyDrawerOpen,
    openHistoryDrawer: () => setHistoryDrawerOpen(true),
    closeHistoryDrawer: () => setHistoryDrawerOpen(false),
    LOG_ACTIONS,
  };
}
