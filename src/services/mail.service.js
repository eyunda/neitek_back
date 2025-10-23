import 'dotenv/config';
import nodemailer from 'nodemailer';
import { renderTemplate } from './template.service.js';

function createYundaGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER_DEV_YUNDA,
      pass: process.env.SMTP_PWD_DEV_YUNDA
    },
    tls: { rejectUnauthorized: false }
  });
}

export async function sendMail(mailInfo = {}) {
  const from = {
    name: process.env.SMTP_DISPLAY_NAME_DEV_YUNDA || 'Neitek',
    address: process.env.SMTP_USER_DEV_YUNDA
  };
  const transporter = createYundaGmailTransporter();
  await transporter.sendMail({
    from,
    to: 'enderson_yundasa@fet.edu.co' || process.env.SMTP_USER_EMAIL_YUNDA,
    subject: mailInfo.subject || 'Notificación',
    html: mailInfo.html || '',
    text: mailInfo.text || (mailInfo.html ? mailInfo.html.replace(/<[^>]+>/g, ' ') : ''),
    cc: mailInfo.cc,
    bcc: mailInfo.bcc,
    attachments: mailInfo.attachments
  });
  return true;
}

/**
 * Usuario creado
 * params: { name, email, phone, role, passwordPlain, showPasswordInEmail }
 */
export async function sendUserCreatedEmail(params = {}) {
  const showPwd =
    params.showPasswordInEmail ??
    String(process.env.EMAIL_SHOW_PASSWORD || '').toLowerCase() === 'true';

    const passwordValue = showPwd && params.passwordPlain
    ? params.passwordPlain
    : '********';

  const phoneBlock = params.phone ? `<li><b>Teléfono:</b> ${params.phone}</li>` : '';

  const html = await renderTemplate('user-created.html', {
    DISPLAY_NAME: process.env.SMTP_DISPLAY_NAME_DEV_YUNDA || 'Neitek',
    YEAR: String(new Date().getFullYear()),
    APP_URL: process.env.APP_URL || '#',
    LOGIN_URL: process.env.LOGIN_URL || (process.env.APP_URL ? `${process.env.APP_URL}/login` : '#'),
    NAME: params.name || params.email || '',
    EMAIL: params.email || '',
    ROLE: params.role || 'user',
    PHONE_BLOCK: phoneBlock,
    USERNAME: params.email || '',
    PASSWORD: passwordValue
  });

  await sendMail({
    to: 'enderson_yundasa@fet.edu.co' || process.env.SMTP_USER_EMAIL_YUNDA,
    subject: 'Tu cuenta ha sido creada',
    html
  });
}

/**
 * Contraseña actualizada
 * params: { email, actor, passwordPlain, showPasswordInEmail }
 *  - actor: 'self' | 'admin'
 */
export async function sendPasswordChangedEmail(params = {}) {
  const showPwd =
    params.showPasswordInEmail ??
    String(process.env.EMAIL_SHOW_PASSWORD || '').toLowerCase() === 'true';

  const passwordValue = showPwd && params.passwordPlain
    ? params.passwordPlain
    : '********';

  const html = await renderTemplate('password-changed.html', {
    DISPLAY_NAME: process.env.SMTP_DISPLAY_NAME_DEV_YUNDA || 'Neitek',
    YEAR: String(new Date().getFullYear()),
    APP_URL: process.env.APP_URL || '#',
    LOGIN_URL: process.env.LOGIN_URL || (process.env.APP_URL ? `${process.env.APP_URL}/login` : '#'),
    EMAIL: params.email || '',
    ACTOR_TEXT: params.actor === 'admin' ? ' por un administrador' : '',
    USERNAME: params.email || '',
    PASSWORD: passwordValue
  });

  await sendMail({
    to: 'enderson_yundasa@fet.edu.co' || process.env.SMTP_USER_EMAIL_YUNDA,
    subject: 'Tu contraseña ha sido actualizada',
    html
  });
}

export async function sendPasswordResetRequestEmail({ email, resetToken }) {
  const baseLogin = process.env.LOGIN_URL || (process.env.APP_URL ? `${process.env.APP_URL}/login` : '#');
  const loginWithToken = `${baseLogin}?resetToken=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;

  const html = await renderTemplate('password-reset-request.html', {
    DISPLAY_NAME: process.env.SMTP_DISPLAY_NAME_DEV_YUNDA || 'Neitek',
    YEAR: String(new Date().getFullYear()),
    APP_URL: process.env.APP_URL || '#',
    LOGIN_WITH_TOKEN_URL: loginWithToken
  });

  await sendMail({
    to: 'enderson_yundasa@fet.edu.co',
    subject: 'Solicitud para actualizar contraseña',
    html
  });
}
