import { Router } from 'express';
import ExcelJS from 'exceljs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { calculatePolicyStatus, normalizeDate } from '../services/policyStatus.js';

const router = Router();
router.use(requireAuth);

router.post('/search', (req, res) => {
  const userId = Number((req as any).user.id);
  const { tipo, estado, tipoContratacion, desde, hasta, documento, numeroPoliza, aseguradoraId, page = 1, pageSize = 20 } = req.body as Record<string, unknown>;
  const filters: string[] = ['asesorId = @userId'];
  const params: Record<string, unknown> = { userId };

  if (tipo) {
    filters.push('tipo = @tipo');
    params.tipo = tipo;
  }
  if (estado) {
    filters.push('estado = @estado');
    params.estado = estado;
  }
  if (tipoContratacion) {
    filters.push('tipoContratacion = @tipoContratacion');
    params.tipoContratacion = tipoContratacion;
  }
  if (documento) {
    filters.push('clienteId IN (SELECT id FROM clientes WHERE documento = @documento AND asesorId = @userId)');
    params.documento = documento;
  }
  if (numeroPoliza) {
    filters.push('numeroPoliza LIKE @numeroPoliza');
    params.numeroPoliza = `%${numeroPoliza}%`;
  }
  if (aseguradoraId) {
    filters.push('aseguradoraId = @aseguradoraId');
    params.aseguradoraId = aseguradoraId;
  }
  if (desde) {
    filters.push('fechaFinVig >= @desde');
    params.desde = desde;
  }
  if (hasta) {
    filters.push('fechaFinVig <= @hasta');
    params.hasta = hasta;
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(pageSize);
  const polizas = db.prepare(`SELECT * FROM polizas ${where} ORDER BY fechaFinVig ASC LIMIT @pageSize OFFSET @offset`).all({ ...params, pageSize, offset });
  const total = db.prepare(`SELECT COUNT(1) as count FROM polizas ${where}`).get(params).count;

  res.json({ page: Number(page), pageSize: Number(pageSize), total, polizas });
});

router.post('/', (req, res) => {
  const userId = Number((req as any).user.id);
  const { clienteId, aseguradoraId, numeroPoliza, tipo, fechaExpedicion, fechaInicioVig, fechaFinVig, notas } = req.body as Record<string, unknown>;

  if (!clienteId || !aseguradoraId || !numeroPoliza || !tipo || !fechaExpedicion || !fechaInicioVig || !fechaFinVig) {
    res.status(400).json({ message: 'Campos obligatorios incompletos' });
    return;
  }

  const clienteOwner = db.prepare('SELECT id FROM clientes WHERE id = ? AND asesorId = ?').get(clienteId, userId);
  if (!clienteOwner) {
    res.status(403).json({ message: 'Cliente no encontrado o no autorizado' });
    return;
  }

  const estado = calculatePolicyStatus(String(fechaFinVig));
  try {
    const result = db.prepare(`INSERT INTO polizas (clienteId, asesorId, aseguradoraId, numeroPoliza, tipo, fechaExpedicion, fechaInicioVig, fechaFinVig, estado, tipoContratacion, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NUEVA_CONTRATACION', ?)`)
      .run(clienteId, userId, aseguradoraId, numeroPoliza, tipo, fechaExpedicion, fechaInicioVig, fechaFinVig, estado, notas);

    db.prepare(`INSERT INTO poliza_historial (polizaId, tipo, fechaInicioVig, fechaFinVig) VALUES (?, 'NUEVA_CONTRATACION', ?, ?)`).run(result.lastInsertRowid as number, fechaInicioVig, fechaFinVig);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ message: 'No se pudo crear la póliza', details: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/:id', (req, res) => {
  const policyId = Number(req.params.id);
  const userId = Number((req as any).user.id);
  const poliza = db.prepare('SELECT * FROM polizas WHERE id = ? AND asesorId = ?').get(policyId, userId);
  if (!poliza) {
    res.status(404).json({ message: 'Póliza no encontrada' });
    return;
  }

  const historial = db.prepare('SELECT * FROM poliza_historial WHERE polizaId = ? ORDER BY creadoEn DESC').all(policyId);
  res.json({ poliza, historial });
});

router.put('/:id', (req, res) => {
  const policyId = Number(req.params.id);
  const userId = Number((req as any).user.id);
  const updates = req.body as Record<string, unknown>;
  const allowed = ['numeroPoliza', 'tipo', 'fechaExpedicion', 'fechaInicioVig', 'fechaFinVig', 'fechaRenovacion', 'notas', 'tipoContratacion'];
  const keys = Object.keys(updates).filter((key) => allowed.includes(key));
  if (!keys.length) {
    res.status(400).json({ message: 'No hay campos válidos para actualizar' });
    return;
  }

  const finalUpdates: Record<string, unknown> = {};
  for (const key of keys) finalUpdates[key] = updates[key];
  if (finalUpdates.fechaFinVig) {
    finalUpdates.estado = calculatePolicyStatus(String(finalUpdates.fechaFinVig));
    if (!keys.includes('estado')) keys.push('estado');
  }

  const setClause = keys.map((key) => `${key} = @${key}`).join(', ');
  const params = { id: policyId, userId, ...finalUpdates } as Record<string, unknown>;
  const statement = db.prepare(`UPDATE polizas SET ${setClause} WHERE id = @id AND asesorId = @userId`);
  const result = statement.run(params);

  if (result.changes === 0) {
    res.status(404).json({ message: 'Póliza no encontrada o no autorizada' });
    return;
  }

  res.json({ updated: true });
});

router.post('/:id/renovar', (req, res) => {
  const policyId = Number(req.params.id);
  const userId = Number((req as any).user.id);
  const { fechaFinVig, fechaInicioVig } = req.body as Record<string, unknown>;
  if (!fechaFinVig || !fechaInicioVig) {
    res.status(400).json({ message: 'fechaFinVig y fechaInicioVig son obligatorios' });
    return;
  }

  const poliza = db.prepare('SELECT * FROM polizas WHERE id = ? AND asesorId = ?').get(policyId, userId);
  if (!poliza) {
    res.status(404).json({ message: 'Póliza no encontrada' });
    return;
  }

  const oldFin = new Date(poliza.fechaFinVig);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - oldFin.getTime()) / (1000 * 60 * 60 * 24));
  const tipoContratacion = diffDays > 30 ? 'NUEVA_CONTRATACION' : 'RENOVACION';
  const estado = calculatePolicyStatus(String(fechaFinVig));

  const transaction = db.transaction(() => {
    db.prepare(`INSERT INTO poliza_historial (polizaId, tipo, fechaInicioVig, fechaFinVig) VALUES (?, ?, ?, ?)`)
      .run(policyId, tipoContratacion, poliza.fechaInicioVig, poliza.fechaFinVig);

    db.prepare(`UPDATE polizas SET fechaInicioVig = ?, fechaFinVig = ?, fechaRenovacion = datetime('now'), tipoContratacion = ?, estado = ? WHERE id = ? AND asesorId = ?`)
      .run(fechaInicioVig, fechaFinVig, tipoContratacion, estado, policyId, userId);
  });

  transaction();
  res.json({ success: true, tipoContratacion, estado });
});

router.post('/:id/log', (req, res) => {
  const policyId = Number(req.params.id);
  const userId = Number((req as any).user.id);
  const { accion, notas } = req.body as Record<string, unknown>;
  const poliza = db.prepare('SELECT * FROM polizas WHERE id = ? AND asesorId = ?').get(policyId, userId);
  if (!poliza) {
    res.status(404).json({ message: 'Póliza no encontrada' });
    return;
  }

  if (!accion || typeof accion !== 'string' || !accion.trim()) {
    res.status(400).json({ message: 'El campo accion es obligatorio' });
    return;
  }

  const clienteId = poliza.clienteId;
  db.prepare('INSERT INTO logs (polizaId, clienteId, asesorId, accion, notas) VALUES (?, ?, ?, ?, ?)').run(policyId, clienteId, userId, accion, notas ?? null);
  res.status(201).json({ created: true });
});

router.post('/export', async (req, res) => {
  const userId = Number((req as any).user.id);
  const { tipo, estado, desde, hasta, documento, numeroPoliza, aseguradoraId } = req.body as Record<string, unknown>;
  const filters: string[] = ['asesorId = @userId'];
  const params: Record<string, unknown> = { userId };

  if (tipo) { filters.push('tipo = @tipo'); params.tipo = tipo; }
  if (estado) { filters.push('estado = @estado'); params.estado = estado; }
  if (documento) { filters.push('clienteId IN (SELECT id FROM clientes WHERE documento = @documento AND asesorId = @userId)'); params.documento = documento; }
  if (numeroPoliza) { filters.push('numeroPoliza LIKE @numeroPoliza'); params.numeroPoliza = `%${numeroPoliza}%`; }
  if (aseguradoraId) { filters.push('aseguradoraId = @aseguradoraId'); params.aseguradoraId = aseguradoraId; }
  if (desde) { filters.push('fechaFinVig >= @desde'); params.desde = desde; }
  if (hasta) { filters.push('fechaFinVig <= @hasta'); params.hasta = hasta; }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const polizas = db.prepare(`SELECT * FROM polizas ${where} ORDER BY fechaFinVig ASC`).all(params);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Polizas');
  sheet.columns = [
    { header: 'Número de póliza', key: 'numeroPoliza', width: 20 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'AseguradoraId', key: 'aseguradoraId', width: 16 },
    { header: 'Fecha expedición', key: 'fechaExpedicion', width: 14 },
    { header: 'Inicio vigencia', key: 'fechaInicioVig', width: 14 },
    { header: 'Fin vigencia', key: 'fechaFinVig', width: 14 },
    { header: 'Estado', key: 'estado', width: 18 },
    { header: 'Tipo contratación', key: 'tipoContratacion', width: 18 },
    { header: 'Notas', key: 'notas', width: 30 }
  ];

  polizas.forEach((poliza) => sheet.addRow(poliza));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="polizas-export.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
});

export default router;
