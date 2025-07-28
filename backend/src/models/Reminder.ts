import mongoose, { Document, Schema } from 'mongoose';

export interface IReminder extends Document {
  userId: mongoose.Types.ObjectId;
  medicationId: mongoose.Types.ObjectId;
  scheduledTime: Date;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  takenAt?: Date;
  notes?: string;
  doseTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reminderSchema = new Schema<IReminder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicationId: {
    type: Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed', 'skipped'],
    default: 'pending'
  },
  takenAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  doseTaken: {
    type: String
  }
}, {
  timestamps: true
});

reminderSchema.index({ userId: 1, scheduledTime: 1 });
reminderSchema.index({ userId: 1, status: 1 });
reminderSchema.index({ medicationId: 1, scheduledTime: 1 });

const Reminder = mongoose.model<IReminder>('Reminder', reminderSchema);

export default Reminder;