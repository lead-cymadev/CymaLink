// config/jwt.ts
const isDevLike = ['development', 'test'].includes(process.env.NODE_ENV ?? '');
const fallbackSecret = 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';

const resolvedSecret = process.env.JWT_SECRET || (isDevLike ? fallbackSecret : undefined);
if (!resolvedSecret) {
  throw new Error('JWT_SECRET debe estar configurado en el entorno');
}

const expiresIn = process.env.JWT_EXPIRY || '1h';

export const jwtConfig = {
  secret: resolvedSecret,
  expiresIn,
} as const;

export const getJwtSecret = (): string => jwtConfig.secret;
export const getJwtExpiry = () => jwtConfig.expiresIn;
