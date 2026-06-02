import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { normalizeDate, calculatePolicyStatus } from './policyStatus.js';

function accountExists(db: Database.Database): boolean {
  return Boolean(db.prepare('SELECT 1 FROM usuarios LIMIT 1').get());
}

export function seedDatabase(db: Database.Database): void {
  if (accountExists(db)) {
    return;
  }

  const insertAseguradora = db.prepare(
    'INSERT INTO aseguradoras (razonSocial, nit, telefono, email) VALUES (?, ?, ?, ?)'
  );
  const insertRama = db.prepare('INSERT INTO aseguradora_ramas (aseguradoraId, rama) VALUES (?, ?)');
  const insertUser = db.prepare(
    'INSERT INTO usuarios (nombres, apellidos, email, passwordHash, rol) VALUES (?, ?, ?, ?, ?)'
  );
  const insertAsesorAseg = db.prepare(
    'INSERT INTO asesor_aseguradoras (usuarioId, aseguradoraId, codigo) VALUES (?, ?, ?)'
  );
  const insertCliente = db.prepare(
    'INSERT INTO clientes (asesorId, nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertPoliza = db.prepare(
    'INSERT INTO polizas (clienteId, asesorId, aseguradoraId, numeroPoliza, tipo, fechaExpedicion, fechaInicioVig, fechaFinVig, estado, tipoContratacion, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertHistorial = db.prepare(
    'INSERT INTO poliza_historial (polizaId, tipo, fechaInicioVig, fechaFinVig) VALUES (?, ?, ?, ?)'
  );

  const [suraId] = [insertAseguradora.run('Sura', '900123456-7', '+57 1 2345678', 'contacto@sura.com').lastInsertRowid];
  const [hdiId] = [insertAseguradora.run('HDI Seguros', '900987654-3', '+57 1 8765432', 'info@hdi.com').lastInsertRowid];
  const [axaId] = [insertAseguradora.run('AXA Colpatria', '900112233-5', '+57 1 4455667', 'soporte@axa.com').lastInsertRowid];

  ['AUTO', 'HOGAR', 'VIDA'].forEach((rama) => insertRama.run(suraId, rama));
  ['HOGAR', 'VIDA'].forEach((rama) => insertRama.run(hdiId, rama));
  ['VIDA', 'AUTO', 'HOGAR'].forEach((rama) => insertRama.run(axaId, rama));

  const adminHash = bcrypt.hashSync('Admin123!', 12);
  const asesorHash = bcrypt.hashSync('Asesor123!', 12);

  const adminId = insertUser.run('Administrador', 'Agentemotor', 'admin@agentemotor.com', adminHash, 'ADMIN').lastInsertRowid as number;
  const asesorId = insertUser.run('Andrea', 'Vargas', 'andrea@agentemotor.com', asesorHash, 'ASESOR').lastInsertRowid as number;

  insertAsesorAseg.run(asesorId, suraId, 'ASA-SURA-001');
  insertAsesorAseg.run(asesorId, hdiId, 'ASA-HDI-007');

  const clients = [
    ['Carlos', 'Lopez', 'CC', '100200300', '+57 3001234567', 'carlos.lopez@example.com', '+57 1 2345678', '1988-03-12', 'POLIZA_CONTRATADA'],
    ['Valeria', 'Mendoza', 'CC', '100200301', '+57 3009876543', 'valeria.mendoza@example.com', '+57 1 8765432', '1991-10-25', 'SIN_CONTACTO'],
    ['Felipe', 'Martinez', 'CC', '100200302', '+57 3005551234', 'felipe.martinez@example.com', '+57 1 4433221', '1979-12-05', 'COTIZACION']
  ];

  const clientIds: number[] = [];

  for (const client of clients) {
    const result = insertCliente.run(asesorId, ...client);
    clientIds.push(result.lastInsertRowid as number);
  }

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const policyData = [
    [clientIds[0], suraId, 'AA-001-2026', 'AUTO', addDays(-90), addDays(-90), addDays(-1), 'Poliza auto por vencer', 'NUEVA_CONTRATACION'],
    [clientIds[0], hdiId, 'HH-001-2026', 'HOGAR', addDays(-45), addDays(-45), addDays(25), 'Poliza hogar con buen margen', 'NUEVA_CONTRATACION'],
    [clientIds[1], axaId, 'VV-001-2026', 'VIDA', addDays(-400), addDays(-365), addDays(-5), 'Poliza vida reciente', 'RENOVACION']
  ];

  for (const [clienteId, aseguradoraId, numeroPoliza, tipo, expedicion, inicio, fin, notas, tipoContratacion] of policyData) {
    const estado = calculatePolicyStatus(normalizeDate(fin));
    const result = insertPoliza.run(
      clienteId,
      asesorId,
      aseguradoraId,
      numeroPoliza,
      tipo,
      normalizeDate(expedicion),
      normalizeDate(inicio),
      normalizeDate(fin),
      estado,
      tipoContratacion,
      notas
    );
    insertHistorial.run(result.lastInsertRowid as number, tipoContratacion, normalizeDate(inicio), normalizeDate(fin));
  }
}
