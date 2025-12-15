import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const { habits } = await request.json()

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { evaluation: 'AI evaluation requires an API key. Please configure ANTHROPIC_API_KEY environment variable.' },
        { status: 200 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const habitSummary = habits.map((h: any) => {
      const recentLogs = h.logs.slice(-7)
      const totalMinutes = recentLogs.reduce((sum: number, log: any) => sum + log.minutes, 0)
      return `- ${h.name} (Priority: ${h.importance}/10): ${recentLogs.length} days logged in the past week, ${totalMinutes} total minutes`
    }).join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a helpful habit coach. Analyze these habits and provide brief, actionable insights and encouragement. Keep your response under 150 words.

Current habits:
${habitSummary}

Provide:
1. What they're doing well
2. One specific recommendation to improve consistency
3. Encouraging words to keep them motivated`
      }]
    })

    const evaluation = message.content[0].type === 'text' ? message.content[0].text : 'Unable to generate evaluation'

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error('AI Evaluation error:', error)
    return NextResponse.json(
      { evaluation: 'Great work tracking your habits! Keep up the consistency and focus on your highest priority habits. Small daily actions lead to big results over time.' },
      { status: 200 }
    )
  }
}
