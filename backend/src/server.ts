import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security and CORS middleware
app.use(helmet());
app.use(
  cors({
    origin: '*', // Allow all origins for dev/testing ease
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Mini ERP + CRM API Engine',
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found`,
  });
});

// Global Error Middleware
app.use(errorHandler);

// Start HTTP Server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Mini ERP + CRM Backend Server running on port ${PORT} [${config.nodeEnv}]`);
  console.log(`📡 Health Check available at: http://localhost:${PORT}/health`);
});
