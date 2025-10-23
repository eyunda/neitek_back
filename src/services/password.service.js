import bcrypt from 'bcrypt';
import { findUserByEmail, findUserById, updateUserPasswordHash } from './user.service.js';
import { logUserEvent } from './history.service.js';
import { sendPasswordChangedEmail } from './mail.service.js';

export async function changeOwnPassword(userId, currentPassword, newPassword) {
  const user = await findUserById(userId);
  if (!user) return { ok: false, code: 404, message: 'Usuario no encontrado' };

  const plainCurrent = String(currentPassword ?? '').trim();
  const ok = await bcrypt.compare(plainCurrent, String(user.password_hash || '').trim());
  if (!ok) return { ok: false, code: 401, message: 'Contraseña actual incorrecta' };

  const passwordHash = await bcrypt.hash(String(newPassword ?? ''), 10);
  await updateUserPasswordHash(user.id, passwordHash);

  await logUserEvent(user.id, 'PASSWORD_CHANGED', { by: 'self' }, user.id);

  await sendPasswordChangedEmail({
    email: user.email,
    actor: 'admin',
    passwordPlain: newPassword,
    showPasswordInEmail: true 
  }).catch(() => {});

  return { ok: true };
}

export async function adminResetPasswordByEmail(email, newPassword, actorUserId) {
  const user = await findUserByEmail(String(email ?? '').trim());
  if (!user) return { ok: false, code: 404, message: 'Usuario no encontrado' };

  const passwordHash = await bcrypt.hash(String(newPassword ?? ''), 10);
  await updateUserPasswordHash(user.id, passwordHash);

  await logUserEvent(user.id, 'PASSWORD_RESET_ADMIN', { by: 'admin', email }, actorUserId || null);

  await sendPasswordChangedEmail({
    email: user.email,
    actor: 'admin',
    passwordPlain: newPassword, 
    showPasswordInEmail: true 
  }).catch(() => {});

  return { ok: true };
}
