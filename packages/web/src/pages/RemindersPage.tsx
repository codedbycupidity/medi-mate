import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { columns, type Reminder } from '../components/reminders/columns'
import { DataTable } from '../components/reminders/data-table'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Bell, Calendar, CheckCircle2, AlertCircle, Clock, Sparkles, History, Plus } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { AIScheduleOptimizer } from '../components/reminders/AIScheduleOptimizer'
import { EditReminderDialog } from '../components/reminders/EditReminderDialog'

interface ReminderStats {
  total: number
  taken: number
  missed: number
  skipped: number
  pending: number
  adherenceRate: number
}

export default function RemindersPage() {
  const navigate = useNavigate()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([])
  const [stats, setStats] = useState<ReminderStats>({
    total: 0,
    taken: 0,
    missed: 0,
    skipped: 0,
    pending: 0,
    adherenceRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Fetch reminders based on active tab
  const fetchReminders = async () => {
    try {
      setLoading(true)
      
      // Fetch all reminders
      // Get user's timezone offset in minutes
      const timezoneOffset = new Date().getTimezoneOffset()
      
      const [allResponse, todayResponse, upcomingResponse, statsResponse] = await Promise.all([
        api.get('/reminders?limit=50'),
        api.get(`/reminders/today?timezoneOffset=${timezoneOffset}`),
        api.get('/reminders/upcoming'),
        api.get('/reminders/stats')
      ])

      setReminders(allResponse.data || [])
      setTodayReminders(todayResponse.data || [])
      setUpcomingReminders(upcomingResponse.data || [])
      setStats(statsResponse.data || {
        total: 0,
        taken: 0,
        missed: 0,
        skipped: 0,
        pending: 0,
        adherenceRate: 0
      })
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast.error('Failed to load reminders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  // Generate reminders for the week
  const generateReminders = async () => {
    try {
      const response = await api.post('/reminders/generate', { days: 7 })
      toast.success(response.message || 'Reminders generated successfully')
      fetchReminders()
    } catch (error) {
      console.error('Error generating reminders:', error)
      toast.error('Failed to generate reminders')
    }
  }

  // Mark reminder as taken
  const markAsTaken = async (id: string) => {
    try {
      await api.post(`/reminders/${id}/take`)
      toast.success('Reminder marked as taken')
      fetchReminders()
    } catch (error) {
      console.error('Error marking reminder as taken:', error)
      toast.error('Failed to update reminder')
    }
  }

  // Mark reminder as skipped
  const markAsSkipped = async (id: string) => {
    try {
      await api.post(`/reminders/${id}/skip`)
      toast.success('Reminder marked as skipped')
      fetchReminders()
    } catch (error) {
      console.error('Error marking reminder as skipped:', error)
      toast.error('Failed to update reminder')
    }
  }

  // Delete reminder
  const deleteReminder = async (id: string) => {
    try {
      await api.delete(`/reminders/${id}`)
      toast.success('Reminder deleted')
      fetchReminders()
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast.error('Failed to delete reminder')
    }
  }

  // Bulk delete reminders
  const bulkDeleteReminders = async (ids: string[]) => {
    console.log('bulkDeleteReminders called with IDs:', ids)
    try {
      const response = await api.delete('/reminders/bulk', { data: { ids } })
      console.log('Bulk delete response:', response)
      toast.success(response.message || `${ids.length} reminder(s) deleted`)
      await fetchReminders()
    } catch (error) {
      console.error('Error deleting reminders:', error)
      toast.error('Failed to delete reminders')
    }
  }

  // Bulk mark as taken
  const bulkMarkAsTaken = async (ids: string[]) => {
    try {
      const response = await api.put('/reminders/bulk/taken', { ids })
      toast.success(response.message || `${ids.length} reminder(s) marked as taken`)
      await fetchReminders()
    } catch (error) {
      console.error('Error marking reminders as taken:', error)
      toast.error('Failed to mark reminders as taken')
    }
  }

  // Bulk mark as skipped
  const bulkMarkAsSkipped = async (ids: string[]) => {
    try {
      const response = await api.put('/reminders/bulk/skipped', { ids })
      toast.success(response.message || `${ids.length} reminder(s) marked as skipped`)
      await fetchReminders()
    } catch (error) {
      console.error('Error marking reminders as skipped:', error)
      toast.error('Failed to mark reminders as skipped')
    }
  }

  // Edit reminder
  const editReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setEditDialogOpen(true)
  }

  // Update reminder
  const updateReminder = async (id: string, data: any) => {
    try {
      await api.put(`/reminders/${id}`, data)
      toast.success('Reminder updated successfully')
      setEditDialogOpen(false)
      setEditingReminder(null)
      fetchReminders()
    } catch (error) {
      console.error('Error updating reminder:', error)
      toast.error('Failed to update reminder')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Medication Reminders</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your medication schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/reminders/create')} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Reminder
          </Button>
          <Button onClick={() => navigate('/reminders/history')} variant="outline">
            <History className="mr-2 h-4 w-4" />
            View History
          </Button>
          <Button onClick={generateReminders}>
            <Calendar className="mr-2 h-4 w-4" />
            Generate Week
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Adherence Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adherenceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Based on {stats.total} reminders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taken</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taken}</div>
            <p className="text-xs text-muted-foreground">
              Medications taken on time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.missed}</div>
            <p className="text-xs text-muted-foreground">
              Medications missed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming reminders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reminders Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Schedule</CardTitle>
          <CardDescription>
            View and manage your medication reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">
                Today ({todayReminders.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingReminders.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({reminders.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="mt-4">
              <DataTable
                columns={columns}
                data={todayReminders}
                onMarkAsTaken={markAsTaken}
                onMarkAsSkipped={markAsSkipped}
                onEditReminder={editReminder}
                onDeleteReminder={deleteReminder}
                onBulkDelete={bulkDeleteReminders}
                onBulkMarkAsTaken={bulkMarkAsTaken}
                onBulkMarkAsSkipped={bulkMarkAsSkipped}
              />
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-4">
              <DataTable
                columns={columns}
                data={upcomingReminders}
                onMarkAsTaken={markAsTaken}
                onMarkAsSkipped={markAsSkipped}
                onEditReminder={editReminder}
                onDeleteReminder={deleteReminder}
                onBulkDelete={bulkDeleteReminders}
                onBulkMarkAsTaken={bulkMarkAsTaken}
                onBulkMarkAsSkipped={bulkMarkAsSkipped}
              />
            </TabsContent>
            
            <TabsContent value="all" className="mt-4">
              <DataTable
                columns={columns}
                data={reminders}
                onMarkAsTaken={markAsTaken}
                onMarkAsSkipped={markAsSkipped}
                onEditReminder={editReminder}
                onDeleteReminder={deleteReminder}
                onBulkDelete={bulkDeleteReminders}
                onBulkMarkAsTaken={bulkMarkAsTaken}
                onBulkMarkAsSkipped={bulkMarkAsSkipped}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Schedule Optimizer */}
      <AIScheduleOptimizer onScheduleApplied={fetchReminders} />
      
      {/* Edit Reminder Dialog */}
      <EditReminderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        reminder={editingReminder}
        onSave={updateReminder}
      />
    </div>
  )
}