import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  severity?: 'error' | 'warning' | 'info';
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  severity = 'warning',
}: ConfirmDialogProps) {
  const colorMap = {
    error: 'error' as const,
    warning: 'warning' as const,
    info: 'primary' as const,
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" disabled={loading}>
          {cancelLabel}
        </Button>
        <LoadingButton
          onClick={onConfirm}
          variant="contained"
          color={colorMap[severity]}
          loading={loading}
        >
          {confirmLabel}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
