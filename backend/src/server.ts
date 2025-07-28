import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

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

// Mock medications endpoint
app.get('/api/medications', (_req: Request, res: Response) => {
  res.json([
    {
      id: '1',
      name: 'Vitamin D',
      dosage: '1000mg',
      frequency: 'Daily',
      time: '08:00',
      instructions: 'Take with breakfast'
    },
    {
      id: '2',
      name: 'Fish Oil',
      dosage: '500mg',
      frequency: 'Twice daily',
      time: '08:00, 18:00',
      instructions: 'Take with meals'
    }
  ]);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MediMate API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
