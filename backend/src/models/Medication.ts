import mongoose, { Document, Schema } from 'mongoose';

export interface IMedication extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  times: string[];
  startDate: Date;
  endDate?: Date;
  instructions?: string;
  sideEffects?: string[];
  refillReminder?: boolean;
  refillDate?: Date;
  quantity?: number;
  prescribedBy?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicationSchema = new Schema<IMedication>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['mg', 'g', 'mcg', 'ml', 'drops', 'tablets', 'capsules', 'injections']
  },
  frequency: {
    type: String,
    required: true,
    enum: ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'weekly', 'monthly']
  },
  times: [{
    type: String,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  instructions: {
    type: String,
    maxlength: 500
  },
  sideEffects: [{
    type: String
  }],
  refillReminder: {
    type: Boolean,
    default: false
  },
  refillDate: {
    type: Date
  },
  quantity: {
    type: Number,
    min: 0
  },
  prescribedBy: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

medicationSchema.index({ userId: 1, active: 1 });
medicationSchema.index({ userId: 1, name: 1 });

const Medication = mongoose.model<IMedication>('Medication', medicationSchema);

export default Medication;