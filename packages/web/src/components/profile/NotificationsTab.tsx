import React from 'react'
import { Bell, Clock, Check, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import notificationService from '../../services/notificationService'

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  reminderAdvance: number
  dailySummary: boolean
  weeklyReport: boolean
}

interface NotificationsTabProps {
  notificationSettings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
  onSave: () => Promise<void>
  saving: boolean
  browserNotificationStatus: NotificationPermission
  onRequestPermission: () => Promise<void>
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notificationSettings,
  onSettingsChange,
  onSave,
  saving,
  browserNotificationStatus,
  onRequestPermission
}) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-1">Notification Settings</h2>
      <p className="text-muted-foreground mb-6">Choose how you want to receive reminders</p>
      
      {/* Desktop Notification Permission */}
      <div className="mb-6 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Desktop Notifications
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {browserNotificationStatus === 'granted' 
                ? 'Notifications are enabled for medication reminders'
                : browserNotificationStatus === 'denied'
                ? 'Notifications are blocked in browser settings'
                : 'Enable notifications to receive medication reminders'}
            </div>
          </div>
          <div className="flex gap-2">
            {browserNotificationStatus !== 'granted' && (
              <button
                onClick={onRequestPermission}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Enable
              </button>
            )}
            {browserNotificationStatus === 'granted' && (
              <div className="px-3 py-2 bg-success/20 text-success rounded-md flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span className="text-sm">Enabled</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Email Notifications</div>
            <div className="text-sm text-muted-foreground">Receive medication reminders via email</div>
          </div>
          <button
            className={`px-3 py-1 rounded-md ${notificationSettings.email ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => onSettingsChange({
              ...notificationSettings,
              email: !notificationSettings.email
            })}
          >
            {notificationSettings.email ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">SMS Notifications</div>
            <div className="text-sm text-muted-foreground">Get text message reminders</div>
          </div>
          <button
            className={`px-3 py-1 rounded-md ${notificationSettings.sms ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => onSettingsChange({
              ...notificationSettings,
              sms: !notificationSettings.sms
            })}
          >
            {notificationSettings.sms ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Push Notifications</div>
            <div className="text-sm text-muted-foreground">Mobile app notifications</div>
          </div>
          <button
            className={`px-3 py-1 rounded-md ${notificationSettings.push ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => onSettingsChange({
              ...notificationSettings,
              push: !notificationSettings.push
            })}
          >
            {notificationSettings.push ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Clock className="inline h-4 w-4 mr-2" />
              Reminder Advance Time
            </label>
            <select
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={notificationSettings.reminderAdvance}
              onChange={(e) => onSettingsChange({
                ...notificationSettings,
                reminderAdvance: parseInt(e.target.value)
              })}
            >
              <option value="5">5 minutes before</option>
              <option value="10">10 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Daily Summary</div>
              <div className="text-sm text-muted-foreground">Receive a daily medication summary</div>
            </div>
            <button
              className={`px-3 py-1 rounded-md ${notificationSettings.dailySummary ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              onClick={() => onSettingsChange({
                ...notificationSettings,
                dailySummary: !notificationSettings.dailySummary
              })}
            >
              {notificationSettings.dailySummary ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Report</div>
              <div className="text-sm text-muted-foreground">Get weekly adherence reports</div>
            </div>
            <button
              className={`px-3 py-1 rounded-md ${notificationSettings.weeklyReport ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              onClick={() => onSettingsChange({
                ...notificationSettings,
                weeklyReport: !notificationSettings.weeklyReport
              })}
            >
              {notificationSettings.weeklyReport ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="inline h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  )
}