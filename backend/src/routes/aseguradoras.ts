import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const aseguradoras = db.prepare('SELECT id, razonSocial, nit, telefono, email FROM aseguradoras ORDER BY razonSocial ASC').all();
  res.json({ aseguradoras });
});

export default router;
