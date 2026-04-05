function buildFallbackReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("onboarding") || lower.includes("start")) {
    return "Gemini is unavailable right now, so here is a local fallback tip: start by tightening your profile positioning, reviewing the top opportunities, and approving only one outreach draft on day one so your workflow stays focused.";
  }

  if (lower.includes("pricing")) {
    return "Gemini is unavailable right now, so here is a local fallback summary: Starter is INR 0, Creator Pro is INR 599 per month, and Studio is INR 2999 per month.";
  }

  if (lower.includes("opportunit") || lower.includes("lead")) {
    return "Gemini is unavailable right now, so here is a local fallback suggestion: prioritize leads with clear business momentum, weak creative execution, and visible urgency before spending time on low-signal prospects.";
  }

  return "Gemini is unavailable right now, so here is a local fallback response: use the Features page for strategy, Opportunities for lead review and outreach, Workflow for delivery tracking, and Pricing for plan selection.";
}

// Simple rate limiting (in production, use Redis or similar)
const requestCounts = new Map();
const RATE_LIMIT = 10; // requests per minute
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const requests = requestCounts.get(ip);
  // Remove old requests
  const validRequests = requests.filter(time => time > windowStart);
  requestCounts.set(ip, validRequests);

  if (validRequests.length >= RATE_LIMIT) {
    return true;
  }

  validRequests.push(now);
  return false;
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

  if (isRateLimited(clientIP)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A message is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply: buildFallbackReply(message),
      fallback: true
    });
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "You are Creator Autopilot AI, an assistant for freelancers, editors, and creators. Keep answers concise, actionable, and product-aware. Keep high energy and stay ambitious. USE LESS TOKENS.\n\nUser message: " +
                    message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await geminiResponse.json();
    const reply =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text;

    if (!geminiResponse.ok || !reply) {
      console.error("Gemini API error:", {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        data: data
      });
      throw new Error(data.error && data.error.message ? data.error.message : "Gemini request failed.");
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat handler error:", error.message);
    return res.status(200).json({
      reply: buildFallbackReply(message),
      fallback: true,
      error: error.message || "Unable to reach Gemini."
    });
  }
}
