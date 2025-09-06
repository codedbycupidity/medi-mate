import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { format, isToday, subDays } from 'date-fns'
import { api } from '../../services/api'

interface DailyAdherence {
  date: string
  taken: number
  missed: number
  skipped: number
  pending: number
  total: number
  adherenceRate: number
}

interface AdherenceTrendChartProps {
  timeRange: 'week' | 'month' | 'all'
}

export function AdherenceTrendChart({ timeRange }: AdherenceTrendChartProps) {
  const [chartData, setChartData] = useState<DailyAdherence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Chart refreshing due to time range change:', timeRange)
    fetchChartData()
  }, [timeRange])

  const fetchChartData = async () => {
    console.log(`=== AdherenceTrendChart: Fetching ${timeRange} data ===`)
    setLoading(true)
    setError(null)
    
    try {
      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      
      let startDate: Date
      let aggregationType: 'daily' | 'dayOfWeek'
      
      if (timeRange === 'week') {
        // Last 7 days - show actual daily data
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        aggregationType = 'daily'
      } else if (timeRange === 'month') {
        // Last 30 days - show day-of-week averages
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 29)
        startDate.setHours(0, 0, 0, 0)
        aggregationType = 'dayOfWeek'
      } else {
        // All time - show day-of-week averages for ALL data
        startDate = new Date('2020-01-01') // Will be overridden by "all" parameter
        startDate.setHours(0, 0, 0, 0)
        aggregationType = 'dayOfWeek'
      }
      
      console.log('Date range and type:', {
        timeRange,
        aggregationType,
        start: format(startDate, 'MMM d, yyyy'),
        end: format(endDate, 'MMM d, yyyy')
      })
      
      // Initialize data array
      const chartDataArray: DailyAdherence[] = []
      
      if (aggregationType === 'daily') {
        // For week view, show last 7 actual days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        sevenDaysAgo.setHours(0, 0, 0, 0)
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(sevenDaysAgo)
          currentDate.setDate(sevenDaysAgo.getDate() + i)
          const dateKey = format(currentDate, 'yyyy-MM-dd')
          
          chartDataArray.push({
            date: dateKey,
            taken: 0,
            missed: 0,
            skipped: 0,
            pending: 0,
            total: 0,
            adherenceRate: 0
          })
        }
      } else {
        // For month and all-time views, show Mon-Sun averages
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        for (let i = 0; i < 7; i++) {
          chartDataArray.push({
            date: daysOfWeek[i], // Use day name as identifier
            taken: 0,
            missed: 0,
            skipped: 0,
            pending: 0,
            total: 0,
            adherenceRate: 0
          })
        }
      }
      
      console.log('Initialized data points:', chartDataArray.map(d => d.date))
      
      // Fetch reminder data - use "all" parameter for all time
      const historyUrl = timeRange === 'all'
        ? '/reminders/history?startDate=all&limit=10000'
        : `/reminders/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`
      
      const response = await api.get(historyUrl)
      
      console.log('API Response:', response.data)
      
      const reminders = response.data?.data?.reminders || 
                       response.data?.reminders || 
                       []
      
      console.log(`Processing ${reminders.length} reminders for ${aggregationType} view`)
      
      // Process reminders based on aggregation type
      if (aggregationType === 'daily') {
        // For week view, group by specific date
        reminders.forEach((reminder: any) => {
          const dateKey = format(new Date(reminder.scheduledTime), 'yyyy-MM-dd')
          const dataPoint = chartDataArray.find(d => d.date === dateKey)
          
          if (dataPoint) {
            dataPoint.total++
            switch (reminder.status) {
              case 'taken':
                dataPoint.taken++
                break
              case 'missed':
                dataPoint.missed++
                break
              case 'skipped':
                dataPoint.skipped++
                break
              case 'pending':
                dataPoint.pending++
                break
            }
          }
        })
      } else {
        // For month/all-time views, group by day of week
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        reminders.forEach((reminder: any) => {
          const reminderDate = new Date(reminder.scheduledTime)
          const dayOfWeek = daysOfWeek[reminderDate.getDay()]
          const dataPoint = chartDataArray.find(d => d.date === dayOfWeek)
          
          if (dataPoint) {
            dataPoint.total++
            switch (reminder.status) {
              case 'taken':
                dataPoint.taken++
                break
              case 'missed':
                dataPoint.missed++
                break
              case 'skipped':
                dataPoint.skipped++
                break
              case 'pending':
                dataPoint.pending++
                break
            }
          }
        })
      }
      
      // Calculate adherence rates
      chartDataArray.forEach(day => {
        if (day.total > 0) {
          day.adherenceRate = Math.round((day.taken / day.total) * 100)
        }
      })
      
      console.log('Final chart data:', chartDataArray.map(d => ({
        label: d.date,
        adherence: `${d.adherenceRate}%`,
        taken: d.taken,
        total: d.total
      })))
      
      setChartData(chartDataArray)
    } catch (err) {
      console.error('Error fetching chart data:', err)
      setError('Failed to load chart data')
      
      // Still show empty chart structure on error
      const emptyData: DailyAdherence[] = []
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i)
        emptyData.push({
          date: format(date, 'yyyy-MM-dd'),
          taken: 0,
          missed: 0,
          skipped: 0,
          pending: 0,
          total: 0,
          adherenceRate: 0
        })
      }
      setChartData(emptyData)
    } finally {
      setLoading(false)
    }
  }

  const getBarColor = (rate: number): string => {
    if (rate >= 80) return 'bg-green-500/60'
    if (rate >= 60) return 'bg-yellow-500/60'
    return 'bg-red-500/60'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adherence Trend</CardTitle>
        <CardDescription>
          {timeRange === 'week' && 'Daily adherence for the last 7 days'}
          {timeRange === 'month' && 'Average adherence by day of week (last 30 days)'}
          {timeRange === 'all' && 'Average adherence by day of week (all time)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-600 mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Container */}
            <div className="relative" style={{ height: '240px' }}>
              {/* Y-axis labels and grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[100, 80, 60, 40, 20, 0].map((value) => (
                  <div key={value} className="flex items-center">
                    <span className="text-xs text-muted-foreground w-10 text-right pr-2">
                      {value}%
                    </span>
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700 opacity-20"></div>
                  </div>
                ))}
              </div>
              
              {/* Bars Container */}
              <div className="absolute inset-0 flex items-end gap-1 pl-12 pr-2 pb-8">
                {chartData.map((day, index) => {
                  const isDayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(day.date)
                  const isCurrentDay = !isDayOfWeek && isToday(new Date(day.date))
                  // Calculate pixel height: 200px available height (240px - 40px for labels)
                  const barHeight = Math.max(2, (day.adherenceRate / 100) * 200)
                  
                  // Create appropriate tooltip based on data type
                  const tooltipText = isDayOfWeek 
                    ? `${day.date}: ${day.adherenceRate}% average (${day.taken}/${day.total} total)`
                    : `${format(new Date(day.date), 'MMMM d, yyyy')}: ${day.adherenceRate}% (${day.taken}/${day.total})`
                  
                  return (
                    <div 
                      key={`bar-${day.date}`} 
                      className="flex-1 flex flex-col justify-end"
                      title={tooltipText}
                    >
                      <div className="text-xs font-medium text-center mb-1">
                        {day.adherenceRate}%
                      </div>
                      <div 
                        className={`w-full rounded-t transition-all duration-300 ${getBarColor(day.adherenceRate)} ${
                          isCurrentDay ? 'ring-2 ring-primary' : ''
                        }`}
                        style={{ 
                          height: `${barHeight}px`
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-12 right-2 flex gap-1">
                {chartData.map((day) => {
                  const isDayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(day.date)
                  
                  return (
                    <div key={`label-${day.date}`} className="flex-1 text-center">
                      {isDayOfWeek ? (
                        <div className="text-xs text-muted-foreground">
                          {day.date.slice(0, 3)} {/* Sun, Mon, Tue, etc. */}
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(day.date), 'EEE')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(day.date), 'M/d')}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 text-xs pt-4 border-t">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>≥80% (Good)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                <span>60-79% (Fair)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>&lt;60% (Poor)</span>
              </div>
            </div>
            
            {/* Debug Info (remove in production) */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <details>
                <summary className="cursor-pointer">Debug Info</summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {JSON.stringify(chartData.map(d => {
                    const isDayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(d.date)
                    return {
                      label: d.date,
                      type: isDayOfWeek ? 'day-of-week' : 'date',
                      rate: d.adherenceRate,
                      taken: d.taken,
                      total: d.total
                    }
                  }), null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}