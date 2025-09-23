import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Rol } from '../models/Rol'; // Importación añadida
import { PasswordResetToken } from '../models/PasswordResetToken';
import transporter from '../utils/nodemailer';

const router = Router();



// ---------------------- REGISTER ----------------------
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nombre, email y password son obligatorios' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email inválido' });
    }

    const existingUser = await User.findOne({ where: { email } });
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
      email,
      password: hashedPassword,
      idRol: defaultRol.id
    });

    const userData = newUser.toJSON();
    delete userData.password;

    //console.log(`✅ Usuario registrado: ${nombre} (${email})`);
    res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', data: userData });
  } catch (error) {
    //console.error('❌ Error en register:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ---------------------- LOGIN ----------------------
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Rol, attributes: ['NombreRol'] }]
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Credenciales inválidas' });
    }
    if (!user.activo) {
      return res.status(401).json({ success: false, message: 'Usuario inactivo' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Credenciales inválidas' });
    }
    
    const jwtSecret: Secret = process.env.JWT_SECRET || 'ESTE_SECRETO_ES_SOLO_PARA_DESARROLLO';
    const jwtExpiry = process.env.JWT_EXPIRY || '1h';

    const access_token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: (user as any).Rol.NombreRol
      },
      jwtSecret,
      { expiresIn: jwtExpiry }
    );

    const userData = user.toJSON();
    delete userData.password;

    //console.log(`✅ Usuario autenticado: ${user.nombre} (${user.email})`);
    res.status(200).json({ success: true, message: 'Inicio de sesión exitoso', access_token, user: userData });
  } catch (error) {
    //console.error('❌ Error en login:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// ---------------------- FORGOT PASSWORD ----------------------
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email es obligatorio' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({ success: true, message: 'Si el email está registrado, se enviará un enlace de restablecimiento.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hora

    await PasswordResetToken.create({ userId: user.id, token, expiresAt });

    const resetLink = `${process.env.FRONTEND_SHORT_URL}/auth/reset-password?token=${token}`;
    const fromEmail = process.env.SMTP_USER;

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Restablecer contraseña',
      html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${resetLink}">${resetLink}</a><p>Si no solicitaste esto, ignora este mensaje.</p>`
    });

    console.log(`🔑 Email de restablecimiento enviado a: ${email}`);
    res.status(200).json({ success: true, message: 'Si el email está registrado, se enviará un enlace de restablecimiento.' });
  } catch (error) {
    console.error('❌ Error en forgot-password:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});


// ---------------------- RESET PASSWORD ----------------------
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
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

    //console.log(`✅ Contraseña actualizada para: ${user.email}`);
    res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    //console.error('❌ Error en reset-password:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

export default router;