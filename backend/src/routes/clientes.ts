import type { Router } from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
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

router.get('/template', (req, res) => {
  const template = [
    {
      nombres: 'Juan',
      apellidos: 'Pérez',
      tipoDoc: 'CC',
      documento: '100200300',
      celular: '+573001234567',
      email: 'juan.perez@example.com',
      telefono: '+5712345678',
      fechaNacimiento: '1985-06-20',
      estadoGestion: 'SIN_CONTACTO'
    }
  ];
  res.json({ template });
});

export default router;
