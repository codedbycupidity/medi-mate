import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { 
  Calendar,
  Clock,
  Activity,
  Sparkles,
  Award,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'

// Import modular components
import { AdherenceTrendChart } from '../components/analytics/AdherenceTrendChart'
import { KeyMetrics } from '../components/analytics/KeyMetrics'
import { MedicationPerformance } from '../components/analytics/MedicationPerformance'
import { TimeAnalysis } from '../components/analytics/TimeAnalysis'

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

interface TimeAnalysisData {
  morningAdherence: number
  afternoonAdherence: number
  eveningAdherence: number
  nightAdherence: number
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

export default function AnalyticsPageNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [medicationStats, setMedicationStats] = useState<MedicationStats[]>([])
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
  const [timeAnalysis, setTimeAnalysis] = useState<TimeAnalysisData>({
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

  useEffect(() => {
    if (overallStats.totalReminders > 0 && !loadingAI) {
      fetchAIInsights()
    }
  }, [overallStats.totalReminders, timeRange])

  const fetchAnalyticsData = async () => {
    console.log('=== Fetching analytics data for timeRange:', timeRange, '===')
    
    try {
      setLoading(true)
      
      const endDate = new Date()
      let startDate: Date
      
      if (timeRange === 'week') {
        startDate = subDays(endDate, 7)
      } else if (timeRange === 'month') {
        startDate = subDays(endDate, 30)
      } else {
        // For "all time", don't set a start date to get ALL data
        startDate = new Date('2020-01-01') // Use a very old date to get all data
      }

      console.log('Date range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      })

      // Fetch data - use limit=10000 to get all reminders
      // For "all time", pass "all" to get truly all data
      const historyUrl = timeRange === 'all' 
        ? '/reminders/history?startDate=all&limit=10000'
        : `/reminders/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=10000`
      
      const [remindersRes, medicationsRes] = await Promise.allSettled([
        api.get(historyUrl),
        api.get('/medications')
      ])

      const reminders = remindersRes.status === 'fulfilled' 
        ? (remindersRes.value.data?.data?.reminders || remindersRes.value.data?.reminders || [])
        : []
      
      const medications = medicationsRes.status === 'fulfilled'
        ? (medicationsRes.value.data?.medications || medicationsRes.value.data || [])
        : []

      // Get backend calculated stats if available
      const backendStats = remindersRes.status === 'fulfilled' 
        ? remindersRes.value.data?.data?.stats 
        : null

      console.log(`=== Analytics Data Fetch ===`)
      console.log(`Time Range: ${timeRange}`)
      console.log(`History URL: ${historyUrl}`)
      console.log(`Processing ${reminders.length} reminders and ${medications.length} medications`)
      if (remindersRes.status === 'fulfilled') {
        console.log('Full API response structure:', {
          hasData: !!remindersRes.value.data,
          hasDataData: !!remindersRes.value.data?.data,
          hasStats: !!remindersRes.value.data?.data?.stats,
          statsValue: remindersRes.value.data?.data?.stats
        })
      }
      console.log('Backend stats from API:', backendStats)
      console.log(`Backend missed count: ${backendStats?.missed || 'N/A'}`)
      console.log('===========================')

      // Process medication stats
      const medStats = processMedicationStats(reminders)
      setMedicationStats(medStats)

      // Calculate overall stats - use backend stats if available for counts
      const stats = calculateOverallStats(reminders, medStats, backendStats)
      console.log('Calculated stats:', stats)
      setOverallStats(stats)

      // Calculate time analysis
      const timeStats = calculateTimeAnalysis(reminders)
      setTimeAnalysis(timeStats)

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const processMedicationStats = (reminders: any[]): MedicationStats[] => {
    const medicationMap = new Map<string, MedicationStats>()

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

      const stats = medicationMap.get(medId)!
      stats.totalDoses++
      
      if (reminder.status === 'taken') stats.takenDoses++
      else if (reminder.status === 'missed') stats.missedDoses++
      else if (reminder.status === 'skipped') stats.skippedDoses++
    })

    const medStats: MedicationStats[] = []
    medicationMap.forEach((stats) => {
      stats.adherenceRate = stats.totalDoses > 0 
        ? Math.round((stats.takenDoses / stats.totalDoses) * 100)
        : 0
      medStats.push(stats)
    })

    return medStats.sort((a, b) => b.adherenceRate - a.adherenceRate)
  }

  const calculateOverallStats = (reminders: any[], medStats: MedicationStats[], backendStats?: any): OverallStats => {
    let totalReminders = 0
    let takenCount = 0
    let missedCount = 0
    let skippedCount = 0
    let pendingCount = 0

    // Use backend stats if available (more accurate for total counts)
    if (backendStats) {
      totalReminders = backendStats.total || 0
      takenCount = backendStats.taken || 0
      missedCount = backendStats.missed || 0
      skippedCount = backendStats.skipped || 0
      pendingCount = totalReminders - takenCount - missedCount - skippedCount
      console.log('Using backend stats:', { totalReminders, takenCount, missedCount, skippedCount, pendingCount })
    } else {
      // Fallback to counting from reminders array
      reminders.forEach((reminder: any) => {
        totalReminders++
        if (reminder.status === 'taken') takenCount++
        else if (reminder.status === 'missed') missedCount++
        else if (reminder.status === 'skipped') skippedCount++
        else if (reminder.status === 'pending') pendingCount++
      })
      console.log('Calculated from reminders array:', { totalReminders, takenCount, missedCount, skippedCount, pendingCount })
    }

    const overallAdherence = totalReminders > 0 
      ? Math.round((takenCount / totalReminders) * 100)
      : 0

    // Calculate streaks (simplified for now)
    const currentStreak = Math.floor(Math.random() * 7) // Placeholder
    const longestStreak = Math.floor(Math.random() * 14) // Placeholder

    const bestMed = medStats[0] || { medicationName: 'N/A' }
    const worstMed = medStats[medStats.length - 1] || { medicationName: 'N/A' }

    return {
      totalReminders,
      takenCount,
      missedCount,
      skippedCount,
      pendingCount,
      overallAdherence,
      currentStreak,
      longestStreak,
      mostMissedMedication: worstMed.medicationName,
      bestAdherenceMedication: bestMed.medicationName,
      worstDay: 'Mon',
      bestDay: 'Fri'
    }
  }

  const calculateTimeAnalysis = (reminders: any[]): TimeAnalysisData => {
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

    return {
      morningAdherence,
      afternoonAdherence,
      eveningAdherence,
      nightAdherence,
      bestTimeSlot: bestTime[0],
      worstTimeSlot: worstTime[0]
    }
  }

  const fetchAIInsights = async () => {
    try {
      setLoadingAI(true)
      const response = await api.get(`/reminders/ai-insights?timeRange=${timeRange}`)
      if (response.data?.data?.aiInsights) {
        setAIInsights(response.data.data.aiInsights)
      }
    } catch (error: any) {
      // Silently handle AI insights error - it's optional
      console.log('AI insights not available (OpenAI API key may not be configured)')
      setAIInsights(null)
    } finally {
      setLoadingAI(false)
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
      <KeyMetrics
        overallAdherence={overallStats.overallAdherence}
        currentStreak={overallStats.currentStreak}
        longestStreak={overallStats.longestStreak}
        missedCount={overallStats.missedCount}
        totalReminders={overallStats.totalReminders}
        takenCount={overallStats.takenCount}
        bestTimeSlot={timeAnalysis.bestTimeSlot}
      />

      {/* Adherence Trend Chart - Independent Component */}
      <AdherenceTrendChart timeRange={timeRange} />

      {/* Medication Performance and Time Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MedicationPerformance medications={medicationStats} />
        <TimeAnalysis {...timeAnalysis} />
      </div>

      {/* AI Insights (keeping original for now) */}
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
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : aiInsights ? (
            <div className="space-y-6">
              {aiInsights.motivationalMessage && (
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium flex items-start gap-2">
                    <Award className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{aiInsights.motivationalMessage}</span>
                  </p>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
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

              {aiInsights.actionItems && aiInsights.actionItems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Priority Actions</h4>
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
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No AI insights available
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