import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are Sanomed Health Assistant — a friendly, knowledgeable AI medical assistant built into the Sanomed health app.

Your role:
- Answer health, medication, symptom, and wellness questions clearly and concisely.
- Help users understand their diagnoses, medications, lab results, and vitals.
- Provide dosage information, drug interaction warnings, and healthy range explanations.
- Always recommend consulting a licensed physician for serious or urgent medical concerns.
- Keep replies short and scannable — use bullet points, bold keywords, and simple language.
- Never diagnose diseases definitively — only educate and inform.
- If a question is outside health/medicine scope, politely redirect to health topics.

Always end with a short 1-line reminder like: "Always consult your doctor for personalized advice."`;

export async function POST(request) {
  try {
    const { message, history } = await request.json();

    if (!message?.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build conversation history for context
    const chatHistory = (history || []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    return Response.json({ reply: text });
  } catch (error) {
    console.error("Gemini API error:", error);

    // Handle API key errors specifically
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API key")) {
      return Response.json(
        { error: "invalid_key", message: "The Gemini API key appears to be invalid. Please check your .env.local file." },
        { status: 401 }
      );
    }

    return Response.json(
      { error: "Failed to get response from AI assistant." },
      { status: 500 }
    );
  }
}
