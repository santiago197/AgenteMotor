import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  console.error(err);
  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({ message: 'Ocurrió un error inesperado', details: err instanceof Error ? err.message : String(err) });
}
