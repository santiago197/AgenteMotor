export type PolicyStatus =
  | 'VIGENTE'
  | 'PROXIMA_VENCER'
  | 'VENCIDA_RENOVABLE'
  | 'VENCIDA_CRITICA'
  | 'VENCIDA_PERDIDA';

export type PolicyType = 'AUTO' | 'HOGAR' | 'VIDA' | 'OTRA';

export type TipoContratacion = 'NUEVA_CONTRATACION' | 'RENOVACION';

export interface Poliza {
  id: number;
  clienteId: number;
  asesorId: number;
  aseguradoraId: number;
  numeroPoliza: string;
  tipo: PolicyType;
  fechaExpedicion: string;
  fechaInicioVig: string;
  fechaFinVig: string;
  fechaRenovacion: string | null;
  estado: PolicyStatus;
  tipoContratacion: TipoContratacion;
  notas: string | null;
  createdAt: string;
  // Joined fields from dashboard
  clienteNombres?: string;
  clienteApellidos?: string;
}

export interface PolizaFormData {
  clienteId: number;
  aseguradoraId: number;
  numeroPoliza: string;
  tipo: PolicyType;
  fechaExpedicion: string;
  fechaInicioVig: string;
  fechaFinVig: string;
  notas?: string;
}

export interface PolizaHistorial {
  id: number;
  polizaId: number;
  tipo: TipoContratacion;
  fechaInicioVig: string;
  fechaFinVig: string;
  creadoEn: string;
}

export interface PolizaDetalleResponse {
  poliza: Poliza;
  historial: PolizaHistorial[];
}

export interface PolizaSearchResponse {
  page: number;
  pageSize: number;
  total: number;
  polizas: Poliza[];
}

export interface RenovarFormData {
  fechaInicioVig: string;
  fechaFinVig: string;
}

export interface RenovarResponse {
  success: boolean;
  tipoContratacion: TipoContratacion;
  estado: PolicyStatus;
}

export interface LogEntry {
  id: number;
  polizaId: number | null;
  clienteId: number | null;
  asesorId: number;
  accion: string;
  notas: string | null;
  fecha: string;
}

export interface LogFormData {
  accion: string;
  notas?: string;
}
