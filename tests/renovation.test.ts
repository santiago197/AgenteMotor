import { describe, expect, it } from 'vitest';
import { calculatePolicyStatus } from '../src/services/policyStatus.js';

describe('Renovación de póliza', () => {
  it('trata como RENOVACION cuando la póliza venció hace menos de 30 días', () => {
    const fechaFinVig = new Date();
    fechaFinVig.setDate(fechaFinVig.getDate() - 10);
    const status = calculatePolicyStatus(fechaFinVig.toISOString());
    expect(status).toBe('VENCIDA_RENOVABLE');
  });

  it('trata como NUEVA_CONTRATACION cuando la póliza venció hace más de 30 días', () => {
    const fechaFinVig = new Date();
    fechaFinVig.setDate(fechaFinVig.getDate() - 31);
    const status = calculatePolicyStatus(fechaFinVig.toISOString());
    expect(status).toBe('VENCIDA_PERDIDA');
  });
});
