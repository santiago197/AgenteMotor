export type TipoDocumento = 'CC' | 'NIT' | 'CE';

export type EstadoGestion =
  | 'COTIZACION'
  | 'POLIZA_CONTRATADA'
  | 'NO_VIGENTE'
  | 'SIN_CONTACTO'
  | 'GESTIONADO';

export interface Cliente {
  id: number;
  asesorId: number;
  nombres: string;
  apellidos: string;
  tipoDoc: TipoDocumento;
  documento: string;
  celular: string | null;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  estadoGestion: EstadoGestion;
  createdAt: string;
}

export interface ClienteFormData {
  nombres: string;
  apellidos: string;
  tipoDoc: TipoDocumento;
  documento: string;
  celular?: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  estadoGestion?: EstadoGestion;
}

export interface ClienteDetalleResponse {
  cliente: Cliente;
  polizas: import('./poliza').Poliza[];
  logs: import('./poliza').LogEntry[];
}

export interface ClienteListResponse {
  clientes: Cliente[];
}

export interface ImportSummaryRow {
  row: Record<string, unknown>;
  status: 'imported' | 'rejected';
  reason?: string;
}

export interface ImportResponse {
  summary: ImportSummaryRow[];
}
