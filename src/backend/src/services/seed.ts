import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { normalizeDate, calculatePolicyStatus } from './policyStatus.js';

function accountExists(db: Database.Database): boolean {
  return Boolean(db.prepare('SELECT 1 FROM usuarios LIMIT 1').get());
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function randomPlate(seed: number): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const l = (n: number) => letters[n % letters.length];
  return `${l(seed)}${l(seed + 3)}${l(seed + 7)}-${(seed % 10)}${((seed + 1) % 10)}${((seed + 3) % 10)}`;
}

const VEHICLES = [
  { marca: 'Renault', modelo: 'Sandero', cilindraje: '1600cc', year: 2020 },
  { marca: 'Chevrolet', modelo: 'Spark GT', cilindraje: '1200cc', year: 2019 },
  { marca: 'Mazda', modelo: '3', cilindraje: '2000cc', year: 2021 },
  { marca: 'Toyota', modelo: 'Corolla', cilindraje: '1800cc', year: 2022 },
  { marca: 'Kia', modelo: 'Picanto', cilindraje: '1000cc', year: 2021 },
  { marca: 'Hyundai', modelo: 'Tucson', cilindraje: '2000cc', year: 2019 },
  { marca: 'Ford', modelo: 'EcoSport', cilindraje: '1500cc', year: 2020 },
  { marca: 'Chevrolet', modelo: 'Onix', cilindraje: '1000cc', year: 2023 },
  { marca: 'Renault', modelo: 'Duster', cilindraje: '1600cc', year: 2018 },
  { marca: 'Mazda', modelo: 'CX-5', cilindraje: '2500cc', year: 2022 },
];

function autoNotas(idx: number): string {
  const v = VEHICLES[idx % VEHICLES.length];
  return `placa: ${randomPlate(idx * 7 + 3)} | marca: ${v.marca} | modelo: ${v.modelo} | año: ${v.year} | cilindraje: ${v.cilindraje}`;
}

type PolicyDef = [number, number, 'AUTO' | 'HOGAR' | 'VIDA' | 'OTRA', 'NUEVA_CONTRATACION' | 'RENOVACION', number, number];

const POLICY_DEFS: PolicyDef[] = [
  // VIGENTE (12 AUTO) — finVig in +60 to +180 days
  [60,  -305, 'AUTO', 'NUEVA_CONTRATACION', 0, 0],
  [75,  -290, 'AUTO', 'RENOVACION',         1, 1],
  [90,  -275, 'AUTO', 'NUEVA_CONTRATACION', 2, 2],
  [100, -265, 'AUTO', 'RENOVACION',         3, 0],
  [120, -245, 'AUTO', 'NUEVA_CONTRATACION', 4, 1],
  [130, -235, 'AUTO', 'RENOVACION',         5, 2],
  [145, -220, 'AUTO', 'NUEVA_CONTRATACION', 6, 0],
  [150, -215, 'AUTO', 'RENOVACION',         7, 1],
  [160, -205, 'AUTO', 'NUEVA_CONTRATACION', 8, 2],
  [165, -200, 'AUTO', 'RENOVACION',         9, 0],
  [170, -195, 'AUTO', 'NUEVA_CONTRATACION', 0, 1],
  [180, -185, 'AUTO', 'RENOVACION',         1, 2],
  // PROXIMA_VENCER (10 AUTO) — finVig in +1 to +29 days
  [1,  -364, 'AUTO', 'NUEVA_CONTRATACION', 2, 0],
  [5,  -360, 'AUTO', 'RENOVACION',         3, 1],
  [10, -355, 'AUTO', 'NUEVA_CONTRATACION', 4, 2],
  [14, -351, 'AUTO', 'RENOVACION',         5, 0],
  [18, -347, 'AUTO', 'NUEVA_CONTRATACION', 6, 1],
  [21, -344, 'AUTO', 'RENOVACION',         7, 2],
  [24, -341, 'AUTO', 'NUEVA_CONTRATACION', 8, 0],
  [26, -339, 'AUTO', 'RENOVACION',         9, 1],
  [28, -337, 'AUTO', 'NUEVA_CONTRATACION', 0, 2],
  [29, -336, 'AUTO', 'RENOVACION',         1, 0],
  // VENCIDA_RENOVABLE (8 AUTO) — finVig in -1 to -20 days
  [-1,  -366, 'AUTO', 'RENOVACION',         2, 1],
  [-5,  -370, 'AUTO', 'NUEVA_CONTRATACION', 3, 2],
  [-10, -375, 'AUTO', 'RENOVACION',         4, 0],
  [-12, -377, 'AUTO', 'NUEVA_CONTRATACION', 5, 1],
  [-15, -380, 'AUTO', 'RENOVACION',         6, 2],
  [-17, -382, 'AUTO', 'NUEVA_CONTRATACION', 7, 0],
  [-19, -384, 'AUTO', 'RENOVACION',         8, 1],
  [-20, -385, 'AUTO', 'NUEVA_CONTRATACION', 9, 2],
  // VENCIDA_CRITICA (8 AUTO) — finVig in -21 to -30 days
  [-21, -386, 'AUTO', 'RENOVACION',         0, 0],
  [-23, -388, 'AUTO', 'NUEVA_CONTRATACION', 1, 1],
  [-25, -390, 'AUTO', 'RENOVACION',         2, 2],
  [-26, -391, 'AUTO', 'NUEVA_CONTRATACION', 3, 0],
  [-27, -392, 'AUTO', 'RENOVACION',         4, 1],
  [-28, -393, 'AUTO', 'NUEVA_CONTRATACION', 5, 2],
  [-29, -394, 'AUTO', 'RENOVACION',         6, 0],
  [-30, -395, 'AUTO', 'NUEVA_CONTRATACION', 7, 1],
  // VENCIDA_PERDIDA (7 AUTO) — finVig in -31 to -90 days
  [-31, -396, 'AUTO', 'RENOVACION',         8, 2],
  [-40, -405, 'AUTO', 'NUEVA_CONTRATACION', 9, 0],
  [-50, -415, 'AUTO', 'RENOVACION',         0, 1],
  [-60, -425, 'AUTO', 'NUEVA_CONTRATACION', 1, 2],
  [-70, -435, 'AUTO', 'RENOVACION',         2, 0],
  [-80, -445, 'AUTO', 'NUEVA_CONTRATACION', 3, 1],
  [-90, -455, 'AUTO', 'RENOVACION',         4, 2],
  // OTHER TYPES (10: HOGAR/VIDA/OTRA)
  [45,  -320, 'HOGAR', 'NUEVA_CONTRATACION', 5, 0],
  [80,  -285, 'HOGAR', 'RENOVACION',         6, 1],
  [120, -245, 'VIDA',  'NUEVA_CONTRATACION', 7, 2],
  [15,  -350, 'VIDA',  'RENOVACION',         8, 0],
  [-5,  -370, 'VIDA',  'NUEVA_CONTRATACION', 9, 1],
  [-35, -400, 'HOGAR', 'RENOVACION',         0, 2],
  [5,   -360, 'OTRA',  'NUEVA_CONTRATACION', 1, 0],
  [-25, -390, 'OTRA',  'RENOVACION',         2, 1],
  [100, -265, 'HOGAR', 'NUEVA_CONTRATACION', 3, 2],
  [-55, -420, 'VIDA',  'RENOVACION',         4, 0],
];

export function seedDatabase(db: Database.Database): void {
  if (accountExists(db)) return;

  const insertAseguradora = db.prepare('INSERT INTO aseguradoras (razonSocial, nit, telefono, email) VALUES (?, ?, ?, ?)');
  const insertRama       = db.prepare('INSERT INTO aseguradora_ramas (aseguradoraId, rama) VALUES (?, ?)');
  const insertUser       = db.prepare('INSERT INTO usuarios (nombres, apellidos, email, passwordHash, rol) VALUES (?, ?, ?, ?, ?)');
  const insertAsesorAseg = db.prepare('INSERT INTO asesor_aseguradoras (usuarioId, aseguradoraId, codigo) VALUES (?, ?, ?)');
  const insertCliente    = db.prepare('INSERT INTO clientes (asesorId, nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertPoliza     = db.prepare('INSERT INTO polizas (clienteId, asesorId, aseguradoraId, numeroPoliza, tipo, fechaExpedicion, fechaInicioVig, fechaFinVig, estado, tipoContratacion, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertHistorial  = db.prepare('INSERT INTO poliza_historial (polizaId, tipo, fechaInicioVig, fechaFinVig) VALUES (?, ?, ?, ?)');

  const suraId = insertAseguradora.run('Sura', '900123456-7', '+57 1 2345678', 'contacto@sura.com').lastInsertRowid as number;
  const hdiId  = insertAseguradora.run('HDI Seguros', '900987654-3', '+57 1 8765432', 'info@hdi.com').lastInsertRowid as number;
  const axaId  = insertAseguradora.run('AXA Colpatria', '900112233-5', '+57 1 4455667', 'soporte@axa.com').lastInsertRowid as number;
  const asegIds = [suraId, hdiId, axaId];

  ['AUTO', 'HOGAR', 'VIDA'].forEach((r) => insertRama.run(suraId, r));
  ['HOGAR', 'VIDA', 'AUTO'].forEach((r) => insertRama.run(hdiId, r));
  ['VIDA', 'AUTO', 'HOGAR'].forEach((r) => insertRama.run(axaId, r));

  const adminHash  = bcrypt.hashSync('Admin123!', 12);
  const asesorHash = bcrypt.hashSync('Asesor123!', 12);

  insertUser.run('Administrador', 'Agentemotor', 'admin@agentemotor.com', adminHash, 'ADMIN');
  const asesorId = insertUser.run('Andrea', 'Vargas', 'andrea@agentemotor.com', asesorHash, 'ASESOR').lastInsertRowid as number;

  insertAsesorAseg.run(asesorId, suraId, 'ASA-SURA-001');
  insertAsesorAseg.run(asesorId, hdiId,  'ASA-HDI-007');
  insertAsesorAseg.run(asesorId, axaId,  'ASA-AXA-003');

  const CLIENTS: [string, string, string, string, string, string, string, string, string][] = [
    ['Carlos',    'Ramírez Torres',   'CC',  '1020304050', '+573001234567', 'carlos.ramirez@email.com',   '+5712345678', '1985-03-15', 'POLIZA_CONTRATADA'],
    ['María',     'González Pérez',   'CC',  '1030405060', '+573109876543', 'maria.gonzalez@email.com',   '+5719876543', '1990-07-22', 'POLIZA_CONTRATADA'],
    ['Juan',      'Martínez López',   'CC',  '1040506070', '+573201112233', 'juan.martinez@email.com',    '',            '1978-11-30', 'COTIZACION'],
    ['Ana',       'Rodríguez Vargas', 'CC',  '1050607080', '+573154445566', 'ana.rodriguez@email.com',    '+5713456789', '1995-01-08', 'POLIZA_CONTRATADA'],
    ['Pedro',     'Hernández Ruiz',   'CC',  '1060708090', '+573007778899', 'pedro.hernandez@email.com',  '',            '1982-06-14', 'NO_VIGENTE'],
    ['Luisa',     'Castro Moreno',    'CC',  '1070809010', '+573122223333', 'luisa.castro@email.com',     '+5716677889', '1993-09-25', 'POLIZA_CONTRATADA'],
    ['Santiago',  'Díaz Ospina',      'CC',  '1080900110', '+573185556677', 'santiago.diaz@email.com',    '',            '1988-04-03', 'GESTIONADO'],
    ['Valentina', 'Torres Quintero',  'CC',  '1090011020', '+573218889900', 'valentina.torres@email.com', '+5714455667', '1997-12-18', 'POLIZA_CONTRATADA'],
    ['Andrés',    'López Ávila',      'CC',  '1001112030', '+573162233445', 'andres.lopez@email.com',     '',            '1975-08-07', 'SIN_CONTACTO'],
    ['Empresa',   'Logística S.A.S',  'NIT', '900123456',  '+573013334455', 'contacto@logistica.com',     '+5712001122', '',           'POLIZA_CONTRATADA'],
  ];

  const clientIds: number[] = [];
  for (const c of CLIENTS) {
    clientIds.push(insertCliente.run(asesorId, ...c).lastInsertRowid as number);
  }

  let polizaCounter = 1;
  for (const [finOffset, inicioOffset, tipo, tipoContratacion, clienteIdx, asegIdx] of POLICY_DEFS) {
    const finVig        = offsetDate(finOffset);
    const inicioVig     = offsetDate(inicioOffset);
    const expedicion    = offsetDate(inicioOffset - 2);
    const estado        = calculatePolicyStatus(finVig);
    const clienteId     = clientIds[clienteIdx];
    const aseguradoraId = asegIds[asegIdx];
    const notas         = tipo === 'AUTO' ? autoNotas(polizaCounter) : null;
    const numeroPoliza  = `POL-${tipo.slice(0, 2)}-${String(polizaCounter).padStart(3, '0')}-2026`;

    const polizaId = insertPoliza.run(
      clienteId, asesorId, aseguradoraId, numeroPoliza,
      tipo, expedicion, inicioVig, finVig,
      estado, tipoContratacion, notas
    ).lastInsertRowid as number;

    insertHistorial.run(polizaId, tipoContratacion, inicioVig, finVig);
    polizaCounter++;
  }
}
