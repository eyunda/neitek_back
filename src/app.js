// src/app.js
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import devRoutes from './routes/dev.routes.js';
import passwordPublicRoutes from './routes/password.public.routes.js';

const app = express();

app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Parsers
app.use(express.json());

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Rutas
app.use('/api', authRoutes);

//envio de correo pruebas
app.use('/api', devRoutes);

//olvido la contraseña
app.use('/api', passwordPublicRoutes);

export default app;
