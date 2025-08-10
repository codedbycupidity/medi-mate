import { useEffect, useRef } from 'react';
import notificationService from '../services/notificationService';
import { api } from '../services/api';

interface Reminder {
  _id: string;
  medicationId: {
    name: string;
    dosage: string;
  };
  time: string;
  status: string;
  nextDue?: Date;
}

export const useReminderNotifications = () => {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedReminders = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkUpcomingReminders = async () => {
      try {
        // Get reminders for the next hour
        const response = await api.get('/reminders/upcoming?hours=1');
        const reminders: Reminder[] = response.data;

        const now = new Date();
        
        reminders.forEach((reminder) => {
          if (!reminder.nextDue) return;
          
          const dueTime = new Date(reminder.nextDue);
          const timeDiff = dueTime.getTime() - now.getTime();
          const minutesUntilDue = Math.floor(timeDiff / 60000);
          
          // Create a unique key for this reminder instance
          const reminderKey = `${reminder._id}-${dueTime.getTime()}`;
          
          // Check if we should notify (within 5 minutes and not already notified)
          if (minutesUntilDue <= 5 && minutesUntilDue >= 0 && !notifiedReminders.current.has(reminderKey)) {
            notifiedReminders.current.add(reminderKey);
            
            // Schedule the notification
            const delay = Math.max(0, timeDiff);
            setTimeout(() => {
              notificationService.showMedicationReminder({
                name: reminder.medicationId.name,
                dosage: reminder.medicationId.dosage,
                time: reminder.time,
                reminderId: reminder._id
              });
            }, delay);
          }
        });

        // Clean up old reminder keys (older than 1 hour)
        const oneHourAgo = now.getTime() - 3600000;
        notifiedReminders.current.forEach((key) => {
          const timestamp = parseInt(key.split('-').pop() || '0');
          if (timestamp < oneHourAgo) {
            notifiedReminders.current.delete(key);
          }
        });
      } catch (error) {
        console.error('Error checking upcoming reminders:', error);
      }
    };

    // Check immediately
    checkUpcomingReminders();

    // Check every minute
    checkIntervalRef.current = setInterval(checkUpcomingReminders, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const markReminderTaken = async (reminderId: string) => {
    try {
      await api.post(`/reminders/${reminderId}/taken`);
      // Remove from notified set so it won't notify again
      notifiedReminders.current.forEach((key) => {
        if (key.startsWith(reminderId)) {
          notifiedReminders.current.delete(key);
        }
      });
    } catch (error) {
      console.error('Error marking reminder as taken:', error);
    }
  };

  const snoozeReminder = async (reminderId: string, minutes: number = 10) => {
    try {
      await api.post(`/reminders/${reminderId}/snooze`, { minutes });
      // Remove from notified set so it can notify again after snooze
      notifiedReminders.current.forEach((key) => {
        if (key.startsWith(reminderId)) {
          notifiedReminders.current.delete(key);
        }
      });
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  return {
    markReminderTaken,
    snoozeReminder
  };
};