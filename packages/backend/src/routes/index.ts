// src/routes/index.ts

import { Router } from 'express';
import authRoutes from './auth';
import sitesRoutes from './sites';
import raspberryRoutes from './raspberries';

const router = Router();

// Asignamos los prefijos a cada conjunto de rutas
router.use('/auth', authRoutes);
router.use('/sites', sitesRoutes);
router.use('/raspberries', raspberryRoutes);

export default router;