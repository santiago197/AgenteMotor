export type PolicyStatus = 'VIGENTE' | 'PROXIMA_VENCER' | 'VENCIDA_RENOVABLE' | 'VENCIDA_CRITICA' | 'VENCIDA_PERDIDA';

export function calculatePolicyStatus(fechaFinVig: string, reference = new Date()): PolicyStatus {
  const endDate = new Date(fechaFinVig);
  const delta = Math.floor((reference.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

  if (delta < -30) {
    return 'VIGENTE';
  }

  if (delta <= 0) {
    return 'PROXIMA_VENCER';
  }

  if (delta <= 20) {
    return 'VENCIDA_RENOVABLE';
  }

  if (delta <= 30) {
    return 'VENCIDA_CRITICA';
  }

  return 'VENCIDA_PERDIDA';
}

export function normalizeDate(date: string | Date): string {
  return new Date(date).toISOString().slice(0, 10);
}
