import bcrypt from 'bcrypt';
import { findUserByEmail, getUserRoles } from './user.service.js';
import { signToken } from './jwt.service.js';

export async function validateCredentialsAndIssueToken(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const plain = String(password ?? '').trim();
  const hash  = String(user.password_hash ?? '').trim();

  const ok = await bcrypt.compare(plain, hash);
  if (!ok) return null;

  const roles = await getUserRoles(user.id);

  const userResponse = {
    id: user.id,
    nombre: user.name,
    correo: user.email,
    telefono: user.phone,
    email: user.email,
    roles
  };

  const payload = { id: user.id, email: user.email, roles };
  const accessToken = signToken(payload);

  return { user: userResponse, accessToken };
}
