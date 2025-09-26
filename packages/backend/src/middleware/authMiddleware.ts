// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Rol } from '../models/Rol';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Verificar que el usuario sigue existiendo y está activo
      const user = await User.findByPk(decoded.id, {
        include: [{ model: Rol, attributes: ['NombreRol'] }]
      });

      if (!user || !user.activo) {
        return res.status(401).json({ success: false, message: 'Usuario inválido o inactivo' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: (user as any).Rol.NombreRol
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

  } catch (error) {
    console.error('❌ Error en authMiddleware:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
  }

  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  next();
};