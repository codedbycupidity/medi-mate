import { api } from './api';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  reminderId?: string;
  medicationName?: string;
  dosage?: string;
  time?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  async init(): Promise<void> {
    if (!this.isSupported) {
      console.log('Notifications are not supported in this browser');
      return;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');

      // Check if user has already granted permission
      if (Notification.permission === 'granted') {
        await this.subscribeToPushNotifications();
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.log('Notifications are not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await this.subscribeToPushNotifications();
        this.showNotification({
          title: 'Notifications Enabled!',
          body: 'You will now receive medication reminders',
          icon: '/favicon/favicon-192x192.png'
        });
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async subscribeToPushNotifications(): Promise<void> {
    if (!this.swRegistration) {
      console.error('Service Worker not registered');
      return;
    }

    try {
      // Get existing subscription or create new one
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('VAPID public key not configured');
          return;
        }
        const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Send subscription to backend
      await this.sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await api.post('/notifications/subscribe', {
        subscription: subscription.toJSON()
      });
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  async showNotification(payload: NotificationPayload): Promise<void> {
    if (Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/favicon/favicon-192x192.png',
      badge: payload.badge || '/favicon/favicon-72x72.png',
      tag: payload.tag || 'medication-reminder',
      requireInteraction: payload.requireInteraction !== false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      data: payload,
      actions: payload.actions || []
    };

    if (this.swRegistration && this.swRegistration.active) {
      // Use service worker to show notification
      await this.swRegistration.showNotification(payload.title, options);
    } else {
      // Fallback to regular notification
      new Notification(payload.title, options);
    }
  }

  async showMedicationReminder(medication: {
    name: string;
    dosage: string;
    time: string;
    reminderId: string;
  }): Promise<void> {
    await this.showNotification({
      title: `Time for ${medication.name}`,
      body: `Take ${medication.dosage} now`,
      tag: `medication-${medication.reminderId}`,
      reminderId: medication.reminderId,
      medicationName: medication.name,
      dosage: medication.dosage,
      time: medication.time,
      requireInteraction: true,
      actions: [
        { action: 'take', title: 'Mark as Taken', icon: '/icons/check.png' },
        { action: 'snooze', title: 'Snooze 10 min', icon: '/icons/clock.png' }
      ]
    });
  }


  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) {
      return 'denied';
    }
    return Notification.permission;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  async unsubscribe(): Promise<void> {
    if (!this.swRegistration) {
      return;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await api.post('/notifications/unsubscribe', {
          endpoint: subscription.endpoint
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;