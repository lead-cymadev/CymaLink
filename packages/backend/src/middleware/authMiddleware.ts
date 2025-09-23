import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

// 1. Extendemos la interfaz para que nuestro usuario incluya el 'role'.
// Esto es crucial para que TypeScript sepa que la propiedad existe.
export interface AuthRequest extends Request {
  user?: { id: number; role: string; }; 
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Acceso denegado. No se proveyó un token.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const jwtSecret: Secret = process.env.JWT_SECRET || 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';

    // 2. Al verificar, le decimos a TypeScript que el payload decodificado contendrá 'id' y 'role'.
    const decoded = jwt.verify(token, jwtSecret) as { id: number; role: string; };

    // 3. Guardamos tanto el id como el rol en el objeto de la petición.
    req.user = { id: decoded.id, role: decoded.role };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }
};

// --- NUEVO MIDDLEWARE DE ADMINISTRADOR ---
/**
 * Este middleware verifica si el usuario autenticado tiene el rol de 'admin'.
 * IMPORTANTE: Debe usarse siempre DESPUÉS de `authMiddleware` en la cadena de rutas.
 */
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // `req.user` fue establecido previamente por `authMiddleware`.
  if (req.user?.role !== 'admin') {
    // Si el rol no es 'admin', denegamos el acceso con un error 403 (Forbidden).
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  // Si el usuario es admin, la petición puede continuar.
  next();
};