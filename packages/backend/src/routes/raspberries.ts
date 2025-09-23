import { Router, Response } from 'express';
import { Raspberry } from '../models/Raspberry';
import { User } from '../models/User';
import { Site } from '../models/Site';
import { Status } from '../models/Status';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// --- RUTA PARA CREAR UN NUEVO DISPOSITIVO (POST /) ---
// Esta es la ruta que usará nuestro nuevo modal.
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { nombre, macAddress, ipAddress, siteId } = req.body;
  const userId = req.user?.id;

  if (!nombre || !macAddress || !siteId) {
    return res.status(400).json({ success: false, message: 'Nombre, MAC Address y Site ID son obligatorios.' });
  }

  try {
    const site = await Site.findByPk(siteId, { include: [User] });
    if (!site) {
      return res.status(404).json({ success: false, message: 'El sitio especificado no existe.' });
    }
    
    // Verificamos que el usuario que hace la petición tiene acceso al sitio
    const userHasAccess = (site as any).Users.some((user: User) => user.id === userId);
    if (!userHasAccess) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. No tienes permisos sobre este sitio.' });
    }
    
    // Buscamos el estado por defecto 'Offline'
    const defaultStatus = await Status.findOne({ where: { nombre: 'Offline' } });
    if (!defaultStatus) {
        // Este es un error de configuración del servidor, no del usuario
        return res.status(500).json({ success: false, message: 'Error de configuración: Estado por defecto no encontrado.' });
    }

    const newRaspberry = await Raspberry.create({
      nombre,
      macAddress,
      ipAddress: ipAddress || 'N/A', // Si no se provee IP, se guarda 'N/A'
      siteId,
      statusId: defaultStatus.id // Se asigna el ID del estado 'Offline'
    });

    res.status(201).json({ success: true, message: 'Dispositivo registrado exitosamente.', data: newRaspberry });

  } catch (error) {
    console.error('❌ Error al registrar el dispositivo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
});

// --- RUTA PARA ACTUALIZAR UN DISPOSITIVO (PUT /:id) ---
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { nombre, macAddress, ipAddress } = req.body;

  if (!nombre || !macAddress) {
    return res.status(400).json({ success: false, message: 'Nombre y MAC Address son obligatorios.' });
  }

  try {
    const raspberry = await Raspberry.findByPk(id, {
      include: [{ model: Site, include: [User] }]
    });

    if (!raspberry) {
      return res.status(404).json({ success: false, message: 'Dispositivo no encontrado.' });
    }

    const site = (raspberry as any).Site;
    const userHasAccess = site.Users.some((user: User) => user.id === userId);

    if (!userHasAccess) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. No tienes permisos para modificar este dispositivo.' });
    }

    // Actualiza los campos
    raspberry.nombre = nombre;
    raspberry.macAddress = macAddress;
    raspberry.ipAddress = ipAddress || 'N/A';
    
    await raspberry.save();

    res.status(200).json({ success: true, message: 'Dispositivo actualizado exitosamente.', data: raspberry });

  } catch (error) {
    console.error('❌ Error al actualizar el dispositivo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
});


// --- RUTA PARA ELIMINAR UN DISPOSITIVO (DELETE /:id) ---
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const raspberry = await Raspberry.findByPk(id, {
      include: [{ model: Site, include: [User] }]
    });

    if (!raspberry) {
      return res.status(404).json({ success: false, message: 'Dispositivo no encontrado.' });
    }

    const site = (raspberry as any).Site;
    const userHasAccess = site.Users.some((user: User) => user.id === userId);

    if (!userHasAccess) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. No tienes permisos para eliminar este dispositivo.' });
    }

    await raspberry.destroy();

    res.status(200).json({ success: true, message: 'Dispositivo eliminado exitosamente.' });

  } catch (error) {
    console.error('❌ Error al eliminar el dispositivo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
});

export default router;

