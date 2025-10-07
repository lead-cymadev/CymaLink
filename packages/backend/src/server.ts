// src/server.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { swaggerUi, specs } from './swagger';
import { log } from './colors/theme';
import sequelize from './config/database';
import './models';                  // registra asociaciones
import apiRouter from './routes';   // /auth, /sites, /dashboard montados dentro

dotenv.config();

export const app = express();
export const PORT = process.env.BACKEND_PORT || 8000;

/** ===== CORS =====
 *  Usa una lista desde env (coma-separada) + defaults incluyendo http://pruebas:2000
 */
const RAW_ORIGINS =
  process.env.FRONTEND_ORIGINS
  || [
       'http://pruebas:2000',
       'http://localhost:2000',
       'http://127.0.0.1:2000',
       process.env.FRONTEND_SHORT_URL || '',
       process.env.FRONTEND_COMPLETE_URL || ''
     ].filter(Boolean).join(',');

const ALLOWED_ORIGINS = RAW_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    // permite herramientas sin Origin (curl/Postman)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
// ⚠️ Preflight explícito para que OPTIONS funcione en rutas comunes
app.options('/', cors(corsOptions));
app.options(/^\/api(?:\/.*)?$/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    const rawUa = req.get('User-Agent');
    const userAgent = typeof rawUa === 'string' ? rawUa.slice(0, 60) : undefined;

    log.info(`📝 ${req.method} ${req.path}`, {
      origin: req.headers.origin,
      userAgent,
    });
    next();
  });
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// ✅ TODAS las rutas de la API bajo /api
app.use('/api', apiRouter);

// Opcional: compatibilidad directa cuando el proxy ya agrega /api
if (process.env.ENABLE_LEGACY_ROUTES === 'true') {
  log.warning('⚠️ ENABLE_LEGACY_ROUTES=true — exponiendo endpoints sin prefijo /api');
  app.use('/', apiRouter);
}

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found', path: req.originalUrl });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log.error('❌ Error no manejado:', err);
  res.status(500).json({ success: false, message: err?.message || 'Error interno' });
});

// Arranque
app.listen(Number(PORT), '0.0.0.0', async () => {
  try {
    await sequelize.authenticate();
    log.success('✅ DB conectada');

    const shouldAutoSync = (process.env.SEQUELIZE_AUTO_SYNC ?? '').toLowerCase() === 'true'
      || process.env.NODE_ENV === 'development';
    if (shouldAutoSync) {
      const rawSyncMode = (process.env.SEQUELIZE_SYNC_MODE
        ?? (process.env.NODE_ENV === 'development' ? 'alter' : '')).toLowerCase();
      const alterSync = rawSyncMode === 'alter';
      await sequelize.sync({ alter: alterSync });
      log.success(`🗃️ Modelos sincronizados (mode=${alterSync ? 'alter' : 'safe'})`);
    } else {
      log.info('🔒 Sincronización automática deshabilitada. Ejecuta migraciones manualmente.');
    }

    const base = process.env.TAILSCALE_SHORT_URL
      || process.env.TAILSCALE_COMPLETE_URL
      || 'http://pruebas';
    log.success(`🚀 API en ${base}:${PORT}`);
    log.info(`📖 Swagger: ${base}:${PORT}/api-docs`);
    log.info(`🌐 CORS allowlist: ${ALLOWED_ORIGINS.join(', ')}`);
  } catch (e) {
    log.error('❌ Error al iniciar:', e);
    process.exit(1);
  }
});
