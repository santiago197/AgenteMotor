import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { useClienteForm } from './hooks/useClienteForm';
import { useClienteDetalle } from './hooks/useClienteDetalle';
import type { TipoDocumento, EstadoGestion } from '../../types';

const TIPO_DOCS: TipoDocumento[] = ['CC', 'NIT', 'CE'];
const ESTADOS: EstadoGestion[] = ['SIN_CONTACTO', 'COTIZACION', 'POLIZA_CONTRATADA', 'NO_VIGENTE', 'GESTIONADO'];

export default function ClienteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const clienteId = id ? Number(id) : undefined;
  const isEditing = Boolean(clienteId);
  const { cliente, isLoading: isLoadingCliente, error: clienteError } = useClienteDetalle(clienteId);
  const { form, submit, isSubmitting, error } = useClienteForm({ editingCliente: cliente });

  const title = useMemo(
    () => (isEditing ? 'Editar cliente' : 'Crear cliente'),
    [isEditing]
  );

  return (
    <Box>
      <PageHeader
        title={title}
        breadcrumbs={
          isEditing
            ? [
              { label: 'Clientes', href: '/clientes' },
              { label: cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'Cargando...' },
            ]
            : [{ label: 'Clientes', href: '/clientes' }, { label: 'Nuevo cliente' }]
        }
        actions={
          <Button variant="outlined" onClick={() => navigate('/clientes')}>
            Volver a clientes
          </Button>
        }
      />

      <ErrorAlert error={clienteError ?? error ?? null} />
      <LoadingOverlay open={isEditing && isLoadingCliente} message="Cargando cliente..." />

      <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Información básica
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nombres"
                fullWidth
                {...form.register('nombres')}
                error={Boolean(form.formState.errors.nombres)}
                helperText={form.formState.errors.nombres?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Apellidos"
                fullWidth
                {...form.register('apellidos')}
                error={Boolean(form.formState.errors.apellidos)}
                helperText={form.formState.errors.apellidos?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Tipo de documento"
                select
                fullWidth
                defaultValue="CC"
                {...form.register('tipoDoc')}
                error={Boolean(form.formState.errors.tipoDoc)}
                helperText={form.formState.errors.tipoDoc?.message}
              >
                {TIPO_DOCS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Documento"
                fullWidth
                {...form.register('documento')}
                error={Boolean(form.formState.errors.documento)}
                helperText={form.formState.errors.documento?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Estado de gestión"
                select
                fullWidth
                defaultValue="SIN_CONTACTO"
                {...form.register('estadoGestion')}
                error={Boolean(form.formState.errors.estadoGestion)}
                helperText={form.formState.errors.estadoGestion?.message}
              >
                {ESTADOS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replace('_', ' ').toLowerCase().replace(/\b\w/g, (chr) => chr.toUpperCase())}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Celular"
                fullWidth
                {...form.register('celular')}
                error={Boolean(form.formState.errors.celular)}
                helperText={form.formState.errors.celular?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email"
                fullWidth
                {...form.register('email')}
                error={Boolean(form.formState.errors.email)}
                helperText={form.formState.errors.email?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Teléfono"
                fullWidth
                {...form.register('telefono')}
                error={Boolean(form.formState.errors.telefono)}
                helperText={form.formState.errors.telefono?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Fecha de nacimiento"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                {...form.register('fechaNacimiento')}
                error={Boolean(form.formState.errors.fechaNacimiento)}
                helperText={form.formState.errors.fechaNacimiento?.message}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/clientes')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {isEditing ? 'Actualizar cliente' : 'Crear cliente'}
            </LoadingButton>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
