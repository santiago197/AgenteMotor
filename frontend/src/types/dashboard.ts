import type { Poliza, PolicyStatus } from './poliza';

export type DashboardCounts = Partial<Record<PolicyStatus, number>>;

export interface DashboardSearchParams {
  estado?: PolicyStatus;
  tipo?: string;
  numeroPoliza?: string;
  documento?: string;
  nombre?: string;
  page?: number;
  pageSize?: number;
}

export interface DashboardResponse {
  page: number;
  pageSize: number;
  total: number;
  dashboard: DashboardCounts;
  polizas: Poliza[];
}
