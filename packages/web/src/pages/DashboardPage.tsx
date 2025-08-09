import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Pill, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  ArrowRight,
  Bell,
  Target,
  Award
} from 'lucide-react'
import { format, differenceInMinutes, isToday, isTomorrow } from 'date-fns'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalMedications: number
  activeMedications: number
  todayReminders: number
  upcomingReminders: number
  takenToday: number
  missedToday: number
  weeklyAdherence: number
  monthlyAdherence: number
}

interface UpcomingReminder {
  _id: string
  medicationId: {
    _id: string
    name: string
    dosage: string
    unit: string
  }
  scheduledTime: string
  status: string
}

interface RecentActivity {
  _id: string
  type: 'taken' | 'missed' | 'skipped' | 'added'
  medicationName: string
  time: string
  dosage?: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalMedications: 0,
    activeMedications: 0,
    todayReminders: 0,
    upcomingReminders: 0,
    takenToday: 0,
    missedToday: 0,
    weeklyAdherence: 0,
    monthlyAdherence: 0
  })
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetchDashboardData()
    // Get user name from localStorage
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        setUserName(userData.name || 'User')
      } catch {
        setUserName('User')
      }
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel with individual error handling
      const [medicationsRes, remindersRes, statsRes, upcomingRes] = await Promise.allSettled([
        api.get('/medications'),
        api.get('/reminders/today?timezoneOffset=' + new Date().getTimezoneOffset()),
        api.get('/reminders/stats'),
        api.get('/reminders/upcoming?limit=5')
      ])

      // Process medications data
      const medications = medicationsRes.status === 'fulfilled' 
        ? (medicationsRes.value.data?.medications || medicationsRes.value.data || medicationsRes.value || [])
        : []
      const activeMeds = medications.filter((med: any) => med.active !== false)

      // Process reminders data
      const todayReminders = remindersRes.status === 'fulfilled'
        ? (remindersRes.value.data || remindersRes.value || [])
        : []
      const taken = todayReminders.filter((r: any) => r.status === 'taken').length
      const missed = todayReminders.filter((r: any) => r.status === 'missed').length

      // Process stats
      const statsData = statsRes.status === 'fulfilled'
        ? (statsRes.value.data || statsRes.value || {})
        : {}

      // Process upcoming reminders
      const upcomingData = upcomingRes.status === 'fulfilled'
        ? (upcomingRes.value.data || upcomingRes.value || [])
        : []

      // Set dashboard stats
      setStats({
        totalMedications: medications.length,
        activeMedications: activeMeds.length,
        todayReminders: todayReminders.length,
        upcomingReminders: upcomingData.length,
        takenToday: taken,
        missedToday: missed,
        weeklyAdherence: statsData.adherenceRate || 0,
        monthlyAdherence: statsData.monthlyAdherence || statsData.adherenceRate || 0
      })

      // Set upcoming reminders (first 5)
      setUpcomingReminders(upcomingData.slice(0, 5))

      // Create recent activity from today's reminders
      const activities: RecentActivity[] = todayReminders
        .filter((r: any) => r.status !== 'pending')
        .map((r: any) => ({
          _id: r._id,
          type: r.status,
          medicationName: r.medicationId?.name || 'Unknown',
          time: r.takenAt || r.scheduledTime,
          dosage: `${r.medicationId?.dosage} ${r.medicationId?.unit}`
        }))
        .slice(0, 5)
      
      setRecentActivity(activities)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getTimeUntil = (scheduledTime: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const minutes = differenceInMinutes(scheduled, now)
    
    if (minutes < 0) return 'Overdue'
    if (minutes < 60) return `${minutes} min`
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`
    return format(scheduled, 'MMM d')
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'missed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'skipped':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAdherenceIcon = (rate: number) => {
    if (rate >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (rate >= 60) return <Activity className="h-4 w-4 text-yellow-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/medications/add')} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
          <Button onClick={() => navigate('/reminders/create')}>
            <Bell className="mr-2 h-4 w-4" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMedications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalMedications} total medications
            </p>
            <Button 
              variant="link" 
              className="px-0 mt-2 h-auto text-xs"
              onClick={() => navigate('/medications')}
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.takenToday}/{stats.todayReminders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.missedToday > 0 && `${stats.missedToday} missed`}
              {stats.missedToday === 0 && 'Great job!'}
            </p>
            <Button 
              variant="link" 
              className="px-0 mt-2 h-auto text-xs"
              onClick={() => navigate('/reminders')}
            >
              View reminders <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Adherence</CardTitle>
            {getAdherenceIcon(stats.weeklyAdherence)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAdherenceColor(stats.weeklyAdherence)}`}>
              {stats.weeklyAdherence.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.weeklyAdherence >= 80 ? 'Excellent!' : 'Keep it up!'}
            </p>
            <Button 
              variant="link" 
              className="px-0 mt-2 h-auto text-xs"
              onClick={() => navigate('/analytics')}
            >
              View analytics <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.weeklyAdherence >= 80 ? '7' : Math.floor(stats.weeklyAdherence / 100 * 7)} days
            </div>
            <p className="text-xs text-muted-foreground">
              Current streak
            </p>
            <Button 
              variant="link" 
              className="px-0 mt-2 h-auto text-xs"
              onClick={() => navigate('/reminders/history')}
            >
              View history <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
            <CardDescription>Your next scheduled medications</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming reminders</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/reminders/create')}
                >
                  Create Reminder
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => (
                  <div key={reminder._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{reminder.medicationId.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reminder.medicationId.dosage} {reminder.medicationId.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{getTimeUntil(reminder.scheduledTime)}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(reminder.scheduledTime), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/reminders')}
                >
                  View All Reminders
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your medication activity today</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm mt-2">Take your medications to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity._id} className="flex items-center gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.medicationName}
                        {activity.dosage && (
                          <span className="text-muted-foreground ml-2">
                            {activity.dosage}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type === 'taken' && 'Taken'}
                        {activity.type === 'missed' && 'Missed'}
                        {activity.type === 'skipped' && 'Skipped'}
                        {' at '}
                        {format(new Date(activity.time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/reminders/history')}
                >
                  View Full History
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/medications/add')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/reminders/create')}
            >
              <Bell className="mr-2 h-4 w-4" />
              Create Reminder
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/reminders')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Today's Schedule
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/analytics')}
            >
              <Activity className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}