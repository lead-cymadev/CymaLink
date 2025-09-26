// src/server.ts

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { swaggerUi, specs } from './swagger';
import { log } from './colors/theme';
import sequelize from './config/database';
import './models'; // Ejecuta las asociaciones de los modelos

// ✅ Se importa el enrutador principal desde la carpeta de rutas
import apiRouter from './routes';

dotenv.config();

export const app = express();
export const PORT = process.env.BACKEND_PORT || 8000;

// --- CONFIGURACIÓN DE CORS MEJORADA ---
// Lista de orígenes permitidos.
const allowedOrigins = [
  process.env.FRONTEND_SHORT_URL || 'http://localhost:2000',
  process.env.FRONTEND_COMPLETE_URL || 'http://localhost:5173',
  'http://100.125.134.87:2000',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permite solicitudes sin origen (p. ej., Postman, apps móviles)
    if (!origin) return callback(null, true);

    // Si el origen de la solicitud está en nuestra lista blanca, permítelo.
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Si no, recházalo.
      callback(new Error('No permitido por la política de CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Se aplica el middleware de CORS con la nueva configuración.
app.use(cors(corsOptions));
// Habilitamos la respuesta a las solicitudes de verificación previa (preflight) para todas las rutas.
app.options('/', cors(corsOptions));

// Middlewares para parsear JSON y URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging para desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    log.info(`📝 ${req.method} ${req.path}`, {
      body: req.body,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });
    next();
  });
}

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// ✅ Se montan TODAS las rutas bajo el prefijo /api
app.use('/api', apiRouter);

// Middleware de manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log.error('❌ Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Middleware para rutas no encontradas
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Arranque del servidor
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    log.success('✅ Conexión a la base de datos establecida.');
    
    await sequelize.sync({ alter: true });
    console.log('🔄 Modelos sincronizados con la base de datos.');
    
    const TAILSCALE_URL = process.env.TAILSCALE_SHORT_URL || process.env.TAILSCALE_COMPLETE_URL || 'http://localhost';
    
    log.success(`🚀 Servidor corriendo en ${TAILSCALE_URL}:${PORT}`);
    console.log(`📖 Swagger docs: ${TAILSCALE_URL}:${PORT}/api-docs`);
    
  } catch (error) {
    log.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
});

// Manejo de señales para cierre graceful
process.on('SIGTERM', async () => {
  console.log('📴 Recibida señal SIGTERM, cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Recibida señal SIGINT, cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

