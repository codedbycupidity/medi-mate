import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AdherenceData {
  overallAdherence: number;
  currentStreak: number;
  longestStreak: number;
  missedCount: number;
  takenCount: number;
  totalReminders: number;
  medicationStats: Array<{
    name: string;
    adherenceRate: number;
    missedDoses: number;
    takenDoses: number;
  }>;
  timeAnalysis: {
    morningAdherence: number;
    afternoonAdherence: number;
    eveningAdherence: number;
    nightAdherence: number;
  };
  recentTrends: Array<{
    date: string;
    adherenceRate: number;
  }>;
}

export interface AIInsight {
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  motivationalMessage: string;
  riskFactors: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
}

export async function generatePersonalizedInsights(
  adherenceData: AdherenceData,
  userName?: string
): Promise<AIInsight> {
  try {
    const systemPrompt = `You are a compassionate and knowledgeable medication adherence coach. Analyze the user's medication adherence data and provide personalized, actionable insights. 

Your response should be:
- Empathetic and encouraging
- Based on evidence and patterns in the data
- Specific and actionable
- Focused on improvement without being judgmental

Return a JSON object with:
{
  "insights": {
    "strengths": ["3-4 specific positive observations"],
    "improvements": ["3-4 areas needing attention"],
    "recommendations": ["3-4 specific, actionable recommendations"]
  },
  "motivationalMessage": "A personalized encouraging message (2-3 sentences)",
  "riskFactors": ["2-3 health risks if adherence doesn't improve"],
  "actionItems": [
    {
      "priority": "high|medium|low",
      "action": "Specific action to take",
      "impact": "Expected benefit"
    }
  ]
}`;

    const userPrompt = `
Analyze this medication adherence data for ${userName || 'the user'}:

Overall Performance:
- Overall Adherence: ${adherenceData.overallAdherence}%
- Current Streak: ${adherenceData.currentStreak} days
- Longest Streak: ${adherenceData.longestStreak} days
- Doses Taken: ${adherenceData.takenCount} out of ${adherenceData.totalReminders}
- Missed Doses: ${adherenceData.missedCount}

Medication-Specific Performance:
${adherenceData.medicationStats.map(med =>
      `- ${med.name}: ${med.adherenceRate}% adherence (${med.takenDoses} taken, ${med.missedDoses} missed)`
    ).join('\n')}

Time-of-Day Analysis:
- Morning (6am-12pm): ${adherenceData.timeAnalysis.morningAdherence}%
- Afternoon (12pm-6pm): ${adherenceData.timeAnalysis.afternoonAdherence}%
- Evening (6pm-12am): ${adherenceData.timeAnalysis.eveningAdherence}%
- Night (12am-6am): ${adherenceData.timeAnalysis.nightAdherence}%

Recent Trend (last 7 days):
${adherenceData.recentTrends.map(day =>
      `- ${day.date}: ${day.adherenceRate}%`
    ).join('\n')}

Provide personalized insights considering:
1. Patterns in the data (time of day, specific medications, trends)
2. The user's current performance level
3. Realistic improvement strategies
4. Health implications of current adherence levels
5. Positive reinforcement for good habits`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response) as AIInsight;
  } catch (error) {
    console.error('Error generating AI insights:', error);

    // Fallback to basic insights if AI fails
    return generateFallbackInsights(adherenceData);
  }
}

function generateFallbackInsights(data: AdherenceData): AIInsight {
  const insights: AIInsight = {
    insights: {
      strengths: [],
      improvements: [],
      recommendations: []
    },
    motivationalMessage: '',
    riskFactors: [],
    actionItems: []
  };

  // Generate basic rule-based insights as fallback
  if (data.overallAdherence >= 80) {
    insights.insights.strengths.push(`Excellent overall adherence rate of ${data.overallAdherence}%`);
  }

  if (data.currentStreak > 3) {
    insights.insights.strengths.push(`You're on a ${data.currentStreak}-day streak!`);
  }

  if (data.missedCount > 5) {
    insights.insights.improvements.push(`You've missed ${data.missedCount} doses recently`);
    insights.insights.recommendations.push('Set additional reminder alerts on your phone');
  }

  // Find problematic medications
  const problematicMeds = data.medicationStats.filter(m => m.adherenceRate < 70);
  if (problematicMeds.length > 0) {
    insights.insights.improvements.push(
      `Focus on improving adherence for: ${problematicMeds.map(m => m.name).join(', ')}`
    );
  }

  // Time-based recommendations
  const timeSlots = [
    { name: 'morning', rate: data.timeAnalysis.morningAdherence },
    { name: 'afternoon', rate: data.timeAnalysis.afternoonAdherence },
    { name: 'evening', rate: data.timeAnalysis.eveningAdherence },
    { name: 'night', rate: data.timeAnalysis.nightAdherence }
  ];

  const worstTime = timeSlots.reduce((worst, current) =>
    current.rate < worst.rate ? current : worst
  );

  if (worstTime.rate < 70) {
    insights.insights.recommendations.push(
      `Consider setting multiple alarms for ${worstTime.name} medications`
    );
  }

  insights.motivationalMessage = data.overallAdherence >= 80
    ? "You're doing great! Keep up the excellent work with your medications."
    : "Every dose counts. Small improvements lead to big health benefits!";

  if (data.overallAdherence < 80) {
    insights.riskFactors.push('Reduced medication effectiveness');
    insights.riskFactors.push('Potential health complications');
  }

  insights.actionItems.push({
    priority: data.missedCount > 10 ? 'high' : 'medium',
    action: 'Review and update reminder times',
    impact: 'Improve adherence by 10-15%'
  });

  return insights;
}