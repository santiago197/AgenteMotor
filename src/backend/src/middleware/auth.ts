import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { config } from '../config.js';

export interface AuthRequest extends Request {
  user?: { id: number; role: string; email: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de acceso requerido' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: number; email: string; role: string };
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function requireRole(role: 'ADMIN' | 'ASESOR') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Acceso no autorizado' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ message: 'Permiso insuficiente' });
      return;
    }
    next();
  };
}

export function signAccessToken(user: { id: number; email: string; role: string }): string {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: config.accessTokenExpiration
  });
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.refreshTokenExpiration
  });
}
