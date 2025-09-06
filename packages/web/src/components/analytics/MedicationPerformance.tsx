import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Badge } from '../ui/badge'
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

interface MedicationPerformanceProps {
  medications: MedicationStats[]
}

export function MedicationPerformance({ medications }: MedicationPerformanceProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medication Performance</CardTitle>
        <CardDescription>Adherence by medication</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {medications.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No medication data available
            </p>
          ) : (
            medications.slice(0, 5).map((med) => (
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
  )
}