import { pool } from '../db.js';

/**
 * Registra un evento en la tabla de histórico.
 * @param {number} userId - Usuario afectado
 * @param {'CREATED'|'UPDATED'|'PASSWORD_CHANGED'|'PASSWORD_RESET_ADMIN'} action
 * @param {object} meta - Datos adicionales (se guardan como JSON)
 * @param {number|null} actorUserId - Quién ejecuta la acción (admin/u otro)
 */
export async function logUserEvent(userId, action, meta = {}, actorUserId = null) {
  const metaJson = JSON.stringify(meta ?? {});
  await pool.execute(
    `INSERT INTO user_history (user_id, action, meta, actor_user_id) VALUES (?,?,?,?)`,
    [userId, action, metaJson, actorUserId]
  );
}
