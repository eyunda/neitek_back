import bcrypt from 'bcrypt';
import { findUserByEmail, updateUserPasswordHash } from './user.service.js';
import { signToken, verifyToken } from './jwt.service.js';
import { logUserEvent } from './history.service.js';
import { sendPasswordResetRequestEmail, sendPasswordChangedEmail } from './mail.service.js';

/** Genera un token de reset (JWT firmado, sin guardar en BD) y envía el correo con botón */
export async function createPublicResetToken(email) {
  const user = await findUserByEmail(email);
  // Para no filtrar si existe o no, siempre retornamos ok, pero solo enviamos correo si existe:
  if (user) {
    const token = signToken({ kind: 'pwd_reset', email: user.email }, '15m'); // 15 minutos
    await sendPasswordResetRequestEmail({
      email: user.email,
      resetToken: token
    }).catch(() => {});
    await logUserEvent(user.id, 'UPDATED', { reason: 'RESET_REQUESTED' }, null);
  }
  return { ok: true };
}

/** Verifica token y actualiza contraseña sin sesión */
export async function publicResetPassword(token, newPassword) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return { ok: false, message: 'Token inválido o expirado' };
  }

  if (!payload || payload.kind !== 'pwd_reset' || !payload.email) {
    return { ok: false, message: 'Token inválido' };
  }

  const user = await findUserByEmail(payload.email);
  if (!user) return { ok: false, message: 'Usuario no encontrado' };

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await updateUserPasswordHash(user.id, passwordHash);
  await logUserEvent(user.id, 'PASSWORD_CHANGED', { by: 'public-reset' }, null);

  // correo de confirmación
  await sendPasswordChangedEmail({
    email: user.email,
    actor: 'admin',         // o 'self'; aquí fue vía enlace
    passwordPlain: newPassword,
    showPasswordInEmail: true
  }).catch(() => {});

  return { ok: true };
}
