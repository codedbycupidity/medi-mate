import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Target,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Minus,
  Sparkles
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import toast from 'react-hot-toast'

interface MedicationStats {
  medicationId: string
  medicationName: string
  dosage: string
  unit: string
  totalDoses: number
  takenDoses: number
  missedDoses: number
  skippedDoses: number
  adherenceRate: number
}

interface DailyAdherence {
  date: string
  taken: number
  missed: number
  skipped: number
  pending: number
  total: number
  adherenceRate: number
}

interface OverallStats {
  totalReminders: number
  takenCount: number
  missedCount: number
  skippedCount: number
  pendingCount: number
  overallAdherence: number
  currentStreak: number
  longestStreak: number
  mostMissedMedication: string
  bestAdherenceMedication: string
  worstDay: string
  bestDay: string
}

interface TimeAnalysis {
  morningAdherence: number // 6am-12pm
  afternoonAdherence: number // 12pm-6pm
  eveningAdherence: number // 6pm-12am
  nightAdherence: number // 12am-6am
  bestTimeSlot: string
  worstTimeSlot: string
}

interface AIInsights {
  insights: {
    strengths: string[]
    improvements: string[]
    recommendations: string[]
  }
  motivationalMessage: string
  riskFactors: string[]
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    impact: string
  }>
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [medicationStats, setMedicationStats] = useState<MedicationStats[]>([])
  const [dailyAdherence, setDailyAdherence] = useState<DailyAdherence[]>([])
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null)
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalReminders: 0,
    takenCount: 0,
    missedCount: 0,
    skippedCount: 0,
    pendingCount: 0,
    overallAdherence: 0,
    currentStreak: 0,
    longestStreak: 0,
    mostMissedMedication: '',
    bestAdherenceMedication: '',
    worstDay: '',
    bestDay: ''
  })
  const [timeAnalysis, setTimeAnalysis] = useState<TimeAnalysis>({
    morningAdherence: 0,
    afternoonAdherence: 0,
    eveningAdherence: 0,
    nightAdherence: 0,
    bestTimeSlot: '',
    worstTimeSlot: ''
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  // Fetch AI insights when stats are loaded
  useEffect(() => {
    if (overallStats.totalReminders > 0 && !loadingAI) {
      fetchAIInsights()
    }
  }, [overallStats.totalReminders, timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      let startDate: Date
      
      if (timeRange === 'week') {
        startDate = subDays(endDate, 7)
      } else if (timeRange === 'month') {
        startDate = subDays(endDate, 30)
      } else {
        startDate = subDays(endDate, 365) // Get last year for 'all'
      }

      // Fetch data
      const [remindersRes, medicationsRes] = await Promise.allSettled([
        api.get(`/reminders/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`),
        api.get('/medications')
      ])

      const reminders = remindersRes.status === 'fulfilled' 
        ? (remindersRes.value.data?.reminders || (remindersRes.value as any).reminders || remindersRes.value || [])
        : []
      
      const medications = medicationsRes.status === 'fulfilled'
        ? (medicationsRes.value.data?.medications || (medicationsRes.value as any).medications || medicationsRes.value || [])
        : []

      // Process medication-specific stats
      const medStats: MedicationStats[] = []
      const medicationMap = new Map()

      reminders.forEach((reminder: any) => {
        const medId = reminder.medicationId?._id || reminder.medicationId
        const medName = reminder.medicationId?.name || 'Unknown'
        
        if (!medicationMap.has(medId)) {
          medicationMap.set(medId, {
            medicationId: medId,
            medicationName: medName,
            dosage: reminder.medicationId?.dosage || '',
            unit: reminder.medicationId?.unit || '',
            totalDoses: 0,
            takenDoses: 0,
            missedDoses: 0,
            skippedDoses: 0,
            adherenceRate: 0
          })
        }

        const stats = medicationMap.get(medId)
        stats.totalDoses++
        
        if (reminder.status === 'taken') stats.takenDoses++
        else if (reminder.status === 'missed') stats.missedDoses++
        else if (reminder.status === 'skipped') stats.skippedDoses++
      })

      medicationMap.forEach((stats) => {
        stats.adherenceRate = stats.totalDoses > 0 
          ? Math.round((stats.takenDoses / stats.totalDoses) * 100)
          : 0
        medStats.push(stats)
      })

      setMedicationStats(medStats.sort((a, b) => b.adherenceRate - a.adherenceRate))

      // Process daily adherence
      const dailyMap = new Map<string, DailyAdherence>()
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd')
        dailyMap.set(dateKey, {
          date: dateKey,
          taken: 0,
          missed: 0,
          skipped: 0,
          pending: 0,
          total: 0,
          adherenceRate: 0
        })
      })

      reminders.forEach((reminder: any) => {
        const dateKey = format(new Date(reminder.scheduledTime), 'yyyy-MM-dd')
        if (dailyMap.has(dateKey)) {
          const daily = dailyMap.get(dateKey)!
          daily.total++
          
          if (reminder.status === 'taken') daily.taken++
          else if (reminder.status === 'missed') daily.missed++
          else if (reminder.status === 'skipped') daily.skipped++
          else if (reminder.status === 'pending') daily.pending++
        }
      })

      dailyMap.forEach(daily => {
        if (daily.total > 0) {
          daily.adherenceRate = Math.round((daily.taken / daily.total) * 100)
        }
      })

      const dailyData = Array.from(dailyMap.values())
      setDailyAdherence(dailyData)

      // Calculate overall stats
      let totalReminders = 0
      let takenCount = 0
      let missedCount = 0
      let skippedCount = 0
      let pendingCount = 0

      reminders.forEach((reminder: any) => {
        totalReminders++
        if (reminder.status === 'taken') takenCount++
        else if (reminder.status === 'missed') missedCount++
        else if (reminder.status === 'skipped') skippedCount++
        else if (reminder.status === 'pending') pendingCount++
      })

      const overallAdherence = totalReminders > 0 
        ? Math.round((takenCount / totalReminders) * 100)
        : 0

      // Calculate streaks
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0
      
      dailyData.reverse().forEach((day, index) => {
        if (day.adherenceRate === 100 && day.total > 0) {
          tempStreak++
          if (index === 0) currentStreak = tempStreak
          longestStreak = Math.max(longestStreak, tempStreak)
        } else if (day.total > 0) {
          tempStreak = 0
        }
      })

      // Find best and worst performing medication
      const bestMed = medStats.reduce((best, current) => 
        current.adherenceRate > best.adherenceRate ? current : best, 
        medStats[0] || { medicationName: 'N/A', adherenceRate: 0 }
      )
      
      const worstMed = medStats.reduce((worst, current) => 
        current.adherenceRate < worst.adherenceRate ? current : worst,
        medStats[0] || { medicationName: 'N/A', adherenceRate: 100 }
      )

      // Find best and worst days
      const daysWithData = dailyData.filter(d => d.total > 0)
      const bestDayData = daysWithData.reduce((best, current) =>
        current.adherenceRate > best.adherenceRate ? current : best,
        daysWithData[0] || { date: '', adherenceRate: 0 }
      )
      
      const worstDayData = daysWithData.reduce((worst, current) =>
        current.adherenceRate < worst.adherenceRate ? current : worst,
        daysWithData[0] || { date: '', adherenceRate: 100 }
      )

      setOverallStats({
        totalReminders,
        takenCount,
        missedCount,
        skippedCount,
        pendingCount,
        overallAdherence,
        currentStreak,
        longestStreak,
        mostMissedMedication: worstMed?.medicationName || 'N/A',
        bestAdherenceMedication: bestMed?.medicationName || 'N/A',
        worstDay: worstDayData?.date ? format(new Date(worstDayData.date), 'MMM d') : 'N/A',
        bestDay: bestDayData?.date ? format(new Date(bestDayData.date), 'MMM d') : 'N/A'
      })

      // Time-based analysis
      const timeSlots = {
        morning: { taken: 0, total: 0 },
        afternoon: { taken: 0, total: 0 },
        evening: { taken: 0, total: 0 },
        night: { taken: 0, total: 0 }
      }

      reminders.forEach((reminder: any) => {
        const hour = new Date(reminder.scheduledTime).getHours()
        let slot: keyof typeof timeSlots
        
        if (hour >= 6 && hour < 12) slot = 'morning'
        else if (hour >= 12 && hour < 18) slot = 'afternoon'
        else if (hour >= 18 && hour < 24) slot = 'evening'
        else slot = 'night'

        timeSlots[slot].total++
        if (reminder.status === 'taken') timeSlots[slot].taken++
      })

      const calculateAdherence = (slot: { taken: number; total: number }) => 
        slot.total > 0 ? Math.round((slot.taken / slot.total) * 100) : 0

      const morningAdherence = calculateAdherence(timeSlots.morning)
      const afternoonAdherence = calculateAdherence(timeSlots.afternoon)
      const eveningAdherence = calculateAdherence(timeSlots.evening)
      const nightAdherence = calculateAdherence(timeSlots.night)

      const timeAdherenceMap = {
        'Morning (6am-12pm)': morningAdherence,
        'Afternoon (12pm-6pm)': afternoonAdherence,
        'Evening (6pm-12am)': eveningAdherence,
        'Night (12am-6am)': nightAdherence
      }

      const bestTime = Object.entries(timeAdherenceMap).reduce((best, [time, rate]) =>
        rate > best[1] ? [time, rate] : best, ['', 0])
      
      const worstTime = Object.entries(timeAdherenceMap).reduce((worst, [time, rate]) =>
        rate < worst[1] ? [time, rate] : worst, ['', 100])

      setTimeAnalysis({
        morningAdherence,
        afternoonAdherence,
        eveningAdherence,
        nightAdherence,
        bestTimeSlot: bestTime[0],
        worstTimeSlot: worstTime[0]
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAIInsights = async () => {
    try {
      setLoadingAI(true)
      
      const response = await api.get(`/reminders/ai-insights?timeRange=${timeRange}`)
      
      if (response.data?.aiInsights) {
        setAIInsights(response.data.aiInsights)
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      // Don't show error toast for AI insights as they're optional
    } finally {
      setLoadingAI(false)
    }
  }

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAdherenceIcon = (rate: number) => {
    if (rate >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (rate >= 60) return <Minus className="h-4 w-4 text-yellow-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (current < previous) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
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
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your medication adherence and identify patterns
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Adherence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAdherenceColor(overallStats.overallAdherence)}`}>
              {overallStats.overallAdherence}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overallStats.takenCount} of {overallStats.totalReminders} doses taken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Longest: {overallStats.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed Doses</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.missedCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((overallStats.missedCount / overallStats.totalReminders) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Time Slot</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{timeAnalysis.bestTimeSlot}</div>
            <p className="text-xs text-muted-foreground">
              Highest adherence time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adherence Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Adherence Trend</CardTitle>
          <CardDescription>Daily medication adherence over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple bar chart visualization */}
            <div className="flex items-end gap-1 h-40">
              {dailyAdherence.slice(-7).map((day, index) => {
                const height = (day.adherenceRate / 100) * 100
                const isCurrentDay = isToday(new Date(day.date))
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs font-medium mb-1">
                        {day.adherenceRate}%
                      </span>
                      <div 
                        className={`w-full rounded-t transition-all ${
                          day.adherenceRate >= 80 ? 'bg-green-500' :
                          day.adherenceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        } ${isCurrentDay ? 'ring-2 ring-primary' : ''}`}
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(day.date), 'EEE')}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 text-xs">
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
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Medication Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Medication Performance</CardTitle>
            <CardDescription>Adherence by medication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {medicationStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No medication data available
                </p>
              ) : (
                medicationStats.slice(0, 5).map((med) => (
                  <div key={med.medicationId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{med.medicationName}</span>
                        <span className="text-xs text-muted-foreground">
                          {med.dosage} {med.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getAdherenceIcon(med.adherenceRate)}
                        <span className={`font-bold ${getAdherenceColor(med.adherenceRate)}`}>
                          {med.adherenceRate}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {med.takenDoses} taken
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        {med.missedDoses} missed
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {med.skippedDoses} skipped
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${med.adherenceRate}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time-based Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Time-based Analysis</CardTitle>
            <CardDescription>Adherence by time of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Morning (6am-12pm)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${timeAnalysis.morningAdherence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {timeAnalysis.morningAdherence}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Afternoon (12pm-6pm)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${timeAnalysis.afternoonAdherence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {timeAnalysis.afternoonAdherence}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Evening (6pm-12am)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${timeAnalysis.eveningAdherence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {timeAnalysis.eveningAdherence}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Night (12am-6am)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${timeAnalysis.nightAdherence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {timeAnalysis.nightAdherence}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Insights</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <p>
                      Best adherence during <span className="font-medium">{timeAnalysis.bestTimeSlot}</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p>
                      Consider setting more reminders for <span className="font-medium">{timeAnalysis.worstTimeSlot}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Powered Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Personalized insights generated by AI based on your adherence patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAI ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                <p className="text-sm text-muted-foreground">Generating personalized insights...</p>
              </div>
            </div>
          ) : aiInsights ? (
            <div className="space-y-6">
              {/* Motivational Message */}
              {aiInsights.motivationalMessage && (
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium flex items-start gap-2">
                    <Award className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{aiInsights.motivationalMessage}</span>
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* AI-Generated Strengths */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Your Strengths
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {aiInsights.insights.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI-Generated Improvements */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-yellow-600" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {aiInsights.insights.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  AI Recommendations
                </h4>
                <ul className="space-y-2 text-sm">
                  {aiInsights.insights.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              {aiInsights.actionItems && aiInsights.actionItems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    Priority Actions
                  </h4>
                  <div className="space-y-2">
                    {aiInsights.actionItems
                      .sort((a, b) => {
                        const priority = { high: 0, medium: 1, low: 2 }
                        return priority[a.priority] - priority[b.priority]
                      })
                      .map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                          <Badge 
                            variant={
                              item.priority === 'high' ? 'destructive' :
                              item.priority === 'medium' ? 'default' : 'secondary'
                            }
                            className="mt-0.5"
                          >
                            {item.priority}
                          </Badge>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="text-xs text-muted-foreground">{item.impact}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {aiInsights.riskFactors && aiInsights.riskFactors.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Health Risk Factors
                  </h4>
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 space-y-1">
                    {aiInsights.riskFactors.map((risk, index) => (
                      <p key={index} className="text-sm text-red-700 dark:text-red-400">
                        • {risk}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Fallback to rule-based insights if AI is not available
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Strengths
                </h4>
                <ul className="space-y-2 text-sm">
                  {overallStats.currentStreak > 0 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>You're on a {overallStats.currentStreak}-day streak! Keep it up!</span>
                    </li>
                  )}
                  {overallStats.bestAdherenceMedication && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Excellent adherence with {overallStats.bestAdherenceMedication}</span>
                    </li>
                  )}
                  {overallStats.overallAdherence >= 80 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Great overall adherence rate of {overallStats.overallAdherence}%</span>
                    </li>
                  )}
                  {timeAnalysis.bestTimeSlot && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Strong adherence during {timeAnalysis.bestTimeSlot}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-yellow-600" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-2 text-sm">
                  {overallStats.missedCount > 0 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span>You've missed {overallStats.missedCount} doses this period</span>
                    </li>
                  )}
                  {overallStats.mostMissedMedication !== 'N/A' && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span>Focus on improving adherence for {overallStats.mostMissedMedication}</span>
                    </li>
                  )}
                  {timeAnalysis.worstTimeSlot && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span>Set additional reminders for {timeAnalysis.worstTimeSlot}</span>
                    </li>
                  )}
                  {overallStats.overallAdherence < 80 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span>Try to improve adherence to reach the 80% target</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/reminders')}>
                <Calendar className="mr-2 h-4 w-4" />
                View Today's Schedule
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/medications')}>
                <Activity className="mr-2 h-4 w-4" />
                Manage Medications
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/reminders/create')}>
                <Clock className="mr-2 h-4 w-4" />
                Add Reminder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}