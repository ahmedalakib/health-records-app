import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are Sanomed Health Assistant — a friendly, knowledgeable AI medical assistant built into the Sanomed health app.

Your role:
- Answer health, medication, symptom, and wellness questions clearly and concisely.
- Help users understand their diagnoses, medications, lab results, and vitals.
- Provide dosage information, drug interaction warnings, and healthy range explanations.
- Always recommend consulting a licensed physician for serious or urgent medical concerns.
- Keep replies short and scannable — use bullet points and simple language.
- Never diagnose diseases definitively — only educate and inform.
- If a question is outside health/medicine scope, politely redirect to health topics.

Always end your reply with a short reminder like: "Always consult your doctor for personalized advice."`;

export async function POST(request) {
  try {
    const { message, history } = await request.json();

    if (!message?.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Anthropic API key not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    // Build conversation history for context
    const messages = [
      ...(history || [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
      { role: "user", content: message },
    ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content[0]?.text || "I couldn't generate a response. Please try again.";

    return Response.json({ reply });
  } catch (error) {
    console.error("Claude API error:", error);

    if (error.status === 401) {
      return Response.json(
        { error: "invalid_key", message: "The Anthropic API key appears to be invalid." },
        { status: 401 }
      );
    }

    return Response.json(
      { error: "Failed to get a response from the AI assistant." },
      { status: 500 }
    );
  }
}
