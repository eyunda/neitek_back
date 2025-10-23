import { Router } from 'express';
import { sendMail } from '../services/mail.service.js';

const router = Router();

router.post('/dev/test-mail', async (req, res) => {
  try {
    await sendMail({
      to: req.body.to,
      subject: 'Prueba SMTP',
      html: '<b>Hola!</b> Esto es una prueba de SMTP.',
      text: 'Hola! Esto es una prueba de SMTP.'
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: e?.message });
  }
});

export default router;
