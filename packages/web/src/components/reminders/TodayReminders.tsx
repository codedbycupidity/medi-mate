import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { Check, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Reminder {
  _id: string
  medicationId: {
    name: string
    dosage: string
    unit: string
    instructions?: string
  }
  scheduledTime: string
  status: 'pending' | 'taken' | 'missed' | 'skipped'
  takenAt?: string
}

export function TodayReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTodayReminders = async () => {
    try {
      const response = await api.get('/reminders/today')
      setReminders(response.data)
    } catch (error) {
      console.error('Error fetching today reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayReminders()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTodayReminders, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const markAsTaken = async (id: string) => {
    try {
      await api.post(`/reminders/${id}/take`)
      toast.success('Medication marked as taken')
      fetchTodayReminders()
    } catch (error) {
      toast.error('Failed to update reminder')
    }
  }

  const markAsSkipped = async (id: string) => {
    try {
      await api.post(`/reminders/${id}/skip`)
      toast.success('Medication skipped')
      fetchTodayReminders()
    } catch (error) {
      toast.error('Failed to update reminder')
    }
  }

  const pendingReminders = reminders.filter(r => r.status === 'pending')
  const completedReminders = reminders.filter(r => r.status === 'taken')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Medications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Today's Medications
          <Badge variant="secondary">
            {completedReminders.length}/{reminders.length} taken
          </Badge>
        </CardTitle>
        <CardDescription>
          {pendingReminders.length > 0 
            ? `You have ${pendingReminders.length} medications to take today`
            : 'All medications taken for today!'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {pendingReminders.map((reminder) => {
              const scheduledTime = new Date(reminder.scheduledTime)
              const isPast = scheduledTime < new Date()
              
              return (
                <div
                  key={reminder._id}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    isPast ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reminder.medicationId.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {reminder.medicationId.dosage} {reminder.medicationId.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(scheduledTime, 'h:mm a')}
                      </span>
                      {isPast && (
                        <Badge variant="outline" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    {reminder.medicationId.instructions && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {reminder.medicationId.instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsTaken(reminder._id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsSkipped(reminder._id)}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
            
            {completedReminders.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Completed</h4>
                {completedReminders.map((reminder) => (
                  <div
                    key={reminder._id}
                    className="flex items-center justify-between py-2 opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="line-through">{reminder.medicationId.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(reminder.scheduledTime), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}