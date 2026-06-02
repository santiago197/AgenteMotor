import { useForm, Controller } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import AutoRenewIcon from '@mui/icons-material/AutoRenew';
import type { RenovarFormData } from '../types';

interface RenovarDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: RenovarFormData) => void;
  loading: boolean;
}

export default function RenovarDialog({ open, onClose, onConfirm, loading }: RenovarDialogProps) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<RenovarFormData>({
    defaultValues: {
      fechaInicioVig: '',
      fechaFinVig: '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: RenovarFormData) => {
    onConfirm(data);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1}>
          <AutoRenewIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Renovar Póliza
          </Typography>
        </Stack>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa las nuevas fechas de vigencia para la renovación de esta póliza.
          </Typography>
          <Stack spacing={3}>
            <Controller
              name="fechaInicioVig"
              control={control}
              rules={{ required: 'Fecha de inicio es obligatoria' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Inicio de vigencia"
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.fechaInicioVig}
                  helperText={errors.fechaInicioVig?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="fechaFinVig"
              control={control}
              rules={{ required: 'Fecha de fin es obligatoria' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Fin de vigencia"
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.fechaFinVig}
                  helperText={errors.fechaFinVig?.message}
                  fullWidth
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} variant="outlined" disabled={loading}>
            Cancelar
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
            startIcon={<AutoRenewIcon />}
          >
            Renovar
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
