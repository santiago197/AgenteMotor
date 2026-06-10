import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';
import PageHeader from '../../components/common/PageHeader';
import ErrorAlert from '../../components/common/ErrorAlert';
import apiClient from '../../lib/apiClient';
import { usePolizaForm } from './hooks/usePolizaForm';
import type { Aseguradora, PolicyType } from '../../types';

const TIPOS: PolicyType[] = ['AUTO', 'HOGAR', 'VIDA', 'OTRA'];
const TIPO_LABELS: Record<PolicyType, string> = {
  AUTO: 'Auto',
  HOGAR: 'Hogar',
  VIDA: 'Vida',
  OTRA: 'Otra',
};

export default function PolizaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const clienteId = id ? Number(id) : 0;

  const aseguradorasQuery = useQuery({
    queryKey: ['aseguradoras'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ aseguradoras: Aseguradora[] }>('/aseguradoras');
      return data.aseguradoras;
    },
  });

  const { form, submit, isSubmitting, error } = usePolizaForm({ clienteId });

  return (
    <Box>
      <PageHeader
        title="Nueva póliza"
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: 'Detalle cliente', href: `/clientes/${clienteId}` },
          { label: 'Nueva póliza' },
        ]}
        actions={
          <Button variant="outlined" onClick={() => navigate(`/clientes/${clienteId}`)}>
            Cancelar
          </Button>
        }
      />

      <ErrorAlert error={error ?? null} />

      <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Datos de la póliza
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Aseguradora"
                select
                fullWidth
                defaultValue=""
                {...form.register('aseguradoraId', { valueAsNumber: true })}
                error={Boolean(form.formState.errors.aseguradoraId)}
                helperText={form.formState.errors.aseguradoraId?.message}
              >
                {(aseguradorasQuery.data ?? []).map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.razonSocial}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Número de póliza"
                fullWidth
                {...form.register('numeroPoliza')}
                error={Boolean(form.formState.errors.numeroPoliza)}
                helperText={form.formState.errors.numeroPoliza?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Tipo de póliza"
                select
                fullWidth
                defaultValue="AUTO"
                {...form.register('tipo')}
                error={Boolean(form.formState.errors.tipo)}
                helperText={form.formState.errors.tipo?.message}
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {TIPO_LABELS[t]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Fecha de expedición"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                {...form.register('fechaExpedicion')}
                error={Boolean(form.formState.errors.fechaExpedicion)}
                helperText={form.formState.errors.fechaExpedicion?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Inicio de vigencia"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                {...form.register('fechaInicioVig')}
                error={Boolean(form.formState.errors.fechaInicioVig)}
                helperText={form.formState.errors.fechaInicioVig?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Fin de vigencia"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                {...form.register('fechaFinVig')}
                error={Boolean(form.formState.errors.fechaFinVig)}
                helperText={form.formState.errors.fechaFinVig?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notas"
                multiline
                rows={3}
                fullWidth
                {...form.register('notas')}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate(`/clientes/${clienteId}`)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Registrar póliza
            </LoadingButton>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
