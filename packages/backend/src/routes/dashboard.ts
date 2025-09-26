// src/routes/dashboard.ts
import { Router, Response } from 'express';
import { User } from '../models/User';
import { Site } from '../models/Site';
import { Raspberry } from '../models/Raspberry';
import { Status } from '../models/Status';
import { Rol } from '../models/Rol';
import { StatusLog } from '../models/StatusLog';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { Op } from 'sequelize';

const router = Router();

// --- RUTA PARA OBTENER ESTADÍSTICAS DEL DASHBOARD ---
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.rol;

    let sites: Site[];
    
    // Obtener sitios según el rol del usuario
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
            through: { attributes: [] }
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
    const allDevices = sites.flatMap(site => site.Raspberry || []);
    const totalDevices = allDevices.length;
    const onlineDevices = allDevices.filter(device => 
      device.Status?.nombre?.toLowerCase() === 'online'
    ).length;
    
    const alerts = totalDevices - onlineDevices;
    
    // Calcular salud del sistema
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

// --- RUTA PARA OBTENER PERFIL DEL USUARIO ACTUAL ---
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await User.findByPk(userId, {
      include: [{ model: Rol, attributes: ['NombreRol'] }],
      attributes: ['id', 'nombre', 'email', 'activo', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const userData = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: (user as any).Rol.NombreRol,
      activo: user.activo,
    };

    res.status(200).json({ success: true, data: userData });

  } catch (error) {
    console.error('❌ Error al obtener perfil del usuario:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// --- RUTA PARA OBTENER DISPOSITIVOS CON ALERTAS ---
router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.rol;

    let alertDevices: Raspberry[];
    
    // Buscar dispositivos offline
    if (userRole === 'admin') {
      alertDevices = await Raspberry.findAll({
        include: [
          {
            model: Status,
            where: { nombre: { [Op.ne]: 'Online' } },
            attributes: ['nombre']
          },
          {
            model: Site,
            attributes: ['nombre', 'ubicacion']
          }
        ]
      });
    } else {
      alertDevices = await Raspberry.findAll({
        include: [
          {
            model: Status,
            where: { nombre: { [Op.ne]: 'Online' } },
            attributes: ['nombre']
          },
          {
            model: Site,
            include: [{
              model: User,
              where: { id: userId },
              attributes: [],
              through: { attributes: [] }
            }],
            attributes: ['nombre', 'ubicacion']
          }
        ]
      });
    }

    const alerts = alertDevices.map(device => ({
      id: device.id,
      nombre: device.nombre,
      macAddress: device.macAddress,
      ipAddress: device.ipAddress,
      status: device.statusId?.nombre || 'Unknown',
      siteName: (device as any).Site?.nombre || 'Unknown',
      siteLocation: (device as any).Site?.ubicacion || 'Unknown',
      updatedAt: device.updatedAt
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

    // Obtener dispositivos recientemente actualizados
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
            include: [{
              model: User,
              where: { id: userId },
              attributes: [],
              through: { attributes: [] }
            }],
            attributes: ['nombre', 'ubicacion']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: 10
      });
    }

    const activity = recentActivity.map(device => ({
      id: device.id,
      nombre: device.nombre,
      status: device.Status?.nombre || 'Unknown',
      siteName: (device as any).Site?.nombre || 'Unknown',
      siteLocation: (device as any).Site?.ubicacion || 'Unknown',
      updatedAt: device.updatedAt
    }));

    res.status(200).json({ success: true, data: activity });

  } catch (error) {
    console.error('❌ Error al obtener actividad reciente:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;