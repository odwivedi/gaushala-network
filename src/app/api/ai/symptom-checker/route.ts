import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { symptoms, breed, age } = await req.json();

    if (!symptoms)
      return NextResponse.json({ success: false, error: 'Symptoms are required' }, { status: 400 });

    if (!ANTHROPIC_API_KEY)
      return NextResponse.json({ success: false, error: 'AI service not configured' }, { status: 503 });

    logger.info('API', 'ai/symptom-checker/route.ts', 'Symptom check requested', { symptoms: symptoms.slice(0, 50) });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `You are a veterinary assistant specialising in Indian cattle and gaushala management. A gaushala manager has described the following symptoms in a cow.

Symptoms: ${symptoms}
${breed ? `Breed: ${breed}` : ''}
${age ? `Age: ${age}` : ''}

Provide a structured veterinary assessment in this exact JSON format with no markdown:
{
  "possible_conditions": [
    {
      "name": "condition name",
      "likelihood": "high|medium|low",
      "description": "brief description",
      "urgency": "emergency|urgent|routine"
    }
  ],
  "immediate_actions": ["action 1", "action 2"],
  "home_management": ["tip 1", "tip 2"],
  "when_to_call_vet": "description of when professional help is needed",
  "disclaimer": "This is AI-generated guidance only. Always consult a qualified veterinarian for diagnosis and treatment."
}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('API', 'ai/symptom-checker/route.ts', 'Claude API error', { status: response.status });
      return NextResponse.json({ success: false, error: 'AI service error' }, { status: 500 });
    }

    const text = data.content?.[0]?.text || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error('API', 'ai/symptom-checker/route.ts', 'Parse failed', { text: text.slice(0, 200) });
      return NextResponse.json({ success: false, error: 'Failed to parse AI response' }, { status: 500 });
    }

    logger.info('API', 'ai/symptom-checker/route.ts', 'Symptom check complete', { conditions: parsed.possible_conditions?.length });
    return NextResponse.json({ success: true, result: parsed });
  } catch (err) {
    logger.error('API', 'ai/symptom-checker/route.ts', 'Failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Symptom check failed' }, { status: 500 });
  }
}
