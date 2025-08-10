import mongoose, { Document, Schema } from 'mongoose';

interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    endpoint: {
      type: String,
      required: true
    },
    keys: {
      p256dh: {
        type: String,
        required: true
      },
      auth: {
        type: String,
        required: true
      }
    },
    expirationTime: {
      type: Number,
      default: null
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
pushSubscriptionSchema.index({ userId: 1, active: 1 });
pushSubscriptionSchema.index({ endpoint: 1 });

const PushSubscription = mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;