import { Router } from 'express';
import { validateCredentialsAndIssueToken } from '../services/auth.service.js';
import { requireAuth } from '../services/jwt.service.js';
import { adminResetPasswordByEmail, changeOwnPassword } from '../services/password.service.js';
import { createUser, listUsers } from '../services/admin.service.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email y password son requeridos' });
    }

    const result = await validateCredentialsAndIssueToken(email, password);
    if (!result) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    return res.status(200).json({
      ...result,
      expiresIn: process.env.JWT_EXPIRES || '1h'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ auth: req.user });
});

router.post('/password/change', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword y newPassword son requeridos' });
    }
    const result = await changeOwnPassword(req.user.id, currentPassword, newPassword);
    if (!result.ok) return res.status(result.code || 400).json({ message: result.message });
    return res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (e) {
    console.error('password/change error:', e);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.post('/password/admin-reset', requireAuth, async (req, res) => {
  try {
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'email y newPassword son requeridos' });
    }

    const result = await adminResetPasswordByEmail(email, newPassword, req.user.id);
    if (!result.ok) return res.status(result.code || 400).json({ message: result.message });

    return res.json({ ok: true, message: 'Contraseña reseteada por admin' });
  } catch (e) {
    console.error('password/admin-reset error:', e);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

function requireAdmin(req, res, next) {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  if (!roles.includes('admin')) return res.status(403).json({ message: 'No autorizado' });
  next();
}

router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (e) {
    console.error('admin:listUsers', e);
    res.status(500).json({ message: 'Error al listar usuarios' });
  }
});

router.post('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, role = 'user' } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email y password son requeridos' });
    }
    const created = await createUser({ name, email, phone, password, role });
    res.status(201).json(created);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email ya registrado' });
    }
    console.error('admin:createUser', e);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

export default router;
