import { Router } from 'express';
import { createPublicResetToken, publicResetPassword } from '../services/password.public.service.js';

const router = Router();

router.post('/password/forgot', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email requerido' });

    const ok = await createPublicResetToken(String(email).trim()); // siempre 200 (no filtra)
    return res.json({ ok: true, message: 'Si el correo existe, se ha enviado un email con instrucciones.' });
  } catch (e) {
    console.error('forgot error:', e);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.post('/password/public-reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'token y newPassword son requeridos' });
    }

    const result = await publicResetPassword(String(token), String(newPassword));
    if (!result.ok) {
      const code = /expir|inválid|no encontrado/i.test(result.message) ? 401 : 400;
      return res.status(code).json({ message: result.message });
    }
    return res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (e) {
    console.error('public-reset error:', e);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

export default router;
