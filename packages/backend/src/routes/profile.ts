import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { User } from '../models/user';
import { Rol } from '../models/rol';
import transporter from '../utils/nodemailer';

const router = Router();

const ALLOWED_LANGUAGES = ['es', 'en', 'pt', 'fr'];

function normalizeLanguage(lang?: string | null): string {
  if (!lang) return 'es';
  const normalized = lang.trim().toLowerCase();
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('pt')) return 'pt';
  if (normalized.startsWith('fr')) return 'fr';
  return 'es';
}

function inferLanguageFromTimezone(timezone?: string | null): string {
  if (!timezone) return 'es';
  const tz = timezone.toLowerCase();
  if (tz.includes('us/') || tz.includes('america/new_york') || tz.includes('america/chicago') || tz.includes('america/los_angeles')) {
    return 'en';
  }
  if (
    tz.includes('america/mexico') ||
    tz.includes('america/argentina') ||
    tz.includes('america/bogota') ||
    tz.includes('america/lima') ||
    tz.includes('america/santiago') ||
    tz.includes('america/montevideo')
  ) {
    return 'es';
  }
  return 'es';
}

const EMAIL_TEMPLATES: Record<'es' | 'en', (user: User) => { subject: string; text: string; html: string }> = {
  es: (user) => {
    const subject = 'Tus preferencias en CymaLink se actualizaron';
    const text = `Hola ${user.nombre},\n\nHemos recibido los cambios a tu perfil.\n\n` +
      `Idioma preferido: ${user.preferredLanguage ?? 'es'}\nZona horaria: ${user.timezone ?? 'UTC'}\nNotificaciones por correo: ${user.notifyByEmail ? 'activadas' : 'desactivadas'}\n\n` +
      'Si no fuiste tú, revisa tu cuenta inmediatamente.';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="color: #ef4444;">Tus preferencias se actualizaron</h2>
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p>Registramos cambios en la configuración de tu cuenta CymaLink:</p>
        <ul>
          <li><strong>Idioma:</strong> ${user.preferredLanguage ?? 'es'}</li>
          <li><strong>Zona horaria:</strong> ${user.timezone ?? 'UTC'}</li>
          <li><strong>Notificaciones por correo:</strong> ${user.notifyByEmail ? 'activadas' : 'desactivadas'}</li>
        </ul>
        <p>Si no realizaste estos cambios, ponte en contacto con el equipo de soporte.</p>
        <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">— Equipo CymaLink</p>
      </div>
    `;
    return { subject, text, html };
  },
  en: (user) => {
    const subject = 'Your CymaLink preferences were updated';
    const text = `Hi ${user.nombre},\n\nWe registered changes to your profile settings.\n\n` +
      `Preferred language: ${user.preferredLanguage ?? 'en'}\nTimezone: ${user.timezone ?? 'UTC'}\nEmail notifications: ${user.notifyByEmail ? 'enabled' : 'disabled'}\n\n` +
      'If this was not you, please review your account immediately.';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="color: #ef4444;">Your preferences were updated</h2>
        <p>Hello <strong>${user.nombre}</strong>,</p>
        <p>We detected changes in your CymaLink account configuration:</p>
        <ul>
          <li><strong>Language:</strong> ${user.preferredLanguage ?? 'en'}</li>
          <li><strong>Timezone:</strong> ${user.timezone ?? 'UTC'}</li>
          <li><strong>Email notifications:</strong> ${user.notifyByEmail ? 'enabled' : 'disabled'}</li>
        </ul>
        <p>If you didn't make these changes, please contact support.</p>
        <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">— CymaLink Team</p>
      </div>
    `;
    return { subject, text, html };
  },
};

async function sendPreferencesEmail(user: User) {
  try {
    const baseLang = normalizeLanguage(user.preferredLanguage);
    const lang = baseLang.startsWith('en') ? 'en' : 'es';
    const template = EMAIL_TEMPLATES[lang as 'en' | 'es'](user);
    const fromEmail = process.env.SMTP_USER || 'no-reply@cymlink.dev';
    await transporter.sendMail({
      from: fromEmail,
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error) {
    console.error('profile preferences email error:', error);
  }
}

function serializeUser(user: User) {
  const plain = user.toJSON() as any;
  delete plain.password;

  const roleAssoc = plain.rol || plain.Rol || null;
  const roleName: string | null = roleAssoc?.NombreRol ?? roleAssoc?.nombre ?? null;

  if (!plain.Rol && roleAssoc && roleAssoc.NombreRol) {
    plain.Rol = { NombreRol: roleAssoc.NombreRol };
  }

  if (roleName) {
    plain.rol = roleName.toLowerCase();
  } else if (typeof plain.rol === 'string') {
    plain.rol = plain.rol.toLowerCase();
  }

  return plain;
}

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const user = await User.findByPk(userId, {
      attributes: [
        'id',
        'nombre',
        'email',
        'idRol',
        'activo',
        'preferredLanguage',
        'timezone',
        'notifyByEmail',
        'createdAt',
        'updatedAt',
      ],
      include: [{ model: Rol, as: 'rol', attributes: ['NombreRol'] }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({ success: true, data: serializeUser(user) });
  } catch (error: any) {
    if (error?.original?.code === '42703') {
      console.error('GET /api/profile/me missing preference columns:', error?.original?.message);
      return res.status(500).json({
        success: false,
        message: 'Columnas de preferencias no encontradas. Ejecuta las migraciones más recientes del backend.',
      });
    }

    console.error('GET /api/profile/me error:', error);
    return res.status(500).json({ success: false, message: 'No se pudo obtener el perfil' });
  }
});

router.patch('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { nombre, preferredLanguage, timezone, notifyByEmail } = req.body as {
      nombre?: unknown;
      preferredLanguage?: unknown;
      timezone?: unknown;
      notifyByEmail?: unknown;
    };

    const user = await User.findByPk(userId, {
      include: [{ model: Rol, as: 'rol', attributes: ['NombreRol'] }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (typeof nombre === 'string' && nombre.trim().length > 0) {
      user.nombre = nombre.trim();
    }

    let targetLanguage = user.preferredLanguage ?? 'es';

    if (typeof preferredLanguage === 'string') {
      const normalized = preferredLanguage.trim().toLowerCase();
      if (!ALLOWED_LANGUAGES.includes(normalized)) {
        return res.status(400).json({ success: false, message: 'Idioma no soportado' });
      }
      user.preferredLanguage = normalized;
      targetLanguage = normalized;
    }

    if (typeof timezone === 'string') {
      const sanitized = timezone.trim();
      if (sanitized.length === 0) {
        return res.status(400).json({ success: false, message: 'Zona horaria inválida' });
      }
      user.timezone = sanitized;
      if (typeof preferredLanguage !== 'string') {
        const inferred = inferLanguageFromTimezone(sanitized);
        user.preferredLanguage = inferred;
        targetLanguage = inferred;
      }
    }

    if (typeof notifyByEmail === 'boolean') {
      user.notifyByEmail = notifyByEmail;
    }

    await user.save();

    const payload = serializeUser(user);

    if (user.notifyByEmail) {
      await sendPreferencesEmail(user);
    }

    payload.preferredLanguage = user.preferredLanguage ?? targetLanguage;

    return res.json({ success: true, data: payload });
  } catch (error: any) {
    if (error?.original?.code === '42703') {
      console.error('PATCH /api/profile/me missing preference columns:', error?.original?.message);
      return res.status(500).json({
        success: false,
        message: 'Columnas de preferencias no encontradas. Ejecuta las migraciones más recientes del backend.',
      });
    }

    console.error('PATCH /api/profile/me error:', error);
    return res.status(500).json({ success: false, message: 'No se pudo actualizar el perfil' });
  }
});

export default router;
