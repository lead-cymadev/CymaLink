// src/app.ts
import express from 'express';
import cors from 'cors';

// OJO con la ruta de import: si este archivo está en src/, las rutas están en src/routes
import authRoutes from '../routes/auth';
import sitesRoutes from '../routes/sites';
import dashboardRoutes from '../routes/dashboard';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Logger para ver qué URL llega realmente
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

/**
 * Montaje dual:
 * - Definitivo: /api/...
 * - Compatibilidad: sin /api (por si el proxy o el frontend está llamando sin prefijo)
 */

// ---- AUTH
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // compat

// ---- SITES
app.use('/api/sites', sitesRoutes);
app.use('/sites', sitesRoutes); // compat

// ---- DASHBOARD
app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes); // compat

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

export default app;
