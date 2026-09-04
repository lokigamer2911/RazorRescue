const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// System prompt is hardcoded — NEVER from user input
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
    // Never fabricate metrics. Callers (the orchestrator) fall back to their
    // deterministic data engines when demo is true.
    return {
      content: '',
      model: model || 'demo',
      usage: { prompt_tokens: 0, completion_tokens: 0 },
      demo: true,
    };
  }

  // Validate model against allowlist — prevent arbitrary model injection
  const ALLOWED_MODELS = [
    'anthropic/claude-sonnet-4', 'openai/gpt-4o', 'google/gemini-2.5-pro-preview',
    'anthropic/claude-haiku-3.5', 'openai/gpt-4o-mini', 'deepseek/deepseek-r1',
    'google/gemini-2.0-flash-001', 'meta-llama/llama-4-maverick', 'qwen/qwen3-235b-a22b',
    'openai/gpt-4.1-mini', 'anthropic/claude-3.5-haiku', 'mistralai/mistral-small-3.2-24b',
  ];
  const safeModel = ALLOWED_MODELS.includes(model) ? model : 'anthropic/claude-sonnet-4';

  // System prompt is ALWAYS the hardcoded one — user parameter is ignored
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://razorrescue.app',
        'X-Title': 'RazorRescue AI Agent',
      },
      body: JSON.stringify({
        model: safeModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: String(prompt).slice(0, 4000) },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

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
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('AI request timed out');
    throw err;
  }
}
