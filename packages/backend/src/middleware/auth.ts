import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  rol?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'No autorizado' });

  try {
    const secret: Secret = process.env.JWT_SECRET || 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';
    const decoded = jwt.verify(token, secret) as AuthUser & { exp?: number };
    req.user = { id: decoded.id, email: decoded.email, nombre: decoded.nombre, rol: decoded.rol ?? '' };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.rol?.toLowerCase() === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Requiere rol admin' });
}
