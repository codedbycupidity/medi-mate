import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@medimate/components'
import { Target, Award, XCircle, Clock } from 'lucide-react'

interface KeyMetricsProps {
  overallAdherence: number
  currentStreak: number
  longestStreak: number
  missedCount: number
  totalReminders: number
  takenCount: number
  bestTimeSlot: string
}

export function KeyMetrics({
  overallAdherence,
  currentStreak,
  longestStreak,
  missedCount,
  totalReminders,
  takenCount,
  bestTimeSlot
}: KeyMetricsProps) {
  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Adherence</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getAdherenceColor(overallAdherence)}`}>
            {overallAdherence}%
          </div>
          <p className="text-xs text-muted-foreground">
            {takenCount} of {totalReminders} doses taken
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStreak} days</div>
          <p className="text-xs text-muted-foreground">
            Longest: {longestStreak} days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Missed Doses</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{missedCount}</div>
          <p className="text-xs text-muted-foreground">
            {totalReminders > 0 ? Math.round((missedCount / totalReminders) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Best Time Slot</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-bold">{bestTimeSlot || 'N/A'}</div>
          <p className="text-xs text-muted-foreground">
            Highest adherence time
          </p>
        </CardContent>
      </Card>
    </div>
  )
}