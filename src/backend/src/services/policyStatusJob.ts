import cron from 'node-cron';
import db from '../db.js';
import { calculatePolicyStatus } from './policyStatus.js';

export function scheduleDailyPolicyStatusUpdate(): void {
  cron.schedule('0 6 * * *', () => {
    const polizas = db.prepare('SELECT id, fechaFinVig FROM polizas').all();
    const update = db.prepare('UPDATE polizas SET estado = ? WHERE id = ?');
    const transaction = db.transaction((rows: Array<{ id: number; fechaFinVig: string }>) => {
      for (const row of rows) {
        const estado = calculatePolicyStatus(row.fechaFinVig);
        update.run(estado, row.id);
      }
    });
    transaction(polizas);
  }, { scheduled: true, timezone: 'America/Bogota' });
}
