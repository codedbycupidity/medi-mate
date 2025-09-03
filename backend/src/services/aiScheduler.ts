import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIScheduleRecommendation {
  times: string[];
  reasoning: string;
  considerations: string[];
}

export async function generateOptimalSchedule(
  medication: any,
  userPreferences?: {
    wakeTime?: string;
    sleepTime?: string;
    mealTimes?: {
      breakfast?: string;
      lunch?: string;
      dinner?: string;
    };
    workSchedule?: {
      start?: string;
      end?: string;
    };
  }
): Promise<AIScheduleRecommendation> {
  try {
    const systemPrompt = `You are a medical scheduling assistant. Generate optimal medication reminder times based on:
    - Medication requirements (frequency, instructions)
    - User's daily routine
    - Medical best practices
    - Drug interactions and timing requirements
    
    Return a JSON object with:
    {
      "times": ["HH:MM", "HH:MM", ...],
      "reasoning": "Brief explanation of the schedule",
      "considerations": ["Key factors considered"]
    }`;

    const userPrompt = `
    Medication: ${medication.name}
    Dosage: ${medication.dosage} ${medication.unit}
    Frequency: ${medication.frequency}
    Instructions: ${medication.instructions || 'None specified'}
    ${medication.prescribedBy ? `Prescribed by: ${medication.prescribedBy}` : ''}
    
    User Preferences:
    - Wake time: ${userPreferences?.wakeTime || '7:00 AM'}
    - Sleep time: ${userPreferences?.sleepTime || '10:00 PM'}
    - Breakfast: ${userPreferences?.mealTimes?.breakfast || '8:00 AM'}
    - Lunch: ${userPreferences?.mealTimes?.lunch || '12:00 PM'}
    - Dinner: ${userPreferences?.mealTimes?.dinner || '6:00 PM'}
    ${userPreferences?.workSchedule ? `- Work: ${userPreferences.workSchedule.start} to ${userPreferences.workSchedule.end}` : ''}
    
    Generate the optimal reminder schedule for this medication.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    return JSON.parse(response);
  } catch (error) {
    console.error('AI Schedule Generation Error:', error);
    
    // Fallback to default scheduling
    return generateDefaultSchedule(medication.frequency);
  }
}

function generateDefaultSchedule(frequency: string): AIScheduleRecommendation {
  const schedules: Record<string, AIScheduleRecommendation> = {
    once_daily: {
      times: ['09:00'],
      reasoning: 'Scheduled for morning after breakfast for optimal absorption',
      considerations: ['Morning routine', 'Meal timing']
    },
    twice_daily: {
      times: ['08:00', '20:00'],
      reasoning: 'Scheduled 12 hours apart for consistent blood levels',
      considerations: ['12-hour intervals', 'Meal timing']
    },
    three_times_daily: {
      times: ['08:00', '14:00', '20:00'],
      reasoning: 'Evenly spaced throughout waking hours with meals',
      considerations: ['8-hour intervals', 'Meal timing', 'Sleep schedule']
    },
    four_times_daily: {
      times: ['08:00', '12:00', '16:00', '20:00'],
      reasoning: 'Every 4 hours during waking hours for maximum effectiveness',
      considerations: ['4-hour intervals', 'Waking hours', 'Convenience']
    },
    as_needed: {
      times: [],
      reasoning: 'Take as needed based on symptoms',
      considerations: ['Symptom-based', 'Maximum daily dose']
    },
    weekly: {
      times: ['09:00'],
      reasoning: 'Weekly dose scheduled for consistent day and time',
      considerations: ['Same day each week', 'Morning timing']
    },
    monthly: {
      times: ['09:00'],
      reasoning: 'Monthly dose scheduled for the same date each month',
      considerations: ['Same date each month', 'Morning timing']
    }
  };

  return schedules[frequency] || schedules.once_daily;
}

export async function optimizeExistingSchedule(
  medications: any[],
  userPreferences?: any
): Promise<Map<string, AIScheduleRecommendation>> {
  const recommendations = new Map<string, AIScheduleRecommendation>();
  
  try {
    // Analyze all medications together for potential interactions
    const systemPrompt = `You are a medical scheduling assistant. Analyze multiple medications and create an optimized schedule that:
    - Avoids drug interactions
    - Maximizes effectiveness
    - Fits the user's lifestyle
    - Follows medical best practices
    
    Return a JSON object with medication IDs as keys and schedule recommendations as values.`;

    const medicationsList = medications.map(med => ({
      id: med._id.toString(),
      name: med.name,
      dosage: `${med.dosage} ${med.unit}`,
      frequency: med.frequency,
      instructions: med.instructions,
      currentTimes: med.times
    }));

    const userPrompt = `
    Medications: ${JSON.stringify(medicationsList, null, 2)}
    
    User Preferences: ${JSON.stringify(userPreferences || {}, null, 2)}
    
    Optimize the schedule for all medications, considering potential interactions and timing requirements.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    if (response) {
      const schedules = JSON.parse(response);
      for (const [medId, schedule] of Object.entries(schedules)) {
        recommendations.set(medId, schedule as AIScheduleRecommendation);
      }
    }
  } catch (error) {
    console.error('AI Batch Schedule Optimization Error:', error);
    
    // Fallback to individual scheduling
    for (const med of medications) {
      const schedule = await generateOptimalSchedule(med, userPreferences);
      recommendations.set(med._id.toString(), schedule);
    }
  }

  return recommendations;
}