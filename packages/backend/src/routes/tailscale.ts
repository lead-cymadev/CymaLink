import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

const API_BASE = 'https://api.tailscale.com/api/v2';

const mapDevice = (device: any) => {
  const primaryIp = Array.isArray(device?.addresses) ? device.addresses[0] : null;
  const hostInfo = device?.hostinfo ?? {};
  const network = hostInfo?.networkinfo ?? {};

  let mac: string | null = null;
  if (typeof network?.primaryMac === 'string') mac = network.primaryMac;
  if (!mac && Array.isArray(network?.interfaces)) {
    for (const ni of network.interfaces) {
      if (typeof ni?.mac === 'string') {
        mac = ni.mac;
        break;
      }
    }
  }

  return {
    id: device?.id ?? device?.nodeId ?? null,
    name: device?.displayName || device?.hostname || device?.name || 'sin-nombre',
    hostname: device?.hostname ?? null,
    addresses: Array.isArray(device?.addresses) ? device.addresses : [],
    primaryIp: primaryIp ?? null,
    macAddress: mac,
    os: device?.os ?? hostInfo?.os ?? null,
    lastSeen: device?.lastSeen ?? null,
    tags: Array.isArray(device?.tags) ? device.tags : [],
    keyExpiryDisabled: Boolean(device?.keyExpiryDisabled),
  };
};

router.get('/devices', authMiddleware, adminMiddleware, async (_req, res) => {
  const apiKey = process.env.TAILSCALE_API_KEY;
  const tailnet = process.env.TAILSCALE_TAILNET;

  if (!apiKey || !tailnet) {
    return res.status(500).json({
      success: false,
      message: 'TAILSCALE_API_KEY y TAILSCALE_TAILNET deben estar configurados en el entorno.',
    });
  }

  const credentials = Buffer.from(`${apiKey}:`).toString('base64');

  try {
    const response = await fetch(`${API_BASE}/tailnet/${encodeURIComponent(tailnet)}/devices`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    });

    const raw = await response.text();
    let data: any = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        console.error('tailscale devices parse error:', parseError, raw);
        return res.status(502).json({ success: false, message: 'Respuesta inválida de Tailscale' });
      }
    }

    if (!response.ok) {
      const reason = data?.message || data?.error || response.statusText || 'Error desconocido';
      return res.status(response.status).json({ success: false, message: reason });
    }

    const devices = Array.isArray(data?.devices) ? data.devices.map(mapDevice) : [];
    return res.json({ success: true, data: devices });
  } catch (error) {
    console.error('tailscale devices error:', error);
    return res.status(500).json({ success: false, message: 'No se pudieron sincronizar los dispositivos.' });
  }
});

export default router;
