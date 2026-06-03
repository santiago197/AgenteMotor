import { Router } from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import ExcelJS from 'exceljs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { normalizeDate, calculatePolicyStatus } from '../services/policyStatus.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get('/', (req, res) => {
  const userId = Number((req as any).user.id);
  const clientes = db.prepare('SELECT * FROM clientes WHERE asesorId = ? ORDER BY createdAt DESC').all(userId);
  res.json({ clientes });
});

router.post('/', (req, res) => {
  const userId = Number((req as any).user.id);
  const { nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion } = req.body;

  if (!nombres || !apellidos || !tipoDoc || !documento) {
    res.status(400).json({ message: 'Campos obligatorios incompletos' });
    return;
  }

  try {
    const result = db.prepare(`INSERT INTO clientes (asesorId, nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(userId, nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion ?? 'SIN_CONTACTO');

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ message: 'No se pudo crear el cliente', details: error instanceof Error ? error.message : String(error) });
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  const userId = Number((req as any).user.id);
  if (!req.file) {
    res.status(400).json({ message: 'Archivo requerido' });
    return;
  }

  const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });

  const summary = [];
  const insertCliente = db.prepare(`INSERT INTO clientes (asesorId, nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const transaction = db.transaction((entries: typeof rows) => {
    for (const row of entries) {
      const nombres = String(row['nombres'] ?? '').trim();
      const apellidos = String(row['apellidos'] ?? '').trim();
      const tipoDoc = String(row['tipoDoc'] ?? '').trim();
      const documento = String(row['documento'] ?? '').trim();
      const celular = String(row['celular'] ?? '').trim();
      const email = String(row['email'] ?? '').trim();
      const telefono = String(row['telefono'] ?? '').trim();
      const fechaNacimiento = String(row['fechaNacimiento'] ?? '').trim();
      const estadoGestion = String(row['estadoGestion'] ?? 'SIN_CONTACTO').trim();

      if (!nombres || !apellidos || !tipoDoc || !documento) {
        summary.push({ row, status: 'rejected', reason: 'Campos obligatorios incompletos' });
        continue;
      }

      try {
        insertCliente.run(userId, nombres, apellidos, tipoDoc, documento, celular, email, telefono, fechaNacimiento, estadoGestion);
        summary.push({ row, status: 'imported' });
      } catch (error) {
        summary.push({ row, status: 'rejected', reason: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  transaction(rows);
  res.json({ summary });
});

router.get('/template', async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Clientes');

  sheet.columns = [
    { header: 'nombres', key: 'nombres', width: 20 },
    { header: 'apellidos', key: 'apellidos', width: 20 },
    { header: 'tipoDoc', key: 'tipoDoc', width: 10 },
    { header: 'documento', key: 'documento', width: 18 },
    { header: 'celular', key: 'celular', width: 16 },
    { header: 'email', key: 'email', width: 28 },
    { header: 'telefono', key: 'telefono', width: 16 },
    { header: 'fechaNacimiento', key: 'fechaNacimiento', width: 16 },
    { header: 'estadoGestion', key: 'estadoGestion', width: 20 },
  ];

  sheet.addRows([
    { nombres: 'Carlos', apellidos: 'Ramírez Torres', tipoDoc: 'CC', documento: '1020304050', celular: '+573001234567', email: 'carlos@email.com', telefono: '+5712345678', fechaNacimiento: '1985-03-15', estadoGestion: 'SIN_CONTACTO' },
    { nombres: 'María', apellidos: 'González Pérez', tipoDoc: 'CC', documento: '1030405060', celular: '+573109876543', email: 'maria@email.com', telefono: '', fechaNacimiento: '1990-07-22', estadoGestion: 'COTIZACION' },
    { nombres: 'Empresa XYZ', apellidos: 'S.A.S', tipoDoc: 'NIT', documento: '900123456', celular: '+573013334455', email: 'contacto@xyz.com', telefono: '+5712001122', fechaNacimiento: '', estadoGestion: 'POLIZA_CONTRATADA' },
  ]);

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C63FF' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="plantilla-clientes.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

router.get('/:id', (req, res) => {
  const clientId = Number(req.params.id);
  const userId = Number((req as any).user.id);
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ? AND asesorId = ?').get(clientId, userId);
  if (!cliente) {
    res.status(404).json({ message: 'Cliente no encontrado' });
    return;
  }

  const polizas = db.prepare('SELECT * FROM polizas WHERE clienteId = ?').all(clientId);
  const logs = db.prepare('SELECT * FROM logs WHERE clienteId = ? ORDER BY fecha DESC').all(clientId);
  res.json({ cliente, polizas, logs });
});

router.put('/:id', (req, res) => {
  const clientId = Number(req.params.id);
  const userId = Number((req as any).user.id);
  const campos = req.body;
  const allowed = ['nombres', 'apellidos', 'tipoDoc', 'documento', 'celular', 'email', 'telefono', 'fechaNacimiento', 'estadoGestion'];
  const updates = Object.keys(campos).filter((key) => allowed.includes(key));

  if (updates.length === 0) {
    res.status(400).json({ message: 'No hay campos válidos para actualizar' });
    return;
  }

  const setClause = updates.map((key) => `${key} = @${key}`).join(', ');
  const statement = db.prepare(`UPDATE clientes SET ${setClause} WHERE id = @id AND asesorId = @userId`);
  const params = { id: clientId, userId, ...campos } as Record<string, unknown>;
  const result = statement.run(params);

  if (result.changes === 0) {
    res.status(404).json({ message: 'Cliente no encontrado o no autorizado' });
    return;
  }

  res.json({ updated: true });
});

router.post('/:id/log', (req, res) => {
  const clientId = Number(req.params.id);
  const userId = Number((req as any).user.id);
  const { accion, notas } = req.body as Record<string, unknown>;

  const cliente = db.prepare('SELECT id FROM clientes WHERE id = ? AND asesorId = ?').get(clientId, userId);
  if (!cliente) {
    res.status(404).json({ message: 'Cliente no encontrado' });
    return;
  }

  if (!accion || typeof accion !== 'string' || !accion.trim()) {
    res.status(400).json({ message: 'El campo accion es obligatorio' });
    return;
  }

  db.prepare('INSERT INTO logs (clienteId, asesorId, accion, notas) VALUES (?, ?, ?, ?)').run(clientId, userId, accion, notas ?? null);
  res.status(201).json({ created: true });
});

export default router;
