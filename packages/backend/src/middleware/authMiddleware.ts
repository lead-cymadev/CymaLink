// src/middleware/authMiddleware.ts
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { Rol } from '../models/rol';

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;

      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'nombre', 'idRol', 'activo'],
        include: [{ model: Rol, as: 'rol', attributes: ['NombreRol'] }],
      });

      if (!user || !user.activo) {
        return res.status(401).json({ success: false, message: 'Usuario inválido o inactivo' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: (user as any).rol?.NombreRol || 'usuario',
      };

      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
  } catch (error) {
    console.error('❌ Error en authMiddleware:', (error as any)?.message);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const adminMiddleware: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
  }
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  return next();
};
