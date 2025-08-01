export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[];
  startDate: Date;
  endDate?: Date;
  notes?: string;
  refillReminder?: boolean;
  refillDate?: Date;
  remainingQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum MedicationFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  AS_NEEDED = 'as_needed',
  CUSTOM = 'custom'
}

export interface MedicationSchedule {
  medicationId: string;
  scheduledTime: Date;
  taken: boolean;
  takenAt?: Date;
  skipped: boolean;
  skippedReason?: string;
}