export interface Reminder {
  id: string;
  userId: string;
  medicationId: string;
  scheduledTime: Date;
  status: ReminderStatus;
  sentAt?: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  MISSED = 'missed',
  CANCELLED = 'cancelled'
}