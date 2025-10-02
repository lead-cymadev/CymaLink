// src/routes/sites.ts
import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  authMiddleware as requireAuth,
  adminMiddleware as requireAdmin,
} from '../middleware/authMiddleware';
import { Sites } from '../models/sites';
import { Raspberry } from '../models/raspberry';
import { Status } from '../models/status';
import { User } from '../models/user';
import { Rol } from '../models/rol';

const router = Router();

/** Includes consistentes con los modelos
 * Raspberry.belongsTo(Status, { as: 'status', foreignKey: 'statusId' })
 * Sites.belongsToMany(User, { as: 'users', ... })
 * Sites.hasMany(Raspberry, { as: 'raspberries', ... })
 */
const SITE_INCLUDES = [
  {
    model: Raspberry,
    as: 'raspberries',
    include: [{ model: Status, as: 'status', attributes: ['id', 'nombre'] }],
  },
  {
    model: User,
    as: 'users',
    attributes: ['id', 'nombre', 'email'],
    through: { attributes: [] },
  },
];

/* =========================
 *   LISTADO (ADMIN / USER)
 * ========================= */

// FIRST: /all (admin)
router.get('/all', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const sites = await Sites.findAll({
      include: SITE_INCLUDES,
      order: [['id', 'ASC']],
    });
    return res.json({ success: true, data: sites });
  } catch (err) {
    console.error('GET /api/sites/all', err);
    return res.status(500).json({ success: false, message: 'Error al listar todos los sitios' });
  }
});

// Export (csv | xml) — poner antes de /:id
router.get('/export', requireAuth, async (req: any, res: Response) => {
  try {
    const isAdmin = (req.user?.rol || '').toLowerCase() === 'admin';
    const { format = 'csv', scope = 'mine', q } = req.query as {
      format?: 'csv' | 'xml';
      scope?: 'all' | 'mine';
      q?: string;
    };

    if (!['csv', 'xml'].includes(format)) {
      return res.status(400).json({ success: false, message: 'Formato inválido' });
    }
    if (scope === 'all' && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No autorizado para exportar todo' });
    }

    const whereSite = q ? { nombre: { [Op.iLike]: `%${q}%` } } : undefined;

    const baseInclude = [
      {
        model: Raspberry,
        as: 'raspberries',
        include: [{ model: Status, as: 'status', attributes: ['nombre'] }],
      },
      { model: User, as: 'users', attributes: ['nombre', 'email'], through: { attributes: [] } },
    ];

    let sites;
    if (scope === 'all') {
      sites = await Sites.findAll({ where: whereSite, include: baseInclude });
    } else {
      sites = await Sites.findAll({
        where: whereSite,
        include: [
          ...baseInclude,
          {
            model: User,
            as: 'users',
            attributes: [],
            through: { attributes: [] },
            where: { id: req.user!.id },
            required: true,
          },
        ],
      });
    }

    if (format === 'csv') {
      const rows: string[] = [
        'site,ubicacion,device,mac,ip,status,user_name,user_email',
      ];
      for (const s of sites as any[]) {
        const devices = s.raspberries || [];
        const users = s.users || [];
        const userNames = users.map((u: any) => u.nombre).join('|');
        const userEmails = users.map((u: any) => u.email).join('|');

        if (devices.length === 0) {
          rows.push(
            `${csv(s.nombre)},${csv(s.ubicacion)},,,,${csv('')},${csv(
              userNames
            )},${csv(userEmails)}`
          );
        } else {
          for (const d of devices) {
            rows.push(
              `${csv(s.nombre)},${csv(s.ubicacion)},${csv(d.nombre)},${csv(
                d.macAddress
              )},${csv(d.ipAddress)},${csv(d.status?.nombre)},${csv(
                userNames
              )},${csv(userEmails)}`
            );
          }
        }
      }
      const body = rows.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        "attachment; filename*=UTF-8''sites_export.csv"
      );
      return res.status(200).send(body);
    } else {
      const items = (sites as any[]).map((s) => ({
        nombre: s.nombre,
        ubicacion: s.ubicacion,
        users: (s.users || []).map((u: any) => ({
          nombre: u.nombre,
          email: u.email,
        })),
        devices: (s.raspberries || []).map((d: any) => ({
          nombre: d.nombre,
          macAddress: d.macAddress,
          ipAddress: d.ipAddress,
          status: d.status?.nombre || null,
        })),
      }));
      const xml = toXml({ sites: items });
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        "attachment; filename*=UTF-8''sites_export.xml"
      );
      return res.status(200).send(xml);
    }
  } catch (err) {
    console.error('GET /api/sites/export', err);
    return res.status(500).json({ success: false, message: 'Error al exportar' });
  }
});

// Sites del usuario (si es admin, devuelve todos también)
router.get('/', requireAuth, async (req: any, res: Response) => {
  try {
    const isAdmin = (req.user?.rol || '').toLowerCase() === 'admin';
    let sites;

    if (isAdmin) {
      sites = await Sites.findAll({ include: SITE_INCLUDES, order: [['id', 'ASC']] });
    } else {
      sites = await Sites.findAll({
        include: [
          ...SITE_INCLUDES,
          {
            model: User,
            as: 'users',
            attributes: [],
            through: { attributes: [] },
            where: { id: req.user!.id },
            required: true,
          },
        ],
        order: [['id', 'ASC']],
      });
    }

    return res.json({ success: true, data: sites });
  } catch (err) {
    console.error('GET /api/sites', err);
    return res.status(500).json({ success: false, message: 'Error al listar sitios' });
  }
});

/* =========================
 *        CRUD SITES
 * ========================= */

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { nombre, ubicacion, userIds, raspberries } = req.body as {
      nombre?: string;
      ubicacion?: string;
      userIds?: number[];
      raspberries?: Array<{
        nombre: string;
        macAddress: string;
        ipAddress?: string;
        statusId?: number;
      }>;
    };

    if (!nombre) {
      return res.status(400).json({ success: false, message: 'Nombre es obligatorio' });
    }

    const site = await Sites.create({ nombre, ubicacion });

    if (Array.isArray(userIds) && userIds.length) {
      const users = await User.findAll({ where: { id: userIds } });
      // @ts-ignore
      await site.setUsers(users);
    }

    if (Array.isArray(raspberries) && raspberries.length) {
      const rows = raspberries.map((r) => {
        const row: any = {
          nombre: r.nombre,
          macAddress: r.macAddress,
          ipAddress: r.ipAddress ?? null,
          siteId: site.id,
        };
        if (typeof r.statusId === 'number') row.statusId = r.statusId;
        return row;
      });
      await Raspberry.bulkCreate(rows);
    }

    const reloaded = await Sites.findByPk(site.id, { include: SITE_INCLUDES });
    return res.status(201).json({ success: true, data: reloaded });
  } catch (err) {
    console.error('POST /api/sites', err);
    return res.status(500).json({ success: false, message: 'Error al crear sitio' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { nombre, ubicacion, userIds } = req.body as {
      nombre?: string;
      ubicacion?: string;
      userIds?: number[];
    };

    const site = await Sites.findByPk(id);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Sitio no encontrado' });
    }

    if (typeof nombre === 'string') site.nombre = nombre;
    if (typeof ubicacion === 'string') site.ubicacion = ubicacion;
    await site.save();

    if (Array.isArray(userIds)) {
      const users = await User.findAll({ where: { id: userIds } });
      // @ts-ignore
      await site.setUsers(users);
    }

    const reloaded = await Sites.findByPk(id, { include: SITE_INCLUDES });
    return res.json({ success: true, data: reloaded });
  } catch (err) {
    console.error('PUT /api/sites/:id', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar sitio' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const site = await Sites.findByPk(id);
    if (!site) return res.status(404).json({ success: false, message: 'Sitio no encontrado' });

    await site.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/sites/:id', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar sitio' });
  }
});

/* =========================
 *     USERS EN SITE
 * ========================= */

router.get('/:id/users', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const site = await Sites.findByPk(id, {
      include: [{ model: User, as: 'users', attributes: ['id', 'nombre', 'email'], through: { attributes: [] } }],
    });
    if (!site) return res.status(404).json({ success: false, message: 'Sitio no encontrado' });
    // @ts-ignore
    return res.json({ success: true, data: site.users || [] });
  } catch (err) {
    console.error('GET /api/sites/:id/users', err);
    return res.status(500).json({ success: false, message: 'Error al listar usuarios del sitio' });
  }
});

router.post('/:id/users/by-email', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ success: false, message: 'Email es obligatorio' });

    const site = await Sites.findByPk(id);
    if (!site) return res.status(404).json({ success: false, message: 'Sitio no encontrado' });

    const user = await User.findOne({ where: { email }, include: [{ model: Rol, as: 'rol' }] });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    // @ts-ignore
    await site.addUser(user);
    return res
      .status(201)
      .json({ success: true, data: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (err) {
    console.error('POST /api/sites/:id/users/by-email', err);
    return res.status(500).json({ success: false, message: 'Error al asignar usuario' });
  }
});

router.delete('/:id/users/:userId', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params as { id: string; userId: string };
    const site = await Sites.findByPk(id);
    const user = await User.findByPk(userId);
    if (!site || !user) return res.status(404).json({ success: false, message: 'Sitio o usuario no encontrado' });

    // @ts-ignore
    await site.removeUser(user);
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/sites/:id/users/:userId', err);
    return res.status(500).json({ success: false, message: 'Error al quitar usuario' });
  }
});

/* =========================
 *    DEVICES EN SITE
 * ========================= */

router.get('/:id/devices', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const devices = await Raspberry.findAll({
      where: { siteId: id },
      include: [{ model: Status, as: 'status', attributes: ['id', 'nombre'] }],
      order: [['id', 'ASC']],
    });
    return res.json({ success: true, data: devices });
  } catch (err) {
    console.error('GET /api/sites/:id/devices', err);
    return res.status(500).json({ success: false, message: 'Error al listar dispositivos' });
  }
});

router.post('/:id/devices', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { nombre, macAddress, ipAddress, statusId } = req.body as {
      nombre?: string;
      macAddress?: string;
      ipAddress?: string;
      statusId?: number;
    };

    if (!nombre || !macAddress) {
      return res.status(400).json({ success: false, message: 'nombre y macAddress son obligatorios' });
    }

    const payload: any = {
      nombre,
      macAddress,
      ipAddress: ipAddress ?? null,
      siteId: Number(id),
    };
    if (typeof statusId === 'number') payload.statusId = statusId;

    const created = await Raspberry.create(payload);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('POST /api/sites/:id/devices', err);
    return res.status(500).json({ success: false, message: 'Error al crear dispositivo' });
  }
});

router.post('/:id/devices/bulk', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { devices } = req.body as {
      devices?: Array<{ nombre: string; macAddress: string; ipAddress?: string; statusId?: number }>;
    };

    if (!Array.isArray(devices) || devices.length === 0) {
      return res.status(400).json({ success: false, message: 'devices debe ser un array con al menos 1 elemento' });
    }

    const rows = devices.map((d) => {
      const row: any = {
        nombre: d.nombre,
        macAddress: d.macAddress,
        ipAddress: d.ipAddress ?? null,
        siteId: Number(id),
      };
      if (typeof d.statusId === 'number') row.statusId = d.statusId;
      return row;
    });

    const created = await Raspberry.bulkCreate(rows, { returning: true });
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('POST /api/sites/:id/devices/bulk', err);
    return res.status(500).json({ success: false, message: 'Error al crear dispositivos' });
  }
});

router.put('/:id/devices/:deviceId', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, deviceId } = req.params as { id: string; deviceId: string };
    const { nombre, macAddress, ipAddress, statusId } = req.body as {
      nombre?: string;
      macAddress?: string;
      ipAddress?: string;
      statusId?: number;
    };

    const dev = await Raspberry.findOne({ where: { id: deviceId, siteId: id } });
    if (!dev) return res.status(404).json({ success: false, message: 'Dispositivo no encontrado' });

    if (typeof nombre === 'string') dev.nombre = nombre;
    if (typeof macAddress === 'string') dev.macAddress = macAddress;
    if (typeof ipAddress === 'string' || ipAddress === null) dev.ipAddress = ipAddress ?? null;
    if (typeof statusId === 'number') (dev as any).statusId = statusId;

    await dev.save();
    return res.json({ success: true, data: dev });
  } catch (err) {
    console.error('PUT /api/sites/:id/devices/:deviceId', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar dispositivo' });
  }
});

router.delete('/:id/devices/:deviceId', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, deviceId } = req.params as { id: string; deviceId: string };
    const dev = await Raspberry.findOne({ where: { id: deviceId, siteId: id } });
    if (!dev) return res.status(404).json({ success: false, message: 'Dispositivo no encontrado' });

    await dev.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/sites/:id/devices/:deviceId', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar dispositivo' });
  }
});

export default router;

/* ========= Helpers export ========= */
function csv(v: any) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toXml(obj: any, root = 'root'): string {
  const esc = (s: any) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const build = (val: any, tag: string): string => {
    if (Array.isArray(val)) return val.map((v) => build(v, tag)).join('');
    if (val && typeof val === 'object') {
      const children = Object.entries(val)
        .map(([k, v]) => build(v, k))
        .join('');
      return `<${tag}>${children}</${tag}>`;
    }
    if (val === null || val === undefined) return `<${tag}/>`;
    return `<${tag}>${esc(val)}</${tag}>`;
  };

  // si obj tiene { sites: [...] } creamos <root><site>...</site></root>
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>${build(
    obj.sites ?? obj,
    'site'
  )}</${root}>`;
}
