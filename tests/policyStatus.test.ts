import { describe, expect, it } from 'vitest';
import { calculatePolicyStatus } from '../src/services/policyStatus.js';

describe('calcularEstadoPoliza()', () => {
  it('retorna VIGENTE si vence en más de 30 días', () => {
    const target = new Date();
    target.setDate(target.getDate() + 40);
    expect(calculatePolicyStatus(target.toISOString())).toBe('VIGENTE');
  });

  it('retorna PROXIMA_VENCER si vence en 1-30 días', () => {
    const target = new Date();
    target.setDate(target.getDate() + 10);
    expect(calculatePolicyStatus(target.toISOString())).toBe('PROXIMA_VENCER');
  });

  it('retorna VENCIDA_CRITICA si vencida hace 25 días', () => {
    const target = new Date();
    target.setDate(target.getDate() - 25);
    expect(calculatePolicyStatus(target.toISOString())).toBe('VENCIDA_CRITICA');
  });

  it('retorna VENCIDA_PERDIDA si vencida hace más de 30 días', () => {
    const target = new Date();
    target.setDate(target.getDate() - 31);
    expect(calculatePolicyStatus(target.toISOString())).toBe('VENCIDA_PERDIDA');
  });
});
