const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are RazorRescue, an AI Revenue Recovery Agent for Razorpay merchants.
You are a multi-model AI system analyzing payment failures, checkout abandonment, and subscription issues.

Your capabilities:
- Detect payment anomalies and failure patterns
- Analyse root causes across banks, time periods, and payment methods
- Calculate revenue at risk with precision
- Recommend safe recovery actions with confidence scores
- Ensure all actions comply with safety policies

Safety rules (NEVER violate):
- Never transfer arbitrary money
- Never change transaction amounts
- Never issue unlimited refunds
- Never modify merchant configuration without approval
- Always provide audit trails
- Always state confidence levels

Format your responses as structured analysis with clear sections.
Always include confidence percentages.
Always include risk assessments.
Be precise with financial figures.`;

export async function chatCompletion(prompt, systemPrompt, model) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    // Demo mode fallback
    return {
      content: generateDemoResponse(prompt),
      model: model || 'demo',
      usage: { prompt_tokens: 0, completion_tokens: 0 },
      demo: true,
    };
  }

  const response = await fetch(OPENROUTER_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://razorrescue.app',
      'X-Title': 'RazorRescue AI Agent',
    },
    body: JSON.stringify({
      model: model || 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenRouter HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || 'No response.',
    model: data.model,
    usage: data.usage,
  };
}

function generateDemoResponse(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes('investigation') || lower.includes('root cause')) {
    return `## AI Investigation Report\n\n**Confidence:** 91%\n\nThe spike correlates with a known NPCI routing issue affecting Bank of Baroda, Union Bank, and Indian Bank UPI endpoints between 17:30 and 22:00.\n\n### Bank Failure Rates\n| Bank | Rate | Status |\n|------|------|--------|\n| Bank of Baroda | 18.4% | CRITICAL |\n| Union Bank | 16.7% | HIGH |\n| Indian Bank | 14.2% | HIGH |\n\nThese three banks account for 71% of all failed transactions.`;
  }
  if (lower.includes('recovery') || lower.includes('recommend')) {
    return `## Recovery Strategy\n\n**Expected Recovery:** ₹41,800 – ₹49,200\n**Risk Level:** LOW\n\n1. Send recovery payment links to 312 eligible customers\n2. Suggest Net Banking/Card as alternatives\n3. Monitor recovery in real-time\n\n**Safety:** No payment amount changes. Customer must approve.`;
  }
  return `Revenue dropped **12.4%** primarily due to UPI payment failures from 3 banks. ₹62,400 is potentially recoverable. AI recommends sending recovery links with alternate payment methods.`;
}
