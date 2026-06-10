export interface Aseguradora {
  id: number;
  razonSocial: string;
  nit: string;
  telefono: string | null;
  email: string | null;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  data: T[];
}

export interface ApiError {
  message: string;
  details?: string;
}

export interface FilterFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
}
