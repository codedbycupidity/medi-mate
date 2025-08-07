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
  const [appliedMedications, setAppliedMedications] = useState<Set<string>>(new Set());
  const [originalSchedules, setOriginalSchedules] = useState<Map<string, string[]>>(new Map());

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
        setRecommendations([response.data]);
        // Store original schedule ONLY if we don't already have it
        // This preserves the true original even if regenerating
        setOriginalSchedules(prev => {
          const newMap = new Map(prev);
          if (!newMap.has(response.data.medicationId)) {
            newMap.set(response.data.medicationId, response.data.currentSchedule);
          }
          return newMap;
        });
      } else {
        // Optimize all medications
        const response = await api.post('/reminders/optimize-all', {
          userPreferences: getUserPreferences()
        });
        console.log('Response:', response);
        const meds = response.data?.medications || [];
        setRecommendations(meds);
        // Store all original schedules ONLY for new medications
        setOriginalSchedules(prev => {
          const newMap = new Map(prev);
          meds.forEach((med: MedicationSchedule) => {
            if (!newMap.has(med.medicationId)) {
              newMap.set(med.medicationId, med.currentSchedule);
            }
          });
          return newMap;
        });
      }
      // Clear applied medications when generating new recommendations
      setAppliedMedications(new Set());
      toast.success('AI schedule recommendations generated!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to generate AI recommendations';
      toast.error(errorMessage);
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
      // Add to the set of applied medications
      setAppliedMedications(prev => new Set(prev).add(medId));
      // Don't refresh the page immediately - let user apply other schedules first
      // Only refresh when they're done (close the recommendations)
    } catch (error) {
      toast.error('Failed to apply schedule');
      console.error(error);
    }
  };

  const closeRecommendations = () => {
    setRecommendations([]);
    setAppliedMedications(new Set()); // Clear applied medications
    setOriginalSchedules(new Map()); // Clear original schedules
    // Refresh the parent component after closing to show updated schedules
    if (onScheduleApplied) {
      onScheduleApplied();
    }
  };

  const skipRecommendation = async (medId: string) => {
    // If this medication was already applied, revert it
    if (appliedMedications.has(medId)) {
      const originalSchedule = originalSchedules.get(medId);
      console.log(`Reverting medication ${medId} to original schedule:`, originalSchedule);
      
      if (originalSchedule && originalSchedule.length > 0) {
        try {
          // Use the revert endpoint that cleans up AI reminders and restores original ones
          const response = await api.put('/reminders/revert-schedule', {
            medicationId: medId,
            times: originalSchedule,
            cleanupReminders: true,
            regenerateOriginal: true
          });
          const deletedCount = response.data?.deletedReminders || 0;
          const createdCount = response.data?.createdReminders || 0;
          console.log(`Revert result: deleted ${deletedCount}, created ${createdCount}`);
          toast.success('Schedule and reminders reverted to original');
        } catch (error) {
          toast.error('Failed to revert schedule');
          console.error('Error reverting schedule:', error);
        }
      } else {
        console.warn('No original schedule found for medication:', medId);
        toast.error('Could not find original schedule to revert to');
      }
      
      // Remove from applied medications
      setAppliedMedications(prev => {
        const newSet = new Set(prev);
        newSet.delete(medId);
        return newSet;
      });
    }
    // Remove from recommendations
    setRecommendations(prev => prev.filter(r => r.medicationId !== medId));
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
                  {appliedMedications.has(med.medicationId) && (
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
                    disabled={appliedMedications.has(med.medicationId)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Apply Schedule
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => skipRecommendation(med.medicationId)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {appliedMedications.has(med.medicationId) ? 'Undo' : 'Skip'}
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" onClick={generateSchedule}>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Recommendations
              </Button>
              <Button onClick={closeRecommendations}>
                Done
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}