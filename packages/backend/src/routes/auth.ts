// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // << import único
import crypto from 'crypto';
import { Op } from 'sequelize';

import { User } from '../models/user';
import { Rol } from '../models/rol';
import { PasswordResetToken } from '../models/passwordresettoken';
import transporter from '../utils/nodemailer';
import { getJwtSecret, getJwtExpiry } from '../config/jwt';

// ---- Shim robusto para jsonwebtoken (ESM/CJS) ----
const JWT_ANY: any = (jwt as any)?.default ?? (jwt as any); // soporta default o objeto
const jwtSign: Function = JWT_ANY.sign?.bind(JWT_ANY);       // asegura .sign callable
const jwtVerify: Function = JWT_ANY.verify?.bind(JWT_ANY);
if (typeof jwtSign !== 'function' || typeof jwtVerify !== 'function') {
  throw new Error('jsonwebtoken mal importado: no se encontró sign/verify');
}
// ---------------------------------------------------

const router = Router();

/* ---------------------- REGISTER ---------------------- */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nombre, email, password } = req.body as { nombre?: string; email?: string; password?: string };

    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nombre, email y password son obligatorios' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Email inválido' });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }

    const defaultRol = await Rol.findOne({ where: { NombreRol: 'usuario' } });
    if (!defaultRol) {
      return res.status(500).json({ success: false, message: 'Error de configuración: El rol por defecto no existe.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nombre,
      email: normalizedEmail,
      password: hashedPassword,
      idRol: defaultRol.id,
      activo: true,
    });

    const userData = newUser.toJSON() as any;
    delete userData.password;

    return res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', data: userData });
  } catch (error) {
    console.error('❌ Error en register:', (error as any)?.message);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

/* ---------------------- LOGIN ---------------------- */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail },
      attributes: ['id', 'nombre', 'email', 'password', 'idRol', 'activo'],
      include: [{ model: Rol, as: 'rol', attributes: ['NombreRol'] }], // alias 'rol' debe existir en las asociaciones
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Credenciales inválidas' });
    }
    if (!user.activo) {
      return res.status(401).json({ success: false, message: 'Usuario inactivo' });
    }

    const validPassword = await bcrypt.compare(password, user.password || '');
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Credenciales inválidas' });
    }

    const jwtSecret = getJwtSecret() as jwt.Secret;
    const jwtExpiry = getJwtExpiry() as import('jsonwebtoken').SignOptions['expiresIn'];

    const rolNombre: string = ((user as any).rol?.NombreRol || 'usuario').toLowerCase();

    const payload = { id: user.id, email: user.email, nombre: user.nombre, rol: rolNombre };
    const options: import('jsonwebtoken').SignOptions = { expiresIn: jwtExpiry };

    // ✅ Firmar token con shim compatible
    const access_token = jwtSign(payload, jwtSecret, options);

    const { password: _omit, ...userSafe } = user.toJSON() as any;
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      access_token,
      user: userSafe,
    });
  } catch (error) {
    console.error('❌ Error en login:', (error as any)?.message, (error as any)?.stack);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

/* ---------------------- FORGOT PASSWORD ---------------------- */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email es obligatorio' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    // Respuesta genérica para no filtrar existencia
    if (!user) {
      return res
        .status(200)
        .json({ success: true, message: 'Si el email está registrado, se enviará un enlace de restablecimiento.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hora

    await PasswordResetToken.destroy({ where: { userId: user.id } });
    await PasswordResetToken.create({ userId: user.id, token: hashedToken, expiresAt });

    // Limpia tokens expirados antiguos para no acumularlos
    await PasswordResetToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });

    const resetBase = process.env.FRONTEND_SHORT_URL || process.env.FRONTEND_COMPLETE_URL || 'http://localhost:2000';
    const resetLink = `${resetBase}/auth/reset-password?token=${rawToken}`;
    const fromEmail = process.env.SMTP_USER || 'no-reply@example.com';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="color: #1d4ed8;">Solicitud de restablecimiento de contraseña</h2>
        <p>Hola${user.nombre ? ` ${user.nombre}` : ''},</p>
        <p>
          Recibimos una solicitud para restablecer la contraseña de tu cuenta CymaLink. Si fuiste tú,
          haz clic en el siguiente botón (o copia el enlace en tu navegador) dentro de la próxima hora.
        </p>
        <p style="margin: 24px 0; text-align: center;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: bold;">
            Restablecer contraseña
          </a>
        </p>
        <p style="word-break: break-all; font-size: 14px; color: #4b5563;">${resetLink}</p>
        <p>
          Si no solicitaste este cambio, simplemente ignora este mensaje. Tu contraseña actual seguirá siendo válida.
        </p>
        <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
          — Equipo CymaLink
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: fromEmail,
      to: normalizedEmail,
      subject: 'Restablecer contraseña',
      text: `Hola${user.nombre ? ` ${user.nombre}` : ''},\n\n` +
        'Recibimos una solicitud para restablecer la contraseña de tu cuenta CymaLink. ' +
        'Si fuiste tú, abre el siguiente enlace dentro de la próxima hora:\n\n' +
        `${resetLink}\n\n` +
        'Si no solicitaste este cambio, ignora este mensaje y tu contraseña actual seguirá siendo válida.\n\n' +
        '— Equipo CymaLink',
      html: htmlBody,
    });

    console.log(`🔑 Email de restablecimiento enviado a: ${normalizedEmail}`);
    return res
      .status(200)
      .json({ success: true, message: 'Si el email está registrado, se enviará un enlace de restablecimiento.' });
  } catch (error) {
    console.error('❌ Error en forgot-password:', (error as any)?.message);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

/* ---------------------- RESET PASSWORD ---------------------- */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token y nueva contraseña son obligatorios' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await PasswordResetToken.findOne({ where: { token: hashedToken } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    }

    const user = await User.findByPk(resetToken.userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await resetToken.destroy();

    return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('❌ Error en reset-password:', (error as any)?.message);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;
