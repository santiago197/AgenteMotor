import { useState } from 'react';
import apiClient from '../../../lib/apiClient';

export function useClientesListPage() {
  const [importModalOpen, setImportModalOpen] = useState(false);

  const downloadTemplate = async () => {
    const response = await apiClient.get('/clientes/template', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-clientes.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    importModalOpen,
    openImportModal: () => setImportModalOpen(true),
    closeImportModal: () => setImportModalOpen(false),
    downloadTemplate,
  };
}
