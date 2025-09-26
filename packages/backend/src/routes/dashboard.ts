// src/routes/dashboard.ts
import { Router, Response } from 'express';
import { User } from '../models/User';
import { Site } from '../models/Site';
import { Raspberry } from '../models/Raspberry';
import { Status } from '../models/Status';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { Op } from 'sequelize';

const router = Router();

// --- RUTA PARA OBTENER ESTADÍSTICAS DEL DASHBOARD ---
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.rol;

    let sites: Site[];
    
    if (userRole === 'admin') {
      sites = await Site.findAll({
        include: [{
          model: Raspberry,
          include: [{ model: Status, attributes: ['nombre'] }]
        }]
      });
    } else {
      sites = await Site.findAll({
        include: [
          {
            model: User,
            where: { id: userId },
            attributes: [],
            through: { attributes: [] },
            // required: true no es necesario aquí porque el 'where' está en el nivel superior de la asociación
          },
          {
            model: Raspberry,
            include: [{ model: Status, attributes: ['nombre'] }]
          }
        ]
      });
    }

    // Calcular estadísticas
    const totalSites = sites.length;
    const allDevices = sites.flatMap(site => (site as any).Raspberries || []); 
    const totalDevices = allDevices.length;
    const onlineDevices = allDevices.filter(device => 
      (device as any).Status?.nombre?.toLowerCase() === 'online'
    ).length;
    
    const alerts = totalDevices - onlineDevices;
    
    const healthPercentage = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 100;
    let systemHealth = 'Crítico';
    if (healthPercentage >= 90) systemHealth = 'Excelente';
    else if (healthPercentage >= 70) systemHealth = 'Bueno';
    else if (healthPercentage >= 50) systemHealth = 'Regular';

    const stats = {
      totalSites,
      onlineDevices,
      totalDevices,
      alerts,
      systemHealth,
      healthPercentage: Math.round(healthPercentage)
    };

    res.status(200).json({ success: true, data: stats });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});


// --- RUTA PARA OBTENER DISPOSITIVOS CON ALERTAS ---
router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.rol;

    let alertDevices: Raspberry[];
    
    if (userRole === 'admin') {
      alertDevices = await Raspberry.findAll({
        include: [
          { model: Status, where: { nombre: { [Op.ne]: 'Online' } }, attributes: ['nombre'] },
          { model: Site, attributes: ['nombre', 'ubicacion'] }
        ]
      });
    } else {
      alertDevices = await Raspberry.findAll({
        where: {}, // Aseguramos que la consulta principal es sobre Raspberry
        include: [
          { model: Status, where: { nombre: { [Op.ne]: 'Online' } }, attributes: ['nombre'] },
          {
            model: Site,
            attributes: ['nombre', 'ubicacion'],
            required: true,
            include: [{
              model: User,
              where: { id: userId },
              attributes: [],
              through: { attributes: [] },
              required: true,
            }]
          }
        ]
      });
    }

    const alerts = alertDevices.map(device => ({
      id: device.id,
      nombre: device.nombre,
      macAddress: device.macAddress,
      ipAddress: device.ipAddress,
      status: (device as any).Status?.nombre || 'Unknown', 
      siteName: (device as any).Site?.nombre || 'Unknown', 
      siteLocation: (device as any).Site?.ubicacion || 'Unknown',
      updatedAt: (device as any).updatedAt
    }));

    res.status(200).json({ success: true, data: alerts });

  } catch (error) {
    console.error('❌ Error al obtener alertas:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// --- RUTA PARA OBTENER ACTIVIDAD RECIENTE ---
router.get('/activity', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.rol;

    let recentActivity: Raspberry[];
    
    if (userRole === 'admin') {
      recentActivity = await Raspberry.findAll({
        include: [
          { model: Status, attributes: ['nombre'] },
          { model: Site, attributes: ['nombre', 'ubicacion'] }
        ],
        order: [['updatedAt', 'DESC']],
        limit: 10
      });
    } else {
      recentActivity = await Raspberry.findAll({
        include: [
          { model: Status, attributes: ['nombre'] },
          {
            model: Site,
            attributes: ['nombre', 'ubicacion'],
            // CORRECCIÓN CLAVE AQUÍ
            required: true,
            include: [{
              model: User,
              where: { id: userId },
              attributes: [],
              through: { attributes: [] },
              // Y AQUÍ
              required: true,
            }]
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: 10
      });
    }

    const activity = recentActivity.map(device => ({
      id: device.id,
      nombre: device.nombre,
      status: (device as any).Status?.nombre || 'Unknown',
      siteName: (device as any).Site?.nombre || 'Unknown',
      siteLocation: (device as any).Site?.ubicacion || 'Unknown',
      updatedAt: (device as any).updatedAt
    }));

    res.status(200).json({ success: true, data: activity });

  } catch (error) {
    console.error('❌ Error al obtener actividad reciente:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;