import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  children: ReactNode;
}

export default function FilterDrawer({ open, onClose, onApply, onClear, children }: FilterDrawerProps) {
  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 320, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filtros
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Cerrar filtros">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
        {children}
      </Box>

      <Divider />

      {/* Sticky footer */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          px: 2,
          py: 2,
        }}
      >
        <Button variant="outlined" fullWidth onClick={onClear}>
          Limpiar
        </Button>
        <Button variant="contained" fullWidth onClick={handleApply}>
          Aplicar
        </Button>
      </Box>
    </Drawer>
  );
}
