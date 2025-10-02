// src/routes/dashboard.ts
import { Router, Request, Response } from 'express';
import { Sites } from '../models/sites';
import { Raspberry } from '../models/raspberry';
import { Status } from '../models/status';

const router = Router();

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Trae todos los devices con su status usando el alias correcto
    const devices = await Raspberry.findAll({
      include: [{ model: Status, as: 'status', attributes: ['id', 'nombre'] }],
      order: [['id', 'ASC']],
    });

    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => (d as any).status?.nombre?.toLowerCase() === 'online').length;

    const totalSites = await Sites.count();

    const healthPercentage = totalDevices > 0
      ? Math.round((onlineDevices / totalDevices) * 100)
      : 0;

    const systemHealth =
      healthPercentage >= 90 ? 'Excelente' :
      healthPercentage >= 70 ? 'Estable'   :
      healthPercentage >= 50 ? 'Vigilancia': 'Crítico';

    return res.json({
      success: true,
      data: {
        totalSites,
        totalDevices,
        onlineDevices,
        alerts: Math.max(0, totalDevices - onlineDevices),
        systemHealth,
        healthPercentage,
      }
    });
  } catch (err) {
    console.error('GET /api/dashboard/stats', err);
    return res.status(500).json({ success: false, message: 'Error al calcular estadísticas' });
  }
});

export default router;
