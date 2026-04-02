import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import childrenRoutes from './routes/childrenRoutes';
import taskRoutes from './routes/taskRoutes';
import executionRoutes from './routes/executionRoutes';
import adjustmentRoutes from './routes/adjustmentRoutes';

const app: Express = express();

// Request logger middleware (FIRST)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/adjustments', adjustmentRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Basic error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
