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

app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', authRoutes);

app.use('/api', devRoutes);

app.use('/api', passwordPublicRoutes);

export default app;
