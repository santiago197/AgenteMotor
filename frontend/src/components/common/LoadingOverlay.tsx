import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

export default function LoadingOverlay({ open, message = 'Cargando...' }: LoadingOverlayProps) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Stack sx={{ alignItems: 'center' }} spacing={2}>
        <CircularProgress color="primary" size={48} thickness={3} />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Stack>
    </Backdrop>
  );
}
