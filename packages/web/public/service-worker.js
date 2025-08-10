/* eslint-disable no-restricted-globals */

// Install event - cache resources
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push event - show notification when push received
self.addEventListener('push', (event) => {
  
  let data = {
    title: 'Medication Reminder',
    body: 'Time to take your medication',
    icon: '/favicon/favicon-192x192.png',
    badge: '/favicon/favicon-72x72.png',
    timestamp: Date.now(),
    requireInteraction: true,
    actions: [
      { action: 'take', title: 'Mark as Taken' },
      { action: 'snooze', title: 'Snooze 10 min' }
    ]
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: data.tag || 'medication-reminder',
    requireInteraction: data.requireInteraction !== false,
    timestamp: data.timestamp,
    data: data,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();

  if (event.action === 'take') {
    // Mark medication as taken
    clients.openWindow('/reminders?action=mark-taken&id=' + event.notification.data.reminderId);
  } else if (event.action === 'snooze') {
    // Snooze for 10 minutes
    clients.openWindow('/reminders?action=snooze&id=' + event.notification.data.reminderId);
  } else {
    // Open the app
    clients.openWindow('/reminders');
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncReminders());
  }
});

async function syncReminders() {
  try {
    const response = await fetch('/api/reminders/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lastSync: await getLastSyncTime()
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      await updateLastSyncTime(Date.now());
      return data;
    }
  } catch (error) {
    console.error('Error syncing reminders:', error);
  }
}

async function getLastSyncTime() {
  // Implementation would use IndexedDB or similar
  return localStorage.getItem('lastSyncTime') || 0;
}

async function updateLastSyncTime(time) {
  localStorage.setItem('lastSyncTime', time);
}