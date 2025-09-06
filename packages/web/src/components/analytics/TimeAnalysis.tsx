import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

interface TimeAnalysisProps {
  morningAdherence: number
  afternoonAdherence: number
  eveningAdherence: number
  nightAdherence: number
  bestTimeSlot: string
  worstTimeSlot: string
}

export function TimeAnalysis({
  morningAdherence,
  afternoonAdherence,
  eveningAdherence,
  nightAdherence,
  bestTimeSlot,
  worstTimeSlot
}: TimeAnalysisProps) {
  const timeSlots = [
    { label: 'Morning (6am-12pm)', value: morningAdherence },
    { label: 'Afternoon (12pm-6pm)', value: afternoonAdherence },
    { label: 'Evening (6pm-12am)', value: eveningAdherence },
    { label: 'Night (12am-6am)', value: nightAdherence }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time-based Analysis</CardTitle>
        <CardDescription>Adherence by time of day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            {timeSlots.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">
                    {value}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Insights</h4>
            <div className="space-y-2 text-sm">
              {bestTimeSlot && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>
                    Best adherence during <span className="font-medium">{bestTimeSlot}</span>
                  </p>
                </div>
              )}
              {worstTimeSlot && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p>
                    Consider setting more reminders for <span className="font-medium">{worstTimeSlot}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}