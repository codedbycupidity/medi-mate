import Reminder from '../models/Reminder';
import Medication from '../models/Medication';
import { startOfDay, addDays } from 'date-fns';

/**
 * Mark overdue reminders as missed
 * Reminders that are more than 2 hours past their scheduled time are considered missed
 * BUT: Don't mark as missed if the reminder was manually updated recently (within 5 minutes)
 */
export async function markOverdueRemindersAsMissed(): Promise<number> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const result = await Reminder.updateMany(
    {
      status: 'pending',
      scheduledTime: { $lt: twoHoursAgo },
      // Don't mark as missed if it was recently updated (user might have manually changed it)
      updatedAt: { $lt: fiveMinutesAgo }
    },
    {
      status: 'missed'
    }
  );
  
  return result.modifiedCount || 0;
}

/**
 * Generate reminders for a specific medication
 */
export async function generateRemindersForMedication(
  medicationId: string,
  userId: string,
  days: number = 7
): Promise<any[]> {
  const medication = await Medication.findOne({ _id: medicationId, userId });
  if (!medication || !medication.active) {
    return [];
  }
  
  const reminders = [];
  const now = new Date();
  const startDate = startOfDay(now);
  
  for (let day = 0; day < days; day++) {
    const currentDate = addDays(startDate, day);
    
    for (const time of medication.times) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(currentDate);
      // Set the time in local timezone (the server's timezone)
      // Note: This assumes the server is in the same timezone as the user
      // For production, you'd want to store user timezone and handle properly
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // Adjust for EDT timezone (UTC-4) if needed
      // If the time looks wrong, it's because the server is in UTC
      // and the user entered time in their local timezone
      const serverOffset = scheduledTime.getTimezoneOffset(); // in minutes
      if (serverOffset === 0) { // Server is in UTC
        // Adjust for EDT (UTC-4)
        scheduledTime.setHours(scheduledTime.getHours() + 4);
      }
      
      // Only create future reminders
      if (scheduledTime > now) {
        // Check if reminder already exists
        const existingReminder = await Reminder.findOne({
          userId,
          medicationId: medication._id,
          scheduledTime
        });
        
        if (!existingReminder) {
          reminders.push({
            userId,
            medicationId: (medication._id as any),
            scheduledTime,
            status: 'pending'
          });
        }
      }
    }
  }
  
  if (reminders.length > 0) {
    return await Reminder.insertMany(reminders);
  }
  
  return [];
}

/**
 * Generate reminders for all active medications for a user
 */
export async function generateRemindersForUser(
  userId: string,
  days: number = 7
): Promise<{ created: number; medications: number }> {
  const medications = await Medication.find({ userId, active: true });
  
  let totalCreated = 0;
  let medicationsProcessed = 0;
  
  for (const medication of medications) {
    const created = await generateRemindersForMedication(
      (medication._id as any).toString(),
      userId,
      days
    );
    
    if (created.length > 0) {
      totalCreated += created.length;
      medicationsProcessed++;
    }
  }
  
  return {
    created: totalCreated,
    medications: medicationsProcessed
  };
}

/**
 * Get adherence statistics for a user
 */
export async function getAdherenceStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number;
  taken: number;
  missed: number;
  skipped: number;
  pending: number;
  adherenceRate: number;
}> {
  // First, mark overdue reminders as missed
  await markOverdueRemindersAsMissed();
  
  // Convert userId string to ObjectId for aggregation
  const mongoose = require('mongoose');
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    query.scheduledTime = {};
    if (startDate) query.scheduledTime.$gte = startDate;
    if (endDate) query.scheduledTime.$lte = endDate;
  }
  
  const stats = await Reminder.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const statsObj = stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {} as Record<string, number>);
  
  const values = Object.values(statsObj) as number[];
  const total = values.reduce((sum, count) => sum + count, 0);
  const taken = statsObj.taken || 0;
  const missed = statsObj.missed || 0;
  const skipped = statsObj.skipped || 0;
  const pending = statsObj.pending || 0;
  
  // Calculate adherence rate (taken / (taken + missed))
  const completedReminders = taken + missed;
  const adherenceRate = completedReminders > 0 
    ? Math.round((taken / completedReminders) * 1000) / 10 
    : 0;
  
  return {
    total,
    taken,
    missed,
    skipped,
    pending,
    adherenceRate
  };
}