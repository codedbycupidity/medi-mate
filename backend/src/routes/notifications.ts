import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import PushSubscription from '../models/PushSubscription';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

const router = Router();

// Subscribe to push notifications
router.post('/subscribe', authenticate, catchAsync(async (req: any, res: Response) => {
  const { subscription } = req.body;
  
  if (!subscription || !subscription.endpoint) {
    throw new AppError('Invalid subscription data', 400);
  }

  // Save or update subscription for this user
  await PushSubscription.findOneAndUpdate(
    { userId: req.userId },
    {
      userId: req.userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      expirationTime: subscription.expirationTime,
      active: true
    },
    { upsert: true, new: true }
  );

  res.status(201).json({
    message: 'Subscription saved successfully'
  });
}));

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, catchAsync(async (req: any, res: Response) => {
  const { endpoint } = req.body;
  
  await PushSubscription.findOneAndUpdate(
    { userId: req.userId, endpoint },
    { active: false }
  );

  res.json({
    message: 'Unsubscribed successfully'
  });
}));

// Get subscription status
router.get('/status', authenticate, catchAsync(async (req: any, res: Response) => {
  const subscription = await PushSubscription.findOne({
    userId: req.userId,
    active: true
  });

  res.json({
    subscribed: !!subscription,
    subscription: subscription ? {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime
    } : null
  });
}));

// Test notification
router.post('/test', authenticate, catchAsync(async (req: any, res: Response) => {
  const subscription = await PushSubscription.findOne({
    userId: req.userId,
    active: true
  });

  if (!subscription) {
    throw new AppError('No active subscription found', 404);
  }

  // In a real implementation, you would send a push notification here
  // using web-push library
  
  res.json({
    message: 'Test notification queued'
  });
}));

export default router;