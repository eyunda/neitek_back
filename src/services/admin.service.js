import { pool } from '../db.js';
import bcrypt from 'bcrypt';
import { sendUserCreatedEmail } from './mail.service.js';

export async function listUsers() {
  const [rows] = await pool.execute(
    `SELECT 
       u.id, u.name, u.email, u.phone,
       GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ',') AS roles_csv
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id
     ORDER BY u.id`
  );

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    roles: r.roles_csv ? r.roles_csv.split(',') : []
  }));
}

export async function createUser({ name, email, phone, password, role = 'user' }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const password_hash = await bcrypt.hash(String(password), 10);

    const [resUser] = await conn.execute(
      `INSERT INTO users (name, email, phone, password_hash) VALUES (?,?,?,?)`,
      [name, email, phone || null, password_hash]
    );
    const userId = resUser.insertId;

    const [rr] = await conn.execute(`SELECT id FROM roles WHERE name = ? LIMIT 1`, [role]);
    if (!rr.length) throw new Error(`Rol inválido: ${role}`);
    const roleId = rr[0].id;

    await conn.execute(
      `INSERT INTO user_roles (user_id, role_id) VALUES (?,?)`,
      [userId, roleId]
    );

    await conn.commit();

    // 🔔 Email (no bloqueante)
    sendUserCreatedEmail({
      name,
      email,
      phone,
      role,
      passwordPlain: password,
      showPasswordInEmail: true 
    }).catch(() => {});

    return { id: userId, name, email, phone: phone || null, roles: [role] };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
