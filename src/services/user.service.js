import { pool } from '../db.js';

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, password_hash FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, password_hash FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function getUserRoles(userId) {
  const [rows] = await pool.execute(
    `SELECT r.name
     FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?`,
    [userId]
  );
  return rows.map(r => r.name);
}

export async function updateUserPasswordHash(userId, passwordHash) {
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}
