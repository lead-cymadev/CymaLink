// src/routes/sites.ts

import { Router, Response } from 'express';
import { User } from '../models/User';
import { Site } from '../models/Site';
import { Raspberry } from '../models/Raspberry';
import { Status } from '../models/Status';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// RUTA PARA EL DASHBOARD
// GET /
// NOTA: La ruta es solo "/" porque el prefijo "/sites" se lo daremos en index.ts

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const sites = await Site.findAll({
      include: [
        {
          model: User,
          where: { id: userId },
          attributes: [],
          through: { attributes: [] }
        },
        {
          model: Raspberry,
          include: [{
            model: Status,
            attributes: ['nombre']
          }]
        }
      ]
    });

    if (!sites || sites.length === 0) {
      return res.status(200).json({ success: true, message: 'El usuario no tiene sitios asignados.', data: [] });
    }

    res.status(200).json({ success: true, data: sites });

  } catch (error) {
    console.error('❌ Error al obtener los sitios del dashboard:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;