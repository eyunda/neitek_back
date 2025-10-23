import bcrypt from 'bcrypt';
import { findUserByEmail, updateUserPasswordHash } from './user.service.js';
import { signToken, verifyToken } from './jwt.service.js';
import { logUserEvent } from './history.service.js';
import { sendPasswordResetRequestEmail, sendPasswordChangedEmail } from './mail.service.js';

export async function createPublicResetToken(email) {
  const user = await findUserByEmail(email);
  if (user) {
    const token = signToken({ kind: 'pwd_reset', email: user.email }, '15m'); 
    await sendPasswordResetRequestEmail({
      email: user.email,
      resetToken: token
    }).catch(() => {});
    await logUserEvent(user.id, 'UPDATED', { reason: 'RESET_REQUESTED' }, null);
  }
  return { ok: true };
}

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

  await sendPasswordChangedEmail({
    email: user.email,
    actor: 'admin', 
    passwordPlain: newPassword,
    showPasswordInEmail: true
  }).catch(() => {});

  return { ok: true };
}
