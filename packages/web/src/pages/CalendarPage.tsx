import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pill,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  getDay,
  setHours,
  setMinutes,
  parseISO,
  addDays,
  isBefore,
  isAfter
} from 'date-fns'
import toast from 'react-hot-toast'

interface Reminder {
  _id: string
  medicationId: {
    _id: string
    name: string
    dosage: string
    unit: string
    color?: string
  }
  scheduledTime: string
  status: 'pending' | 'taken' | 'missed' | 'skipped'
  notes?: string
}

interface CalendarEvent {
  id: string
  title: string
  time: Date
  status: 'pending' | 'taken' | 'missed' | 'skipped'
  medication: string
  dosage: string
  color?: string
}

type ViewType = 'month' | 'week' | 'day'

export default function CalendarPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<ViewType>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showPastEvents, setShowPastEvents] = useState(true)

  useEffect(() => {
    fetchReminders()
  }, [currentDate, viewType])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      
      let startDate: Date
      let endDate: Date

      if (viewType === 'month') {
        startDate = startOfMonth(currentDate)
        endDate = endOfMonth(currentDate)
      } else if (viewType === 'week') {
        startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
        endDate = endOfWeek(currentDate, { weekStartsOn: 0 })
      } else {
        startDate = startOfDay(currentDate)
        endDate = endOfDay(currentDate)
      }

      const response = await api.get('/reminders', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 500
        }
      })

      const remindersData = response.data || response || []
      setReminders(remindersData)

      // Convert reminders to calendar events
      const calendarEvents: CalendarEvent[] = remindersData.map((reminder: Reminder) => ({
        id: reminder._id,
        title: reminder.medicationId.name,
        time: new Date(reminder.scheduledTime),
        status: reminder.status,
        medication: reminder.medicationId.name,
        dosage: `${reminder.medicationId.dosage} ${reminder.medicationId.unit}`,
        color: reminder.medicationId.color
      }))

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast.error('Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (viewType === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (viewType === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, -1))
    }
  }

  const handleNext = () => {
    if (viewType === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (viewType === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    if (viewType === 'month') {
      setViewType('day')
      setCurrentDate(date)
    }
  }

  const markAsTaken = async (reminderId: string) => {
    try {
      await api.post(`/reminders/${reminderId}/take`)
      toast.success('Marked as taken')
      fetchReminders()
    } catch (error) {
      toast.error('Failed to update reminder')
    }
  }

  const markAsSkipped = async (reminderId: string) => {
    try {
      await api.post(`/reminders/${reminderId}/skip`)
      toast.success('Marked as skipped')
      fetchReminders()
    } catch (error) {
      toast.error('Failed to update reminder')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'bg-green-500'
      case 'missed':
        return 'bg-red-500'
      case 'skipped':
        return 'bg-yellow-500'
      case 'pending':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="h-3 w-3" />
      case 'missed':
        return <XCircle className="h-3 w-3" />
      case 'skipped':
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.time, date))
  }

  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      const eventHour = event.time.getHours()
      return eventHour === hour && isSameDay(event.time, currentDate)
    })
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayEvents = getEventsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)
            const isPast = isBefore(day, startOfDay(new Date()))

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                  ${isCurrentDay ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                  ${!showPastEvents && isPast ? 'opacity-50' : ''}
                  hover:bg-accent
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${isCurrentDay ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1">
                      {dayEvents.length}
                    </Badge>
                  )}
                </div>

                {/* Event indicators */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`} />
                      <span className="text-xs truncate">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="p-4">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-sm font-medium text-muted-foreground p-2">Time</div>
              {days.map(day => (
                <div
                  key={day.toISOString()}
                  className={`text-center text-sm font-medium p-2 rounded-t-lg ${
                    isToday(day) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="border rounded-lg overflow-hidden">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                  <div className="text-xs text-muted-foreground p-2 border-r">
                    {format(setHours(new Date(), hour), 'ha')}
                  </div>
                  {days.map(day => {
                    const hourEvents = events.filter(event => {
                      return isSameDay(event.time, day) && event.time.getHours() === hour
                    })

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="p-1 border-r last:border-r-0 min-h-[50px] hover:bg-accent/50"
                      >
                        {hourEvents.map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 mb-1 rounded ${getStatusColor(event.status)} text-white`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="opacity-90">{format(event.time, 'h:mm a')}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDate(currentDate)

    return (
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {dayEvents.length} medication{dayEvents.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        <div className="space-y-2">
          {hours.map(hour => {
            const hourEvents = getEventsForHour(hour)
            const isPast = isBefore(setHours(currentDate, hour), new Date())

            if (hourEvents.length === 0 && isPast && !showPastEvents) {
              return null
            }

            return (
              <div
                key={hour}
                className={`flex gap-4 p-3 rounded-lg border ${
                  hourEvents.length > 0 ? 'bg-accent/20' : ''
                } ${isPast && !showPastEvents ? 'opacity-50' : ''}`}
              >
                <div className="w-20 text-sm font-medium text-muted-foreground">
                  {format(setHours(new Date(), hour), 'h:mm a')}
                </div>
                <div className="flex-1">
                  {hourEvents.length > 0 ? (
                    <div className="space-y-2">
                      {hourEvents.map(event => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 bg-card rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${getStatusColor(event.status)}`}>
                              <Pill className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{event.medication}</p>
                              <p className="text-sm text-muted-foreground">{event.dosage}</p>
                            </div>
                            <Badge variant={
                              event.status === 'taken' ? 'default' :
                              event.status === 'missed' ? 'destructive' :
                              event.status === 'skipped' ? 'secondary' :
                              'outline'
                            }>
                              {event.status}
                            </Badge>
                          </div>
                          {event.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsTaken(event.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsSkipped(event.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No medications scheduled
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const getHeaderTitle = () => {
    if (viewType === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else if (viewType === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View your medication schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPastEvents(!showPastEvents)}
          >
            {showPastEvents ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Past
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Past
              </>
            )}
          </Button>
          <Button onClick={() => navigate('/reminders/create')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {getHeaderTitle()}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
              >
                Today
              </Button>
            </div>

            {/* View Type Selector */}
            <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
              <TabsList>
                <TabsTrigger value="month">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Month
                </TabsTrigger>
                <TabsTrigger value="week">
                  <CalendarRange className="h-4 w-4 mr-2" />
                  Week
                </TabsTrigger>
                <TabsTrigger value="day">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Day
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewType === 'month' && renderMonthView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'day' && renderDayView()}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Taken</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Skipped</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}