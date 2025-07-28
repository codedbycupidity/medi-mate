import express, { Request, Response } from 'express';
import Medication from '../models/Medication';
import mongoose from 'mongoose';

const router = express.Router();

// Get all medications for a user (mock userId for now)
router.get('/', async (_req: Request, res: Response) => {
  try {
    // TODO: Get userId from authenticated user
    const mockUserId = new mongoose.Types.ObjectId();
    
    const medications = await Medication.find({ 
      userId: mockUserId,
      active: true 
    }).sort({ name: 1 });
    
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// Create a new medication
router.post('/', async (req: Request, res: Response) => {
  try {
    // TODO: Get userId from authenticated user
    const mockUserId = new mongoose.Types.ObjectId();
    
    const medication = new Medication({
      ...req.body,
      userId: mockUserId
    });
    
    await medication.save();
    res.status(201).json(medication);
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ error: 'Failed to create medication' });
  }
});

// Update a medication
router.put('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    const medication = await Medication.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    return res.json(medication);
  } catch (error) {
    console.error('Error updating medication:', error);
    return res.status(500).json({ error: 'Failed to update medication' });
  }
});

// Delete a medication (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    const medication = await Medication.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    return res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    return res.status(500).json({ error: 'Failed to delete medication' });
  }
});

export default router;