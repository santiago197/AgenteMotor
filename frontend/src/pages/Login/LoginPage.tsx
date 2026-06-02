import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { LoginRequest } from '../../types';
import { useLogin } from './hooks/useLogin';
import { useAuthStore } from '../../store/authStore';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { login, isLoading, error } = useLogin();

  const { register, handleSubmit, formState } = useForm<LoginRequest>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginRequest) => {
    login(data);
  };

  const title = useMemo(() => 'Agentemotor', []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: 'radial-gradient(circle at top, rgba(108, 99, 255, 0.2), transparent 40%), linear-gradient(180deg, #060B18 0%, #0A0E1A 100%)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 520,
          p: 4,
          borderRadius: 4,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.2), rgba(0, 217, 255, 0.2))',
              }}
            >
              <LockOutlinedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accede a tu panel de gestión de pólizas.
              </Typography>
            </Box>
          </Box>

          <ErrorAlert error={error ?? null} />

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Correo electrónico"
              type="email"
              {...register('email', { required: 'Email es obligatorio' })}
              error={Boolean(formState.errors.email)}
              helperText={formState.errors.email?.message}
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              {...register('password', { required: 'Contraseña es obligatoria' })}
              error={Boolean(formState.errors.password)}
              helperText={formState.errors.password?.message}
              fullWidth
            />

            <Button type="submit" variant="contained" size="large" disabled={isLoading}>
              Ingresar
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
