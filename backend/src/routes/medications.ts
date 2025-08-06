import express, { Request, Response, NextFunction } from 'express';
import Medication from '../models/Medication';
import { authenticate } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { vectorStore } from '../services/vectorStore';

const router = express.Router();

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

// Check for duplicate medication
router.post('/check-duplicate', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, dosage, unit, frequency, instructions } = req.body;
  
  const duplicateCheck = await vectorStore.checkForDuplicate(userId, {
    name,
    dosage,
    unit,
    frequency,
    instructions
  });
  
  res.json({
    status: 'success',
    data: duplicateCheck
  });
}));

// Create a new medication
router.post('/', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  
  // Check for duplicates before creating
  const duplicateCheck = await vectorStore.checkForDuplicate(userId, {
    name: req.body.name,
    dosage: req.body.dosage,
    unit: req.body.unit,
    frequency: req.body.frequency,
    instructions: req.body.instructions
  });
  
  if (duplicateCheck.isDuplicate) {
    res.status(409).json({
      status: 'error',
      message: 'A similar medication already exists',
      data: {
        isDuplicate: true,
        similarity: duplicateCheck.similarity,
        existingMedication: duplicateCheck.existingMedication
      }
    });
    return;
  }
  
  const medication = new Medication({
    ...req.body,
    userId: userId
  });
  
  await medication.save();
  
  // Index the medication in Pinecone
  try {
    await vectorStore.indexMedication(medication);
    medication.embeddingIndexed = true;
    await medication.save();
  } catch (error) {
    console.error('Failed to index medication in vector store:', error);
  }
  
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
  
  // Update the vector index
  try {
    await vectorStore.updateMedicationIndex(medication);
    medication.embeddingIndexed = true;
    await medication.save();
  } catch (error) {
    console.error('Failed to update medication in vector store:', error);
  }
  
  res.json({
    status: 'success',
    data: {
      medication
    }
  });
}));

// Delete a medication (soft delete)
// Get similar medications
router.get('/similar/:name', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name } = req.params;
  const limit = parseInt(req.query.limit as string) || 5;
  
  const similarMedications = await vectorStore.findSimilarMedications(userId, name, limit);
  
  res.json({
    status: 'success',
    data: {
      medications: similarMedications
    }
  });
}));

router.delete('/:id', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId!;
  
  const medication = await Medication.findOneAndUpdate(
    { _id: id, userId: userId },
    { active: false },
    { new: true }
  );
  
  if (!medication) {
    return next(new AppError('Medication not found', 404));
  }
  
  // Remove from vector index
  try {
    await vectorStore.deleteMedicationFromIndex(id, userId);
  } catch (error) {
    console.error('Failed to remove medication from vector store:', error);
  }
  
  res.json({
    status: 'success',
    message: 'Medication deleted successfully'
  });
}));

export default router;