// src/routes/sites.ts

import { Router, Response } from 'express';
import { User } from '../models/User';
import { Site } from '../models/Site';
import { Raspberry } from '../models/Raspberry';
import { Status } from '../models/Status';
// ✅ Importamos ambos middlewares
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// --- RUTA PARA USUARIOS REGULARES ---
// GET /api/sites/
// Devuelve solo los sitios asignados al usuario que hace la petición.
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
          include: [{ model: Status, attributes: ['nombre'] }]
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

// --- NUEVA RUTA PARA ADMINISTRADORES ---
// GET /api/sites/all
// Devuelve TODOS los sitios. Protegida para que solo usuarios con rol 'admin' puedan acceder.
router.get('/all', [authMiddleware, adminMiddleware], async (req: AuthRequest, res: Response) => {
  try {
    // La consulta es más simple: no filtramos por usuario.
    const allSites = await Site.findAll({
      include: [
        {
          model: Raspberry,
          include: [{ model: Status, attributes: ['nombre'] }]
        },
        { // Opcional: incluimos los usuarios de cada sitio para más contexto
          model: User,
          attributes: ['id', 'nombre', 'email'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(200).json({ success: true, data: allSites });

  } catch (error) {
    console.error('❌ Error al obtener todos los sitios para admin:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;