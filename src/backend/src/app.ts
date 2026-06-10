import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import authRoutes from './routes/auth.js';
import clientesRoutes from './routes/clientes.js';
import polizasRoutes from './routes/polizas.js';
import dashboardRoutes from './routes/dashboard.js';
import aseguradorasRoutes from './routes/aseguradoras.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/polizas', polizasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/aseguradoras', aseguradorasRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
