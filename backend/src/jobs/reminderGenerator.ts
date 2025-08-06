import cron from 'node-cron';
import Medication from '../models/Medication';
import Reminder from '../models/Reminder';
import mongoose from 'mongoose';

/**
 * Generate reminders for all active medications
 * Runs daily at 00:01 (12:01 AM)
 */
export function initializeReminderGenerator() {
  // Schedule the job to run daily at 00:01
  cron.schedule('1 0 * * *', async () => {
    console.log('🔔 Running reminder generator job...');
    
    try {
      await generateRemindersForAllUsers();
      console.log('✅ Reminder generation completed');
    } catch (error) {
      console.error('❌ Error generating reminders:', error);
    }
  });

  console.log('📅 Reminder generator job scheduled (runs daily at 00:01)');
}

async function generateRemindersForAllUsers() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get all active medications
    const medications = await Medication.find({ active: true }).session(session);
    
    const remindersToCreate = [];
    const now = new Date();
    const daysToGenerate = 7; // Generate reminders for the next 7 days

    for (const medication of medications) {
      // Check if user has reminders enabled (you might want to add this field to User model)
      // For now, we'll generate for all active medications

      for (let day = 0; day < daysToGenerate; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);

        // Generate reminders for each time slot
        for (const time of medication.times) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledTime = new Date(date);
          scheduledTime.setHours(hours, minutes, 0, 0);

          // Only create future reminders
          if (scheduledTime > now) {
            // Check if reminder already exists
            const existingReminder = await Reminder.findOne({
              userId: medication.userId,
              medicationId: medication._id,
              scheduledTime
            }).session(session);

            if (!existingReminder) {
              remindersToCreate.push({
                userId: medication.userId,
                medicationId: medication._id,
                scheduledTime,
                status: 'pending'
              });
            }
          }
        }
      }
    }

    // Bulk create reminders
    if (remindersToCreate.length > 0) {
      await Reminder.insertMany(remindersToCreate, { session });
      console.log(`📧 Created ${remindersToCreate.length} new reminders`);
    }

    // Mark missed reminders
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const missedCount = await Reminder.updateMany(
      {
        status: 'pending',
        scheduledTime: { $lt: oneDayAgo }
      },
      {
        status: 'missed'
      },
      { session }
    );

    if (missedCount.modifiedCount > 0) {
      console.log(`⚠️  Marked ${missedCount.modifiedCount} reminders as missed`);
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Check for upcoming reminders and trigger notifications
 * Runs every 5 minutes
 */
export function initializeReminderNotifier() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await checkUpcomingReminders();
    } catch (error) {
      console.error('❌ Error checking upcoming reminders:', error);
    }
  });

  console.log('🔔 Reminder notifier job scheduled (runs every 5 minutes)');
}

async function checkUpcomingReminders() {
  const now = new Date();
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

  // Find reminders scheduled in the next 15 minutes
  const upcomingReminders = await Reminder.find({
    status: 'pending',
    scheduledTime: {
      $gte: now,
      $lte: fifteenMinutesFromNow
    }
  }).populate('medicationId', 'name dosage unit');

  for (const reminder of upcomingReminders) {
    // Here you would implement the actual notification logic
    // For example: send push notification, email, SMS, etc.
    const medication = reminder.medicationId as any;
    console.log(`🔔 Reminder: ${medication.name} scheduled at ${reminder.scheduledTime}`);
    
    // You could emit an event here for real-time notifications
    // eventEmitter.emit('reminder:upcoming', reminder);
  }
}