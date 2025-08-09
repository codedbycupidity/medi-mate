import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import TakenBadge from './TakenBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select'
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, subDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'

interface HistoryReminder {
  _id: string
  medicationId: {
    _id: string
    name: string
    dosage: string
    unit: string
  }
  scheduledTime: string
  status: 'taken' | 'missed' | 'skipped'
  takenAt?: string
  notes?: string
}

interface HistoryStats {
  total: number
  taken: number
  missed: number
  skipped: number
}

interface GroupedHistory {
  [key: string]: {
    date: string
    reminders: HistoryReminder[]
    stats: HistoryStats
  }
}

export default function ReminderHistory() {
  const [reminders, setReminders] = useState<HistoryReminder[]>([])
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({})
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [groupBy, setGroupBy] = useState('day')
  const [filterStatus, setFilterStatus] = useState('all')
  const [medications, setMedications] = useState<any[]>([])
  const [selectedMedication, setSelectedMedication] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<HistoryStats>({
    total: 0,
    taken: 0,
    missed: 0,
    skipped: 0
  })

  // Calculate date range
  const getDateRange = () => {
    let end = new Date()
    let start = new Date()
    
    switch (dateRange) {
      case '7days':
        start = subDays(end, 7)
        // Include future dates for pre-taken medications
        end.setDate(end.getDate() + 7)
        break
      case '30days':
        start = subDays(end, 30)
        // Include future dates for pre-taken medications
        end.setDate(end.getDate() + 7)
        break
      case 'thisWeek':
        start = startOfWeek(end)
        end = endOfWeek(end)
        break
      case 'thisMonth':
        start = startOfMonth(end)
        end = endOfMonth(end)
        break
      case 'lastWeek':
        start = startOfWeek(subDays(new Date(), 7))
        end = endOfWeek(subDays(new Date(), 7))
        break
      case 'lastMonth':
        start = startOfMonth(subDays(new Date(), 30))
        end = endOfMonth(subDays(new Date(), 30))
        break
      default:
        start = subDays(new Date(), 30)
        // Include future dates for pre-taken medications
        end = new Date()
        end.setDate(end.getDate() + 7)
    }
    
    return { start, end }
  }

  // Fetch history data
  const fetchHistory = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()
      
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        groupBy,
        page: currentPage.toString(),
        limit: '50'
      })
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      
      if (selectedMedication !== 'all') {
        params.append('medicationId', selectedMedication)
      }
      
      const response = await api.get(`/reminders/history?${params}`)
      
      setReminders(response.data.reminders || [])
      setGroupedHistory(response.data.grouped || {})
      setTotalPages(response.data.pagination?.totalPages || 1)
      
      // Debug logging
      console.log('History Data:', {
        totalReminders: response.data.reminders?.length,
        groupedKeys: Object.keys(response.data.grouped || {}),
        stats: response.data.stats
      })
      
      // Use overall stats from API if available, otherwise calculate from current page
      if (response.data.stats) {
        setStats(response.data.stats)
      } else {
        // Fallback: Calculate stats from current page
        const remindersArray = response.data.reminders || []
        const calculatedStats = remindersArray.reduce((acc: HistoryStats, reminder: HistoryReminder) => {
          acc.total++
          acc[reminder.status]++
          return acc
        }, { total: 0, taken: 0, missed: 0, skipped: 0 })
        
        setStats(calculatedStats)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
      toast.error('Failed to load reminder history')
    } finally {
      setLoading(false)
    }
  }

  // Fetch medications for filter
  const fetchMedications = async () => {
    try {
      const response = await api.get('/medications')
      setMedications(response.data?.medications || [])
    } catch (error) {
      console.error('Error fetching medications:', error)
    }
  }

  useEffect(() => {
    fetchMedications()
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [dateRange, groupBy, filterStatus, selectedMedication, currentPage])

  // Calculate adherence rate
  const adherenceRate = stats.total > 0 
    ? Math.round((stats.taken / (stats.taken + stats.missed)) * 100) || 0
    : 0

  // Export history as CSV
  const exportHistory = () => {
    const csv = [
      ['Date', 'Time', 'Medication', 'Dosage', 'Status', 'Taken At', 'Notes'],
      ...reminders.map(r => [
        format(new Date(r.scheduledTime), 'yyyy-MM-dd'),
        format(new Date(r.scheduledTime), 'HH:mm'),
        r.medicationId.name,
        `${r.medicationId.dosage} ${r.medicationId.unit}`,
        r.status,
        r.takenAt ? format(new Date(r.takenAt), 'yyyy-MM-dd HH:mm') : '',
        r.notes || ''
      ])
    ]
    
    const csvContent = csv.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reminder-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('History exported successfully')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return <TakenBadge>{status}</TakenBadge>
      case 'missed':
        return <Badge variant="destructive">{status}</Badge>
      case 'skipped':
        return <Badge variant="secondary">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Reminder History</CardTitle>
              <CardDescription>
                Track your medication adherence over time
              </CardDescription>
            </div>
            <Button onClick={exportHistory} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger>
                <Activity className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="day">By Day</SelectItem>
                <SelectItem value="week">By Week</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="taken">Taken Only</SelectItem>
                <SelectItem value="missed">Missed Only</SelectItem>
                <SelectItem value="skipped">Skipped Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMedication} onValueChange={setSelectedMedication}>
              <SelectTrigger>
                <SelectValue placeholder="Filter medication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Medications</SelectItem>
                {medications.map(med => (
                  <SelectItem key={med._id} value={med._id}>
                    {med.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Adherence Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adherenceRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {adherenceRate >= 80 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  <span className="text-green-600">Good adherence</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  <span className="text-red-600">Needs improvement</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total reminders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.taken}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              On time doses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.missed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Missed doses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Skipped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.skipped}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Skipped doses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History Display */}
      <Card>
        <CardHeader>
          <CardTitle>History Details</CardTitle>
        </CardHeader>
        <CardContent>
          {groupBy !== 'none' && Object.keys(groupedHistory).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedHistory)
                .sort(([a], [b]) => b.localeCompare(a)) // Sort dates in descending order
                .map(([key, group]) => (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">
                      {groupBy === 'day' && format(new Date(group.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                      {groupBy === 'week' && `Week of ${format(new Date(group.date + 'T12:00:00'), 'MMMM d, yyyy')}`}
                      {groupBy === 'month' && format(new Date(group.date + '-01T12:00:00'), 'MMMM yyyy')}
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {group.stats.total} total
                      </Badge>
                      <TakenBadge className="text-xs">
                        {group.stats.taken} taken
                      </TakenBadge>
                      {group.stats.missed > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {group.stats.missed} missed
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {group.reminders.map((reminder) => (
                      <div
                        key={reminder._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-card rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(reminder.status)}
                          <div>
                            <p className="font-medium">
                              {reminder.medicationId.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {reminder.medicationId.dosage} {reminder.medicationId.unit} • {format(new Date(reminder.scheduledTime), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(reminder.status)}
                          {reminder.takenAt && (
                            <span className="text-sm text-muted-foreground">
                              at {format(new Date(reminder.takenAt), 'h:mm a')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : reminders.length > 0 ? (
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-card rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(reminder.status)}
                    <div>
                      <p className="font-medium">
                        {reminder.medicationId.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reminder.medicationId.dosage} {reminder.medicationId.unit} • {format(new Date(reminder.scheduledTime), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(reminder.status)}
                    {reminder.takenAt && (
                      <span className="text-sm text-muted-foreground">
                        Taken at {format(new Date(reminder.takenAt), 'h:mm a')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No reminder history found for the selected filters
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}