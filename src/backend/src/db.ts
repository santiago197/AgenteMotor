import Database from 'better-sqlite3';
import { config } from './config.js';
import { seedDatabase } from './services/seed.js';

const db = new Database(config.databaseFile, { verbose: undefined });

type CreateTable = { sql: string };

const tables: CreateTable[] = [
  { sql: `CREATE TABLE IF NOT EXISTS aseguradoras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      razonSocial TEXT NOT NULL,
      nit TEXT NOT NULL UNIQUE,
      telefono TEXT,
      email TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
  { sql: `CREATE TABLE IF NOT EXISTS aseguradora_ramas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aseguradoraId INTEGER NOT NULL REFERENCES aseguradoras(id),
      rama TEXT NOT NULL CHECK(rama IN ('AUTO','HOGAR','VIDA','OTRA')),
      UNIQUE(aseguradoraId, rama)
    )` },
  { sql: `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('ADMIN','ASESOR')),
      activo INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
  { sql: `CREATE TABLE IF NOT EXISTS asesor_aseguradoras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL REFERENCES usuarios(id),
      aseguradoraId INTEGER NOT NULL REFERENCES aseguradoras(id),
      codigo TEXT,
      UNIQUE(usuarioId, aseguradoraId)
    )` },
  { sql: `CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asesorId INTEGER NOT NULL REFERENCES usuarios(id),
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      tipoDoc TEXT NOT NULL CHECK(tipoDoc IN ('CC','NIT','CE')),
      documento TEXT NOT NULL,
      celular TEXT,
      email TEXT,
      telefono TEXT,
      fechaNacimiento TEXT,
      estadoGestion TEXT NOT NULL DEFAULT 'SIN_CONTACTO' CHECK(estadoGestion IN ('COTIZACION','POLIZA_CONTRATADA','NO_VIGENTE','SIN_CONTACTO','GESTIONADO')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(asesorId, tipoDoc, documento)
    )` },
  { sql: `CREATE TABLE IF NOT EXISTS polizas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clienteId INTEGER NOT NULL REFERENCES clientes(id),
      asesorId INTEGER NOT NULL REFERENCES usuarios(id),
      aseguradoraId INTEGER NOT NULL REFERENCES aseguradoras(id),
      numeroPoliza TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('AUTO','HOGAR','VIDA','OTRA')),
      fechaExpedicion TEXT NOT NULL,
      fechaInicioVig TEXT NOT NULL,
      fechaFinVig TEXT NOT NULL,
      fechaRenovacion TEXT,
      estado TEXT NOT NULL DEFAULT 'VIGENTE' CHECK(estado IN ('VIGENTE','PROXIMA_VENCER','VENCIDA_RENOVABLE','VENCIDA_CRITICA','VENCIDA_PERDIDA')),
      tipoContratacion TEXT NOT NULL DEFAULT 'NUEVA_CONTRATACION' CHECK(tipoContratacion IN ('NUEVA_CONTRATACION','RENOVACION')),
      notas TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(aseguradoraId, numeroPoliza)
    )` },
  { sql: `CREATE TABLE IF NOT EXISTS poliza_historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      polizaId INTEGER NOT NULL REFERENCES polizas(id),
      tipo TEXT NOT NULL CHECK(tipo IN ('NUEVA_CONTRATACION','RENOVACION')),
      fechaInicioVig TEXT NOT NULL,
      fechaFinVig TEXT NOT NULL,
      creadoEn TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
  { sql: `CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      polizaId INTEGER REFERENCES polizas(id),
      clienteId INTEGER REFERENCES clientes(id),
      asesorId INTEGER NOT NULL REFERENCES usuarios(id),
      accion TEXT NOT NULL,
      notas TEXT,
      fecha TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
  { sql: `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL REFERENCES usuarios(id),
      token TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )` }
];

export function initializeDatabase(): void {
  const create = db.transaction(() => {
    tables.forEach((table) => db.prepare(table.sql).run());
  });

  create();
  seedDatabase(db);
}

export default db;
