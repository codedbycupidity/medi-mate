import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Medication from '../models/Medication';
import Reminder from '../models/Reminder';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate';

// Seed data configuration
const EMAIL = 'john.doe@example.com'; // Your test user email
const PASSWORD = 'password123';

// Helper function to generate random adherence (weighted towards good adherence)
// Keeping for potential future use
// function getRandomStatus(): 'taken' | 'missed' | 'skipped' {
//   const rand = Math.random();
//   if (rand < 0.75) return 'taken';      // 75% taken
//   if (rand < 0.90) return 'missed';     // 15% missed
//   return 'skipped';                      // 10% skipped
// }

// Helper function to get status with time-based variation (high adherence)
function getStatusByTime(hour: number): 'taken' | 'missed' | 'skipped' {
  const rand = Math.random();
  
  // Morning (6-12): Very high adherence
  if (hour >= 6 && hour < 12) {
    if (rand < 0.92) return 'taken';
    if (rand < 0.97) return 'missed';
    return 'skipped';
  }
  
  // Afternoon (12-18): High adherence
  if (hour >= 12 && hour < 18) {
    if (rand < 0.88) return 'taken';
    if (rand < 0.95) return 'missed';
    return 'skipped';
  }
  
  // Evening (18-24): Good adherence
  if (hour >= 18 && hour < 24) {
    if (rand < 0.85) return 'taken';
    if (rand < 0.93) return 'missed';
    return 'skipped';
  }
  
  // Night (0-6): Moderate adherence (still good)
  if (rand < 0.80) return 'taken';
  if (rand < 0.92) return 'missed';
  return 'skipped';
}

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create user
    let user = await User.findOne({ email: EMAIL });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash(PASSWORD, 10);
      user = await User.create({
        name: 'John Doe',
        email: EMAIL,
        password: hashedPassword,
        dateOfBirth: new Date('1985-05-15'),
        phone: '+1234567890'
      });
      console.log('Created new user:', EMAIL);
    } else {
      console.log('Found existing user:', EMAIL);
    }

    // Clear existing medications and reminders for this user
    await Medication.deleteMany({ userId: user._id });
    await Reminder.deleteMany({ userId: user._id });
    console.log('Cleared existing data');

    // Create medications with proper schema
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // Started 3 months ago
    
    const medications = [
      {
        name: 'Lisinopril',
        dosage: '10',
        unit: 'mg',
        frequency: 'twice_daily',
        times: ['08:00', '20:00'],
        startDate,
        instructions: 'Take with water',
        sideEffects: ['Dizziness', 'Dry cough'],
        active: true,
        userId: user._id
      },
      {
        name: 'Metformin',
        dosage: '500',
        unit: 'mg',
        frequency: 'twice_daily',
        times: ['09:00', '21:00'],
        startDate,
        instructions: 'Take with meals',
        sideEffects: ['Nausea', 'Stomach upset'],
        active: true,
        userId: user._id
      },
      {
        name: 'Atorvastatin',
        dosage: '20',
        unit: 'mg',
        frequency: 'once_daily',
        times: ['22:00'],
        startDate,
        instructions: 'Take before bedtime',
        sideEffects: ['Muscle pain', 'Headache'],
        active: true,
        userId: user._id
      },
      {
        name: 'Vitamin D3',
        dosage: '2',
        unit: 'tablets',
        frequency: 'once_daily',
        times: ['08:00'],
        startDate,
        instructions: 'Take with breakfast',
        sideEffects: [],
        active: true,
        userId: user._id
      },
      {
        name: 'Aspirin',
        dosage: '81',
        unit: 'mg',
        frequency: 'once_daily',
        times: ['12:00'],
        startDate,
        instructions: 'Take with lunch',
        sideEffects: ['Stomach irritation'],
        active: true,
        userId: user._id
      },
      {
        name: 'Omeprazole',
        dosage: '20',
        unit: 'mg',
        frequency: 'once_daily',
        times: ['07:00'],
        startDate,
        instructions: 'Take 30 minutes before breakfast',
        sideEffects: ['Headache', 'Nausea'],
        active: true,
        userId: user._id
      }
    ];

    const createdMedications = await Medication.insertMany(medications);
    console.log(`Created ${createdMedications.length} medications`);

    // Generate reminders for different time periods
    const reminders: any[] = [];
    const now = new Date();
    
    // Get the start of the current week (Sunday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Generate past reminders (last 365 days for "all time" view)
    for (let daysAgo = 365; daysAgo >= 0; daysAgo--) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      // Skip some days randomly to simulate realistic patterns (but not current week)
      const isCurrentWeek = date >= startOfWeek;
      if (!isCurrentWeek && daysAgo > 30 && Math.random() < 0.2) continue; // Skip only 20% of older days
      
      for (const medication of createdMedications) {
        for (const time of medication.times) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledTime = new Date(date);
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          // Only create past reminders if the scheduled time has passed
          if (scheduledTime < now) {
            const status = getStatusByTime(hours);
            
            const reminder = {
              userId: user._id,
              medicationId: medication._id,
              scheduledTime,
              status,
              takenAt: status === 'taken' ? new Date(scheduledTime.getTime() + Math.random() * 60 * 60 * 1000) : undefined,
              notes: status === 'skipped' && Math.random() < 0.3 ? 'Felt better, skipped dose' : undefined
            };
            
            reminders.push(reminder);
          }
        }
      }
    }
    
    // Generate future reminders (next 7 days)
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
      const date = new Date(now);
      date.setDate(date.getDate() + daysAhead);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      for (const medication of createdMedications) {
        for (const time of medication.times) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledTime = new Date(date);
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          const reminder = {
            userId: user._id,
            medicationId: medication._id,
            scheduledTime,
            status: 'pending'
          };
          
          reminders.push(reminder);
        }
      }
    }
    
    // Generate today's reminders with mixed statuses
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    for (const medication of createdMedications) {
      for (const time of medication.times) {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date(today);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        let status: 'pending' | 'taken' | 'missed' | 'skipped' = 'pending';
        let takenAt = undefined;
        
        // If time has passed, assign a status
        if (scheduledTime < now) {
          status = getStatusByTime(hours);
          if (status === 'taken') {
            takenAt = new Date(scheduledTime.getTime() + Math.random() * 30 * 60 * 1000); // Taken within 30 minutes
          }
        }
        
        const reminder = {
          userId: user._id,
          medicationId: medication._id,
          scheduledTime,
          status,
          takenAt
        };
        
        // Check if we already have this reminder (to avoid duplicates)
        const exists = reminders.some(r => 
          r.medicationId.toString() === (medication._id as any).toString() &&
          r.scheduledTime.getTime() === scheduledTime.getTime()
        );
        
        if (!exists) {
          reminders.push(reminder);
        }
      }
    }
    
    // Insert all reminders
    const createdReminders = await Reminder.insertMany(reminders);
    console.log(`Created ${createdReminders.length} reminders`);
    
    // Calculate statistics
    const stats = {
      total: createdReminders.length,
      taken: createdReminders.filter(r => r.status === 'taken').length,
      missed: createdReminders.filter(r => r.status === 'missed').length,
      skipped: createdReminders.filter(r => r.status === 'skipped').length,
      pending: createdReminders.filter(r => r.status === 'pending').length
    };
    
    console.log('\n📊 Statistics:');
    console.log(`Total reminders: ${stats.total}`);
    console.log(`Taken: ${stats.taken} (${Math.round(stats.taken/stats.total*100)}%)`);
    console.log(`Missed: ${stats.missed} (${Math.round(stats.missed/stats.total*100)}%)`);
    console.log(`Skipped: ${stats.skipped} (${Math.round(stats.skipped/stats.total*100)}%)`);
    console.log(`Pending: ${stats.pending} (${Math.round(stats.pending/stats.total*100)}%)`);
    
    // Calculate date ranges
    const pastReminders = createdReminders.filter(r => r.status !== 'pending');
    if (pastReminders.length > 0) {
      const oldestDate = new Date(Math.min(...pastReminders.map(r => r.scheduledTime.getTime())));
      const newestDate = new Date(Math.max(...pastReminders.map(r => r.scheduledTime.getTime())));
      console.log(`\n📅 Date range: ${oldestDate.toLocaleDateString()} to ${newestDate.toLocaleDateString()}`);
    }
    
    console.log('\n✅ Seeding completed successfully!');
    console.log(`You can now login with: ${EMAIL} / ${PASSWORD}`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed script
seedData();