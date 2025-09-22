// config/jwt.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRY || '1h'
};

// Validar que JWT_SECRET esté configurado en producción
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET debe estar configurado en producción');
}