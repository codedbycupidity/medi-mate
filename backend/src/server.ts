import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database';
import medicationRoutes from './routes/medications';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://frontend:3000']
    : process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'MediMate API is running',
    timestamp: new Date().toISOString(),
    service: 'backend'
  });
});

// API Routes
app.use('/api/medications', medicationRoutes);

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MediMate API running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
