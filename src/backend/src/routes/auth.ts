import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { signAccessToken, signRefreshToken } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    return;
  }

  const user = db.prepare('SELECT id, nombres, apellidos, email, passwordHash, rol, activo FROM usuarios WHERE email = ?').get(email);
  if (!user || !user.activo) {
    res.status(401).json({ message: 'Credenciales inválidas' });
    return;
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ message: 'Credenciales inválidas' });
    return;
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.rol });
  const refreshToken = signRefreshToken(user.id);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  db.prepare('INSERT INTO refresh_tokens (usuarioId, token, expiresAt) VALUES (?, ?, ?)').run(
    user.id,
    refreshToken,
    expiresAt
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ accessToken, user: { id: user.id, nombres: user.nombres, apellidos: user.apellidos, email: user.email, rol: user.rol } });
});

router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token faltante' });
    return;
  }

  const stored = db.prepare("SELECT usuarioId FROM refresh_tokens WHERE token = ? AND expiresAt > datetime('now')").get(refreshToken);
  if (!stored) {
    res.status(401).json({ message: 'Refresh token inválido' });
    return;
  }

  try {
    jwt.verify(refreshToken, config.jwtSecret);
  } catch {
    res.status(401).json({ message: 'Refresh token inválido o expirado' });
    return;
  }

  const tokenPayload = db.prepare('SELECT id, email, rol FROM usuarios WHERE id = ?').get(stored.usuarioId);
  if (!tokenPayload) {
    res.status(401).json({ message: 'Usuario inválido' });
    return;
  }

  const accessToken = signAccessToken({ id: tokenPayload.id, email: tokenPayload.email, role: tokenPayload.rol });
  res.json({ accessToken });
});

router.post('/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  if (refreshToken) {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  }
  res.clearCookie('refreshToken');
  res.status(204).end();
});

export default router;
