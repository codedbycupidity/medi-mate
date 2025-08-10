import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import notificationService from '../services/notificationService'
import { 
  UserCircle,
  Stethoscope,
  BellRing,
  Palette,
  Menu,
  X,
  Edit,
  Save,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Bell,
  Shield,
  Settings,
  Check,
  AlertCircle,
  Heart,
  Activity,
  MapPin,
  Languages,
  Moon,
  Sun,
  Smartphone,
  Globe,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface UserProfile {
  _id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  medicalInfo?: {
    bloodType?: string
    allergies?: string[]
    conditions?: string[]
    emergencyContact?: {
      name?: string
      phone?: string
      relationship?: string
    }
  }
  preferences?: {
    language?: string
    timezone?: string
    reminderTimes?: string[]
    notificationMethods?: string[]
    theme?: 'light' | 'dark' | 'system'
  }
  createdAt: string
  updatedAt: string
}

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  reminderAdvance: number
  dailySummary: boolean
  weeklyReport: boolean
}

const sidebarItems = [
  {
    id: 'personal',
    label: 'Personal Information',
    icon: UserCircle,
    description: 'Basic account details'
  },
  {
    id: 'medical',
    label: 'Medical Information',
    icon: Stethoscope,
    description: 'Health and medical data'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellRing,
    description: 'Alert preferences'
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Palette,
    description: 'App customization'
  }
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeSection, setActiveSection] = useState('personal')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [profile, setProfile] = useState<UserProfile>({
    _id: '',
    name: '',
    email: '',
    createdAt: '',
    updatedAt: ''
  })
  
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile)
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    reminderAdvance: 30,
    dailySummary: false,
    weeklyReport: true
  })

  const [stats, setStats] = useState({
    totalMedications: 0,
    activeReminders: 0,
    adherenceRate: 0,
    memberSince: ''
  })

  const [browserNotificationStatus, setBrowserNotificationStatus] = useState<NotificationPermission>('default')

  useEffect(() => {
    fetchUserProfile()
    fetchUserStats()
    initializeNotifications()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        const userProfile: UserProfile = {
          _id: userData._id || userData.id || '',
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone,
          dateOfBirth: userData.dateOfBirth,
          address: userData.address || {},
          medicalInfo: userData.medicalInfo || {},
          preferences: userData.preferences || {
            theme: 'system',
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString()
        }
        
        setProfile(userProfile)
        setEditedProfile(userProfile)
      }
      
      try {
        const response = await api.get('/users/profile')
        if (response.data) {
          setProfile(response.data)
          setEditedProfile(response.data)
        }
      } catch (error) {
        console.log('Using cached profile data')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const initializeNotifications = async () => {
    await notificationService.init()
    setBrowserNotificationStatus(notificationService.getPermissionStatus())
  }

  const handleRequestNotificationPermission = async () => {
    const permission = await notificationService.requestPermission()
    setBrowserNotificationStatus(permission)
    if (permission === 'granted') {
      toast.success('Desktop notifications enabled!')
    } else if (permission === 'denied') {
      toast.error('Desktop notifications blocked. Please enable them in your browser settings.')
    }
  }


  const fetchUserStats = async () => {
    try {
      const [medicationsRes, remindersRes, statsRes] = await Promise.allSettled([
        api.get('/medications'),
        api.get('/reminders?limit=1'),
        api.get('/reminders/stats')
      ])

      const medications = medicationsRes.status === 'fulfilled' 
        ? (medicationsRes.value.data?.medications || [])
        : []
      
      const reminders = remindersRes.status === 'fulfilled'
        ? (remindersRes.value.data || [])
        : []
      
      const adherenceStats = statsRes.status === 'fulfilled'
        ? (statsRes.value.data || {})
        : {}

      let memberSince = new Date().toISOString()
      if (profile.createdAt) {
        memberSince = profile.createdAt
      } else {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            memberSince = userData.createdAt || new Date().toISOString()
          } catch {
            // Use default
          }
        }
      }

      setStats({
        totalMedications: medications.length,
        activeReminders: reminders.filter((r: any) => r.status === 'pending').length,
        adherenceRate: adherenceStats.adherenceRate || 0,
        memberSince
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        const updatedUser = { ...userData, ...editedProfile }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      
      try {
        await api.put('/users/profile', editedProfile)
      } catch (error) {
        console.log('API update failed, using local storage')
      }
      
      setProfile(editedProfile)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedProfile(profile)
    setEditing(false)
  }

  const handleSaveNotifications = async () => {
    try {
      setSaving(true)
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
      toast.success('Notification settings updated')
    } catch (error) {
      console.error('Error updating notifications:', error)
      toast.error('Failed to update notification settings')
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setEditedProfile({
      ...editedProfile,
      preferences: {
        ...editedProfile.preferences,
        theme
      }
    })
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', systemTheme === 'dark')
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderPersonalInfo = () => (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-1">Personal Information</h2>
      <p className="text-muted-foreground mb-6">Your basic account details</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            <User className="inline h-4 w-4 mr-2" />
            Full Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.name}
            onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
            disabled={!editing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            <Mail className="inline h-4 w-4 mr-2" />
            Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.email}
            onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
            disabled={!editing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            <Phone className="inline h-4 w-4 mr-2" />
            Phone
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.phone || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
            disabled={!editing}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            <Calendar className="inline h-4 w-4 mr-2" />
            Date of Birth
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.dateOfBirth || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, dateOfBirth: e.target.value })}
            disabled={!editing}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          <MapPin className="inline h-4 w-4 mr-2" />
          Address
        </label>
        <div className="grid gap-3">
          <input
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            placeholder="Street Address"
            value={editedProfile.address?.street || ''}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              address: { ...editedProfile.address, street: e.target.value }
            })}
            disabled={!editing}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="City"
              value={editedProfile.address?.city || ''}
              onChange={(e) => setEditedProfile({
                ...editedProfile,
                address: { ...editedProfile.address, city: e.target.value }
              })}
              disabled={!editing}
            />
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="State"
              value={editedProfile.address?.state || ''}
              onChange={(e) => setEditedProfile({
                ...editedProfile,
                address: { ...editedProfile.address, state: e.target.value }
              })}
              disabled={!editing}
            />
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="ZIP Code"
              value={editedProfile.address?.zipCode || ''}
              onChange={(e) => setEditedProfile({
                ...editedProfile,
                address: { ...editedProfile.address, zipCode: e.target.value }
              })}
              disabled={!editing}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderMedicalInfo = () => (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-1">Medical Information</h2>
      <p className="text-muted-foreground mb-6">Important health information for your safety</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            <Heart className="inline h-4 w-4 mr-2" />
            Blood Type
          </label>
          <select
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.medicalInfo?.bloodType || ''}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              medicalInfo: { ...editedProfile.medicalInfo, bloodType: e.target.value }
            })}
            disabled={!editing}
          >
            <option value="">Select blood type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          <AlertCircle className="inline h-4 w-4 mr-2" />
          Allergies
        </label>
        <textarea
          className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
          placeholder="List any allergies (one per line)"
          value={editedProfile.medicalInfo?.allergies?.join('\n') || ''}
          onChange={(e) => setEditedProfile({
            ...editedProfile,
            medicalInfo: {
              ...editedProfile.medicalInfo,
              allergies: e.target.value.split('\n').filter(a => a.trim())
            }
          })}
          disabled={!editing}
        />
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          <Activity className="inline h-4 w-4 mr-2" />
          Medical Conditions
        </label>
        <textarea
          className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
          placeholder="List any medical conditions (one per line)"
          value={editedProfile.medicalInfo?.conditions?.join('\n') || ''}
          onChange={(e) => setEditedProfile({
            ...editedProfile,
            medicalInfo: {
              ...editedProfile.medicalInfo,
              conditions: e.target.value.split('\n').filter(c => c.trim())
            }
          })}
          disabled={!editing}
        />
      </div>

      <div className="mt-6 pt-6 border-t">
        <h3 className="font-medium mb-4">Emergency Contact</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">Contact Name</label>
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={editedProfile.medicalInfo?.emergencyContact?.name || ''}
              onChange={(e) => setEditedProfile({
                ...editedProfile,
                medicalInfo: {
                  ...editedProfile.medicalInfo,
                  emergencyContact: {
                    ...editedProfile.medicalInfo?.emergencyContact,
                    name: e.target.value
                  }
                }
              })}
              disabled={!editing}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Phone</label>
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={editedProfile.medicalInfo?.emergencyContact?.phone || ''}
              onChange={(e) => setEditedProfile({
                ...editedProfile,
                medicalInfo: {
                  ...editedProfile.medicalInfo,
                  emergencyContact: {
                    ...editedProfile.medicalInfo?.emergencyContact,
                    phone: e.target.value
                  }
                }
              })}
              disabled={!editing}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Relationship</label>
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={editedProfile.medicalInfo?.emergencyContact?.relationship || ''}
              onChange={(e) => setEditedProfile({
                ...editedProfile,
                medicalInfo: {
                  ...editedProfile.medicalInfo,
                  emergencyContact: {
                    ...editedProfile.medicalInfo?.emergencyContact,
                    relationship: e.target.value
                  }
                }
              })}
              disabled={!editing}
              placeholder="Spouse, Parent, etc."
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotifications = () => (
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
                onClick={handleRequestNotificationPermission}
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
            onClick={() => setNotificationSettings({
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
            onClick={() => setNotificationSettings({
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
            <div className="text-sm text-muted-foreground">Browser push notifications</div>
          </div>
          <button
            className={`px-3 py-1 rounded-md ${notificationSettings.push ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => setNotificationSettings({
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
              onChange={(e) => setNotificationSettings({
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
              onClick={() => setNotificationSettings({
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
              onClick={() => setNotificationSettings({
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
          onClick={handleSaveNotifications}
          disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="inline h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  )

  const renderPreferences = () => (
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
            onChange={(e) => setEditedProfile({
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
            onChange={(e) => setEditedProfile({
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
            onClick={() => handleThemeChange('light')}
            disabled={!editing}
          >
            <Sun className="inline h-4 w-4 mr-2" />
            Light
          </button>
          <button
            className={`px-4 py-2 border rounded-md ${editedProfile.preferences?.theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            onClick={() => handleThemeChange('dark')}
            disabled={!editing}
          >
            <Moon className="inline h-4 w-4 mr-2" />
            Dark
          </button>
          <button
            className={`px-4 py-2 border rounded-md ${editedProfile.preferences?.theme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            onClick={() => handleThemeChange('system')}
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r">
        <div className="flex flex-col w-full">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Profile Settings</h2>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">{item.label}</div>
                        {!isActive && (
                          <div className="text-xs opacity-70">{item.description}</div>
                        )}
                      </div>
                      {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
          
          <div className="p-4 border-t">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-card">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">Profile Settings</h2>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id
                    
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            setActiveSection(item.id)
                            setSidebarOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
              </div>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Edit className="inline h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border rounded-md hover:bg-muted"
                >
                  <X className="inline h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="inline h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">Medications</div>
                <div className="text-2xl font-bold">{stats.totalMedications}</div>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">Reminders</div>
                <div className="text-2xl font-bold">{stats.activeReminders}</div>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">Adherence</div>
                <div className="text-2xl font-bold">{stats.adherenceRate}%</div>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">Member Since</div>
                <div className="text-2xl font-bold">
                  {stats.memberSince && !isNaN(new Date(stats.memberSince).getTime()) 
                    ? format(new Date(stats.memberSince), 'MMM yyyy')
                    : 'N/A'}
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            {activeSection === 'personal' && renderPersonalInfo()}
            {activeSection === 'medical' && renderMedicalInfo()}
            {activeSection === 'notifications' && renderNotifications()}
            {activeSection === 'preferences' && renderPreferences()}
          </div>
        </main>
      </div>
    </div>
  )
}