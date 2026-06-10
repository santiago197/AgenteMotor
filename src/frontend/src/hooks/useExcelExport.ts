import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

interface ExcelExportOptions {
  url: string;
  filename?: string;
}

export function useExcelExport({ url, filename = 'export.xlsx' }: ExcelExportOptions) {
  const mutation = useMutation({
    mutationFn: async (filters: Record<string, unknown>) => {
      const response = await apiClient.post(url, filters, {
        responseType: 'blob',
      });
      return response.data as Blob;
    },
    onSuccess: (blob) => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    },
  });

  return {
    exportToExcel: mutation.mutate,
    isExporting: mutation.isPending,
  };
}
