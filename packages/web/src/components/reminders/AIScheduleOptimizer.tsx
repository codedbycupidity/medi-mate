import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';
import { Clock, Sparkles, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AIScheduleRecommendation {
  times: string[];
  reasoning: string;
  considerations: string[];
}

interface MedicationSchedule {
  medicationId: string;
  medicationName: string;
  currentSchedule: string[];
  recommendedSchedule: AIScheduleRecommendation;
}

interface Props {
  medicationId?: string;
  onScheduleApplied?: () => void;
}

export function AIScheduleOptimizer({ medicationId, onScheduleApplied }: Props) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MedicationSchedule[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);

  const getUserPreferences = () => {
    // In a real app, these would come from user settings
    return {
      wakeTime: '07:00',
      sleepTime: '22:00',
      mealTimes: {
        breakfast: '08:00',
        lunch: '12:00',
        dinner: '18:00'
      }
    };
  };

  const generateSchedule = async () => {
    setLoading(true);
    try {
      if (medicationId) {
        // Generate for single medication
        const response = await api.post('/reminders/ai-schedule', {
          medicationId,
          userPreferences: getUserPreferences()
        });
        setRecommendations([response.data.data]);
      } else {
        // Optimize all medications
        const response = await api.post('/reminders/optimize-all', {
          userPreferences: getUserPreferences()
        });
        setRecommendations(response.data.data.medications);
      }
      toast.success('AI schedule recommendations generated!');
    } catch (error) {
      toast.error('Failed to generate AI recommendations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applySchedule = async (medId: string, times: string[]) => {
    try {
      await api.put('/reminders/apply-ai-schedule', {
        medicationId: medId,
        times
      });
      toast.success('Schedule updated successfully!');
      setSelectedMedication(medId);
      if (onScheduleApplied) {
        onScheduleApplied();
      }
    } catch (error) {
      toast.error('Failed to apply schedule');
      console.error(error);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI Schedule Optimizer
        </CardTitle>
        <CardDescription>
          Use AI to generate optimal medication reminder schedules based on your routine
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Let AI analyze your medications and create the perfect reminder schedule
            </p>
            <Button onClick={generateSchedule} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Schedule
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((med) => (
              <div
                key={med.medicationId}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{med.medicationName}</h4>
                  {selectedMedication === med.medicationId && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      Applied
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Schedule</p>
                    <div className="flex flex-wrap gap-2">
                      {med.currentSchedule.map((time, idx) => (
                        <Badge key={idx} variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(time)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">AI Recommendation</p>
                    <div className="flex flex-wrap gap-2">
                      {med.recommendedSchedule.times.map((time, idx) => (
                        <Badge key={idx} variant="default">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {formatTime(time)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">AI Reasoning</p>
                  <p className="text-sm text-muted-foreground">
                    {med.recommendedSchedule.reasoning}
                  </p>
                </div>

                {med.recommendedSchedule.considerations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {med.recommendedSchedule.considerations.map((consideration, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {consideration}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => applySchedule(med.medicationId, med.recommendedSchedule.times)}
                    disabled={selectedMedication === med.medicationId}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Apply Schedule
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRecommendations([])}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ))}

            <div className="text-center pt-4">
              <Button variant="outline" onClick={generateSchedule}>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Recommendations
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}