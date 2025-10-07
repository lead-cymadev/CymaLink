import { Router, Request, Response, NextFunction } from 'express';
import { where, fn, col, Op } from 'sequelize';
import { Raspberry } from '../models/raspberry';

const router = Router();

const ENV_TOKENS = [
  process.env.DEVICE_REPORT_TOKENS,
  process.env.DEVICE_REPORT_TOKEN,
  process.env.AGENT_DEVICE_TOKEN, // alias por retrocompatibilidad
]
  .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
  .join(',');

const TOKEN_LIST = ENV_TOKENS.split(',')
  .map((token) => token.trim())
  .filter((token) => token.length > 0);

function requireAgentToken(req: Request, res: Response, next: NextFunction) {
  if (TOKEN_LIST.length === 0) {
    console.error('POST /api/devices/report rejected: DEVICE_REPORT_TOKEN(S) not configured');
    return res.status(503).json({ success: false, message: 'Servicio no disponible' });
  }

  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !TOKEN_LIST.includes(token)) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  return next();
}

function normalizeMac(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toUpperCase().replace(/[^0-9A-F]/g, '');
  if (cleaned.length !== 12) return null;
  return cleaned.match(/.{1,2}/g)?.join(':') ?? null;
}

router.post('/report', requireAgentToken, async (req: Request, res: Response) => {
  const { mac, hostname, tailscaleIp, tipo } = (req.body ?? {}) as {
    mac?: unknown;
    hostname?: unknown;
    tailscaleIp?: unknown;
    tipo?: unknown;
  };

  const normalizedMac = normalizeMac(mac);
  if (!normalizedMac) {
    return res.status(400).json({ success: false, message: 'MAC inválida' });
  }

  try {
    const macCompact = normalizedMac.replace(/:/g, '');

    const device = await Raspberry.findOne({
      where: {
        [Op.or]: [
          where(fn('upper', col('macAddress')), normalizedMac),
          where(fn('replace', fn('upper', col('macAddress')), ':', ''), macCompact),
        ],
      },
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Dispositivo no registrado' });
    }

    device.macAddress = normalizedMac;

    if (typeof hostname === 'string' && hostname.trim().length > 0) {
      device.hostname = hostname.trim();
      if (!device.nombre || device.nombre.trim().length === 0 || device.nombre === device.macAddress) {
        device.nombre = hostname.trim();
      }
    }

    if (typeof tailscaleIp === 'string' && tailscaleIp.trim().length > 0) {
      const sanitizedIp = tailscaleIp.trim();
      device.tailscaleIp = sanitizedIp;
      device.ipAddress = sanitizedIp;
    }

    if (typeof tipo === 'string' && tipo.trim().length > 0) {
      device.tipo = tipo.trim();
    }

    await device.save();

    return res.json({
      success: true,
      data: {
        id: device.id,
        macAddress: device.macAddress,
        hostname: device.hostname,
        tailscaleIp: device.tailscaleIp,
        tipo: device.tipo,
      },
    });
  } catch (error) {
    console.error('POST /api/devices/report error:', error);
    return res.status(500).json({ success: false, message: 'No se pudo registrar el reporte' });
  }
});

export default router;
