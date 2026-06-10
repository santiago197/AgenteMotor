import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import type { AxiosError } from 'axios';
import type { ApiError } from '../../types';

interface ErrorAlertProps {
  error: Error | AxiosError | null;
  onClose?: () => void;
}

export default function ErrorAlert({ error, onClose }: ErrorAlertProps) {
  if (!error) return null;

  const axiosError = error as AxiosError<ApiError>;
  const message =
    axiosError.response?.data?.message ??
    axiosError.message ??
    'Ha ocurrido un error inesperado';

  return (
    <Collapse in={!!error}>
      <Alert
        severity="error"
        onClose={onClose}
        sx={{
          mb: 2,
          backgroundColor: 'rgba(244, 67, 54, 0.08)',
          border: '1px solid rgba(244, 67, 54, 0.2)',
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
        {message}
      </Alert>
    </Collapse>
  );
}
