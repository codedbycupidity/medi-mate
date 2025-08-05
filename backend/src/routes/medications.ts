import express, { Request, Response, NextFunction } from 'express';
import Medication from '../models/Medication';
import { authenticate } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import ocrRouter from './medications-ocr';

const router = express.Router();

// Mount OCR sub-router
router.use('/', ocrRouter);

// Extended Request interface for authenticated routes
interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}

// Get all medications for a user
router.get('/', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  
  const medications = await Medication.find({ 
    userId: userId,
    active: true 
  }).sort({ name: 1 });
  
  res.json({
    status: 'success',
    results: medications.length,
    data: {
      medications
    }
  });
}));

// Create a new medication
router.post('/', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  
  const medication = new Medication({
    ...req.body,
    userId: userId
  });
  
  await medication.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      medication
    }
  });
}));

// Update a medication
router.put('/:id', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;
  
  const medication = await Medication.findOneAndUpdate(
    { _id: id, userId: userId },
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!medication) {
    return next(new AppError('Medication not found', 404));
  }
  
  res.json({
    status: 'success',
    data: {
      medication
    }
  });
}));

// Delete a medication (soft delete)
router.delete('/:id', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;
  
  const medication = await Medication.findOneAndUpdate(
    { _id: id, userId: userId },
    { active: false },
    { new: true }
  );
  
  if (!medication) {
    return next(new AppError('Medication not found', 404));
  }
  
  res.json({
    status: 'success',
    message: 'Medication deleted successfully'
  });
}));

export default router;