import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

// 1. Extendemos la interfaz de Request de Express para incluir nuestra propiedad 'user'
// Esto nos dará autocompletado y seguridad de tipos en nuestras rutas protegidas.
export interface AuthRequest extends Request {
  user?: { id: number }; // Puedes añadir más propiedades del usuario si las incluyes en el token
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 2. Buscamos el token en la cabecera 'Authorization'
  const authHeader = req.headers.authorization;

  // Si no hay cabecera o no empieza con 'Bearer ', denegamos el acceso.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Acceso denegado. No se proveyó un token.' });
  }

  try {
    // 3. Extraemos el token quitando la parte 'Bearer '
    const token = authHeader.split(' ')[1];

    // Usamos el mismo secreto que al crear el token en el login
    const jwtSecret: Secret = process.env.JWT_SECRET || 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';

    // 4. Verificamos el token. Si es inválido o expiró, lanzará un error.
    const decoded = jwt.verify(token, jwtSecret) as { id: number };

    // 5. Si el token es válido, añadimos la información del usuario a la petición (req)
    req.user = { id: decoded.id };

    // 6. Llamamos a next() para que la petición continúe hacia la ruta final
    next();
  } catch (error) {
    // Si jwt.verify falla, capturamos el error y devolvemos un 401.
    res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }
};