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
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  PersonalInfoTab,
  MedicalInfoTab,
  NotificationsTab,
  PreferencesTab
} from '../components/profile'

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
    <PersonalInfoTab
      profile={profile}
      editedProfile={editedProfile}
      editing={editing}
      onProfileChange={setEditedProfile}
    />
  )

  const renderMedicalInfo = () => (
    <MedicalInfoTab
      profile={profile}
      editedProfile={editedProfile}
      editing={editing}
      onProfileChange={setEditedProfile}
    />
  )

  const renderNotifications = () => (
    <NotificationsTab
      notificationSettings={notificationSettings}
      onSettingsChange={setNotificationSettings}
      onSave={handleSaveNotifications}
      saving={saving}
      browserNotificationStatus={browserNotificationStatus}
      onRequestPermission={handleRequestNotificationPermission}
    />
  )

  const renderPreferences = () => (
    <PreferencesTab
      profile={profile}
      editedProfile={editedProfile}
      editing={editing}
      onProfileChange={setEditedProfile}
      onThemeChange={handleThemeChange}
    />
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