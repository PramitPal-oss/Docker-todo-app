import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import todoRoutes from './routes/todoRoutes';
import logRoutes from './routes/logRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import logger from './config/logger';

dotenv.config();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin.split(',') }));
app.use(express.json());

// Basic request logging
app.use((req: Request, res: Response, next) => {
  logger.http?.(`${req.method} ${req.originalUrl}`) ?? logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Server is healthy' });
});

app.use('/api/todos', todoRoutes);
app.use('/api/logs', logRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
