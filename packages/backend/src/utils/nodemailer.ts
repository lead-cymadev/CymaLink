import nodemailer, { type Transporter } from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT || '587');
const secure = port === 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const missingCreds = !smtpUser || !smtpPass;
const isDevLike = ['development', 'test'].includes(process.env.NODE_ENV ?? '');

if (missingCreds && !isDevLike) {
  throw new Error('SMTP_USER y SMTP_PASS deben estar configurados en el entorno');
}

const transporter: Transporter = (missingCreds && isDevLike
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })) as Transporter;

export default transporter;
