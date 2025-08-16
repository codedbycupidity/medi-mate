import React from 'react'
import { Languages, Globe, Sun, Moon, Smartphone, Shield, Settings, AlertCircle } from 'lucide-react'

interface UserProfile {
  _id: string
  name: string
  email: string
  preferences?: {
    language?: string
    timezone?: string
    reminderTimes?: string[]
    notificationMethods?: string[]
    theme?: 'light' | 'dark' | 'system'
  }
  createdAt: string
  updatedAt: string
  [key: string]: any
}

interface PreferencesTabProps {
  profile: UserProfile
  editedProfile: UserProfile
  editing: boolean
  onProfileChange: (updatedProfile: UserProfile) => void
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({
  profile,
  editedProfile,
  editing,
  onProfileChange,
  onThemeChange
}) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-1">Preferences</h2>
      <p className="text-muted-foreground mb-6">Customize your app experience</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            <Languages className="inline h-4 w-4 mr-2" />
            Language
          </label>
          <select
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.preferences?.language || 'en'}
            onChange={(e) => onProfileChange({
              ...editedProfile,
              preferences: { ...editedProfile.preferences, language: e.target.value }
            })}
            disabled={!editing}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="zh">中文</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Globe className="inline h-4 w-4 mr-2" />
            Timezone
          </label>
          <select
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            onChange={(e) => onProfileChange({
              ...editedProfile,
              preferences: { ...editedProfile.preferences, timezone: e.target.value }
            })}
            disabled={!editing}
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-3">Theme</label>
        <p className="text-sm text-muted-foreground mb-3">Choose your preferred color scheme</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            className={`px-4 py-2 border rounded-md ${editedProfile.preferences?.theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            onClick={() => {
              if (editing) {
                onThemeChange('light')
              }
            }}
            disabled={!editing}
          >
            <Sun className="inline h-4 w-4 mr-2" />
            Light
          </button>
          <button
            className={`px-4 py-2 border rounded-md ${editedProfile.preferences?.theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            onClick={() => {
              if (editing) {
                onThemeChange('dark')
              }
            }}
            disabled={!editing}
          >
            <Moon className="inline h-4 w-4 mr-2" />
            Dark
          </button>
          <button
            className={`px-4 py-2 border rounded-md ${editedProfile.preferences?.theme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            onClick={() => {
              if (editing) {
                onThemeChange('system')
              }
            }}
            disabled={!editing}
          >
            <Smartphone className="inline h-4 w-4 mr-2" />
            System
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t">
        <h3 className="font-medium mb-4">Privacy & Security</h3>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 border rounded-md text-left hover:bg-muted">
            <Shield className="inline h-4 w-4 mr-2" />
            Change Password
          </button>
          <button className="w-full px-4 py-2 border rounded-md text-left hover:bg-muted">
            <Settings className="inline h-4 w-4 mr-2" />
            Export Data
          </button>
          <button className="w-full px-4 py-2 border rounded-md text-left hover:bg-destructive/10 text-destructive">
            <AlertCircle className="inline h-4 w-4 mr-2" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}