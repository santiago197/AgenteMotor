/**
 * reseed.ts — Limpia todas las tablas y re-siembra la base de datos.
 * Uso: npm run reseed
 */
import Database from 'better-sqlite3';
import { config } from '../config.js';
import { seedDatabase } from '../services/seed.js';

const db = new Database(config.databaseFile);

// Borrar en orden: hijos antes que padres (respetar FK)
const TRUNCATE_ORDER = [
  'refresh_tokens',
  'logs',
  'poliza_historial',
  'polizas',
  'asesor_aseguradoras',
  'clientes',
  'aseguradora_ramas',
  'usuarios',
  'aseguradoras',
];

db.transaction(() => {
  db.prepare('PRAGMA foreign_keys = OFF').run();
  for (const table of TRUNCATE_ORDER) {
    db.prepare(`DELETE FROM ${table}`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = '${table}'`).run();
  }
  db.prepare('PRAGMA foreign_keys = ON').run();
})();

console.log('Tablas limpiadas. Sembrando datos...');
seedDatabase(db);
console.log('✓ Reseed completado.');
db.close();
