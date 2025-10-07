// src/routes/index.ts
import { Router } from 'express';

import authRoutes from './auth';
import sitesRoutes from './sites';
import dashboardRoutes from './dashboard';
import raspberriesRoutes from './raspberries';
import assistantRoutes from './assistant';
import tailscaleRoutes from './tailscale';
import devicesRoutes from './devices';
import profileRoutes from './profile';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sites', sitesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/raspberries', raspberriesRoutes);
router.use('/assistant', assistantRoutes);
router.use('/tailscale', tailscaleRoutes);
router.use('/devices', devicesRoutes);
router.use('/profile', profileRoutes);

router.get('/_routes-ping', (_req, res) => {
  res.json({
    ok: true,
    mounted: ['/auth', '/sites', '/dashboard', '/raspberries', '/assistant', '/tailscale', '/devices', '/profile'],
  });
});

export default router;
