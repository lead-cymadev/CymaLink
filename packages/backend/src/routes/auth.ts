// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // << import único
import crypto from 'crypto';

import { User } from '../models/user';
import { Rol } from '../models/rol';
import { PasswordResetToken } from '../models/passwordresettoken';
import transporter from '../utils/nodemailer';

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

    const jwtSecret = (process.env.JWT_SECRET ?? 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO') as jwt.Secret;
    const jwtExpiry = (process.env.JWT_EXPIRY ?? '1h') as import('jsonwebtoken').SignOptions['expiresIn'];

    const rolNombre: string = (user as any).rol?.NombreRol || 'usuario';

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

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hora

    await PasswordResetToken.create({ userId: user.id, token, expiresAt });

    const resetBase = process.env.FRONTEND_SHORT_URL || process.env.FRONTEND_COMPLETE_URL || 'http://localhost:2000';
    const resetLink = `${resetBase}/auth/reset-password?token=${token}`;
    const fromEmail = process.env.SMTP_USER || 'no-reply@example.com';

    await transporter.sendMail({
      from: fromEmail,
      to: normalizedEmail,
      subject: 'Restablecer contraseña',
      html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${resetLink}">${resetLink}</a><p>Si no solicitaste esto, ignora este mensaje.</p>`,
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

    const resetToken = await PasswordResetToken.findOne({ where: { token } });
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
