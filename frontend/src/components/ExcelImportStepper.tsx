import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoadingButton from '@mui/lab/LoadingButton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import type { ImportResponse } from '../types';

interface ExcelImportStepperProps {
  onComplete: () => void;
}

const STEPS = ['Subir archivo', 'Validar datos', 'Resultado'];

export default function ExcelImportStepper({ onComplete }: ExcelImportStepperProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post<ImportResponse>('/clientes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveStep(2);
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setActiveStep(1);
    }
  }, []);

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  const importedCount = result?.summary.filter((r) => r.status === 'imported').length ?? 0;
  const rejectedCount = result?.summary.filter((r) => r.status === 'rejected').length ?? 0;

  return (
    <Box>
      <Stepper
        activeStep={activeStep}
        sx={{
          mb: 4,
          '& .MuiStepIcon-root.Mui-completed': { color: 'success.main' },
          '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
        }}
      >
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 0: Upload */}
      {activeStep === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.7 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Sube tu archivo Excel
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Formato .xlsx con columnas: nombres, apellidos, tipoDoc, documento, celular, email
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
          >
            Seleccionar archivo
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
            />
          </Button>
        </Box>
      )}

      {/* Step 1: Validate & Confirm */}
      {activeStep === 1 && file && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
          </Alert>
          {uploadMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error al importar: {(uploadMutation.error as Error)?.message}
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => { setFile(null); setActiveStep(0); }}
            >
              Cambiar archivo
            </Button>
            <LoadingButton
              variant="contained"
              loading={uploadMutation.isPending}
              onClick={handleUpload}
              startIcon={<CloudUploadIcon />}
            >
              Importar
            </LoadingButton>
          </Box>
        </Box>
      )}

      {/* Step 2: Results */}
      {activeStep === 2 && result && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Alert severity="success" sx={{ flex: 1 }}>
              <strong>{importedCount}</strong> clientes importados correctamente
            </Alert>
            {rejectedCount > 0 && (
              <Alert severity="warning" sx={{ flex: 1 }}>
                <strong>{rejectedCount}</strong> registros rechazados
              </Alert>
            )}
          </Box>

          {rejectedCount > 0 && (
            <TableContainer component={Paper} sx={{ mb: 3, backgroundColor: 'rgba(17,24,39,0.6)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Estado</TableCell>
                    <TableCell>Datos</TableCell>
                    <TableCell>Razón</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.summary
                    .filter((r) => r.status === 'rejected')
                    .map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Chip label="Rechazado" color="error" size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {String(row.row?.nombres ?? '')} {String(row.row?.apellidos ?? '')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.light">
                            {row.reason}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={onComplete}
            >
              Finalizar
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
