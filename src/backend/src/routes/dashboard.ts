import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { calculatePolicyStatus } from '../services/policyStatus.js';

const router = Router();
router.use(requireAuth);

router.post('/search', (req, res) => {
  const userId = Number((req as any).user.id);
  const { estado, tipo, numeroPoliza, documento, nombre, page = 1, pageSize = 20 } = req.body as Record<string, unknown>;
  const filters: string[] = ['polizas.asesorId = @userId'];
  const params: Record<string, unknown> = { userId };

  if (estado) { filters.push('polizas.estado = @estado'); params.estado = estado; }
  if (tipo) { filters.push('polizas.tipo = @tipo'); params.tipo = tipo; }
  if (numeroPoliza) { filters.push('polizas.numeroPoliza LIKE @numeroPoliza'); params.numeroPoliza = `%${numeroPoliza}%`; }
  if (documento) { filters.push('polizas.clienteId IN (SELECT id FROM clientes WHERE documento = @documento AND asesorId = @userId)'); params.documento = documento; }
  if (nombre) { filters.push("(clientes.nombres || ' ' || clientes.apellidos) LIKE @nombre"); params.nombre = `%${nombre}%`; }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(pageSize);
  const query = `SELECT polizas.*, clientes.nombres AS clienteNombres, clientes.apellidos AS clienteApellidos
    FROM polizas
    JOIN clientes ON clientes.id = polizas.clienteId
    ${where}
    ORDER BY polizas.fechaFinVig ASC LIMIT @pageSize OFFSET @offset`;

  const polizas = db.prepare(query).all({ ...params, pageSize, offset });
  const totalRow = db.prepare(`SELECT COUNT(1) AS count FROM polizas JOIN clientes ON clientes.id = polizas.clienteId ${where}`).get(params);
  const counts = db.prepare(`SELECT polizas.estado, COUNT(1) AS total FROM polizas JOIN clientes ON clientes.id = polizas.clienteId ${where} GROUP BY polizas.estado`).all(params);

  const dashboard = counts.reduce((acc: Record<string, number>, item: { estado: string; total: number }) => {
    acc[item.estado] = item.total;
    return acc;
  }, {} as Record<string, number>);

  res.json({ page: Number(page), pageSize: Number(pageSize), total: totalRow.count, dashboard, polizas });
});

export default router;
