import express, { Request, Response } from 'express';
import Reminder from '../models/Reminder';
import Medication from '../models/Medication';
import { authenticate } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { generateOptimalSchedule, optimizeExistingSchedule } from '../services/aiScheduler';
import { 
  markOverdueRemindersAsMissed, 
  generateRemindersForUser, 
  getAdherenceStats 
} from '../services/reminderService';

const router = express.Router();

// Extended Request interface for authenticated routes
interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}

/**
 * GET /api/reminders
 * Get all reminders for a user with optional filters
 */
router.get('/', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { 
    status, 
    date, 
    startDate, 
    endDate, 
    medicationId,
    page = '1',
    limit = '20'
  } = req.query;

  const query: any = { userId: req.userId };

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by medication
  if (medicationId) {
    query.medicationId = medicationId;
  }

  // Filter by date range
  if (date) {
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);
    query.scheduledTime = { $gte: startOfDay, $lte: endOfDay };
  } else if (startDate || endDate) {
    query.scheduledTime = {};
    if (startDate) {
      query.scheduledTime.$gte = new Date(startDate as string);
    }
    if (endDate) {
      query.scheduledTime.$lte = new Date(endDate as string);
    }
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const [reminders, total] = await Promise.all([
    Reminder.find(query)
      .populate('medicationId', 'name dosage unit')
      .sort({ scheduledTime: -1 })
      .skip(skip)
      .limit(limitNum),
    Reminder.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: reminders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
}));

/**
 * GET /api/reminders/today
 * Get today's reminders for a user
 */
router.get('/today', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  // First mark overdue reminders as missed
  await markOverdueRemindersAsMissed();
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const reminders = await Reminder.find({
    userId: req.userId,
    scheduledTime: { $gte: startOfDay, $lte: endOfDay }
  })
    .populate('medicationId', 'name dosage unit instructions')
    .sort({ scheduledTime: 1 });

  res.json({
    success: true,
    data: reminders
  });
}));

/**
 * GET /api/reminders/upcoming
 * Get upcoming reminders (next 24 hours)
 */
router.get('/upcoming', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const reminders = await Reminder.find({
    userId: req.userId,
    scheduledTime: { $gte: now, $lte: tomorrow },
    status: 'pending'
  })
    .populate('medicationId', 'name dosage unit instructions')
    .sort({ scheduledTime: 1 })
    .limit(10);

  res.json({
    success: true,
    data: reminders
  });
}));

/**
 * GET /api/reminders/stats
 * Get reminder statistics for a user
 */
router.get('/stats', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const stats = await getAdherenceStats(
    req.userId!,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * POST /api/reminders/ai-schedule
 * Generate AI-optimized reminder schedule for a medication
 */
router.post('/ai-schedule', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { medicationId, userPreferences } = req.body;

  if (!medicationId) {
    throw new AppError('Medication ID is required', 400);
  }

  // Get medication details
  const medication = await Medication.findOne({
    _id: medicationId,
    userId: req.userId
  });

  if (!medication) {
    throw new AppError('Medication not found', 404);
  }

  // Generate AI-optimized schedule
  const schedule = await generateOptimalSchedule(medication, userPreferences);

  res.json({
    success: true,
    data: {
      medicationId,
      medicationName: medication.name,
      currentSchedule: medication.times,
      recommendedSchedule: schedule
    }
  });
}));

/**
 * POST /api/reminders/optimize-all
 * Optimize reminder schedules for all medications using AI
 */
router.post('/optimize-all', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { userPreferences } = req.body;

  // Get all active medications for the user
  const medications = await Medication.find({
    userId: req.userId,
    active: true
  });

  if (medications.length === 0) {
    throw new AppError('No active medications found', 404);
  }

  // Generate optimized schedules for all medications
  const recommendations = await optimizeExistingSchedule(medications, userPreferences);

  // Convert recommendations to response format
  const optimizedSchedules = Array.from(recommendations.entries()).map(([medId, schedule]) => {
    const medication = medications.find(m => (m._id as any).toString() === medId);
    return {
      medicationId: medId,
      medicationName: medication?.name,
      currentSchedule: medication?.times,
      recommendedSchedule: schedule
    };
  });

  res.json({
    success: true,
    data: {
      medications: optimizedSchedules,
      summary: `Optimized schedules for ${optimizedSchedules.length} medications`
    }
  });
}));

/**
 * PUT /api/reminders/revert-schedule
 * Revert medication schedule and clean up recently created reminders
 */
router.put('/revert-schedule', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { medicationId, times, cleanupReminders = true, regenerateOriginal = true } = req.body;

  if (!medicationId || !times || !Array.isArray(times)) {
    throw new AppError('Medication ID and times array are required', 400);
  }

  // Update the medication times back to original
  const medication = await Medication.findOneAndUpdate(
    {
      _id: medicationId,
      userId: req.userId
    },
    { times },
    { new: true }
  );

  if (!medication) {
    throw new AppError('Medication not found', 404);
  }

  let deletedCount = 0;
  if (cleanupReminders) {
    // Delete all future pending reminders for this medication
    // This ensures we clean up any reminders created by the AI schedule
    const now = new Date();
    const result = await Reminder.deleteMany({
      medicationId,
      userId: req.userId,
      status: 'pending',
      scheduledTime: { $gte: now }
    });
    deletedCount = result.deletedCount || 0;
    
    console.log(`Deleted ${deletedCount} future reminders for medication ${medicationId}`);
  }

  // Regenerate reminders with the original schedule if requested
  let createdCount = 0;
  if (regenerateOriginal && times.length > 0) {
    const today = new Date();
    const newReminders = [];
    
    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, create for tomorrow
      if (scheduledTime < new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      newReminders.push({
        userId: req.userId,
        medicationId: medication._id,
        scheduledTime,
        status: 'pending'
      });
    }
    
    const createdReminders = await Reminder.insertMany(newReminders);
    createdCount = createdReminders.length;
    console.log(`Created ${createdCount} reminders with original schedule for medication ${medicationId}`);
  }

  res.json({
    success: true,
    message: `Schedule reverted successfully${deletedCount > 0 ? `, ${deletedCount} AI reminders removed` : ''}${createdCount > 0 ? `, and ${createdCount} original reminders restored` : ''}`,
    data: { 
      medication, 
      deletedReminders: deletedCount,
      createdReminders: createdCount
    }
  });
}));

/**
 * PUT /api/reminders/apply-ai-schedule
 * Apply AI-recommended schedule to a medication
 */
router.put('/apply-ai-schedule', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { medicationId, times } = req.body;

  if (!medicationId || !times || !Array.isArray(times)) {
    throw new AppError('Medication ID and times array are required', 400);
  }

  // Update medication with new times
  const medication = await Medication.findOneAndUpdate(
    {
      _id: medicationId,
      userId: req.userId
    },
    { times },
    { new: true }
  );

  if (!medication) {
    throw new AppError('Medication not found', 404);
  }

  // Delete existing future reminders for this medication
  await Reminder.deleteMany({
    medicationId,
    userId: req.userId,
    scheduledTime: { $gte: new Date() },
    status: 'pending'
  });

  // Generate new reminders with updated schedule
  const today = new Date();
  
  const newReminders = [];
  for (const time of times) {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date(today);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, create for tomorrow
    if (scheduledTime < new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    newReminders.push({
      userId: req.userId,
      medicationId: medication._id,
      scheduledTime,
      status: 'pending'
    });
  }

  const createdReminders = await Reminder.insertMany(newReminders);

  res.json({
    success: true,
    message: 'AI-optimized schedule applied successfully',
    data: {
      medication,
      remindersCreated: createdReminders.length
    }
  });
}));

/**
 * GET /api/reminders/:id
 * Get a specific reminder
 */
router.get('/:id', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const reminder = await Reminder.findOne({
    _id: req.params.id,
    userId: req.userId
  }).populate('medicationId');

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  res.json({
    success: true,
    data: reminder
  });
}));

/**
 * POST /api/reminders/generate
 * Generate reminders for all active medications
 */
router.post('/generate', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { days = 7 } = req.body;
  
  const result = await generateRemindersForUser(req.userId!, days);

  res.status(201).json({
    success: true,
    message: `Generated ${result.created} reminders for ${result.medications} medications`,
    data: result
  });
}));

/**
 * PUT /api/reminders/:id
 * Update a reminder (mark as taken, missed, etc.)
 */
router.put('/:id', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { status, notes, doseTaken } = req.body;

  const reminder = await Reminder.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  // Update reminder
  if (status) {
    reminder.status = status;
    if (status === 'taken') {
      reminder.takenAt = new Date();
    }
  }

  if (notes !== undefined) {
    reminder.notes = notes;
  }

  if (doseTaken !== undefined) {
    reminder.doseTaken = doseTaken;
  }

  await reminder.save();

  const updatedReminder = await Reminder.findById(reminder._id)
    .populate('medicationId', 'name dosage unit');

  res.json({
    success: true,
    data: updatedReminder
  });
}));

/**
 * DELETE /api/reminders/bulk
 * Delete multiple reminders
 */
router.delete('/bulk', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError('Please provide an array of reminder IDs', 400);
  }
  
  const result = await Reminder.deleteMany({
    _id: { $in: ids },
    userId: req.userId
  });
  
  res.json({
    success: true,
    message: `${result.deletedCount} reminder(s) deleted successfully`,
    data: {
      deletedCount: result.deletedCount
    }
  });
}));

/**
 * DELETE /api/reminders/:id
 * Delete a reminder
 */
router.delete('/:id', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const reminder = await Reminder.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  res.json({
    success: true,
    message: 'Reminder deleted successfully'
  });
}));

/**
 * POST /api/reminders/:id/take
 * Quick action to mark a reminder as taken
 */
router.post('/:id/take', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const reminder = await Reminder.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  reminder.status = 'taken';
  reminder.takenAt = new Date();
  await reminder.save();

  const updatedReminder = await Reminder.findById(reminder._id)
    .populate('medicationId', 'name dosage unit');

  res.json({
    success: true,
    data: updatedReminder
  });
}));

/**
 * POST /api/reminders/:id/skip
 * Quick action to mark a reminder as skipped
 */
router.post('/:id/skip', authenticate, catchAsync(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;

  const reminder = await Reminder.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  reminder.status = 'skipped';
  if (reason) {
    reminder.notes = reason;
  }
  await reminder.save();

  const updatedReminder = await Reminder.findById(reminder._id)
    .populate('medicationId', 'name dosage unit');

  res.json({
    success: true,
    data: updatedReminder
  });
}));

export default router;