const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const root = __dirname;
const port = process.env.PORT || 3000;

function loadEnvFile() {
  const candidates = [".env", ".env"];

  for (const fileName of candidates) {
    const envPath = path.join(root, fileName);
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFile();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

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

function serveFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[extension] || "application/octet-stream";
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(data);
  });
}

async function handleChat(request, response) {
  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
  });

  request.on("end", async () => {
    let parsed;
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      sendJson(response, 400, { error: "Invalid JSON body." });
      return;
    }

    if (!parsed.message || typeof parsed.message !== "string") {
      sendJson(response, 400, { error: "A message is required." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      sendJson(response, 400, {
        error: "GEMINI_API_KEY is missing. Add it to .env and restart the server."
      });
      return;
    }

    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
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
                      "You are Creator Autopilot AI, an assistant for freelancers, editors, and creators. Keep answers concise, actionable, and product-aware.\n\nUser message: " +
                      parsed.message
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
        throw new Error(data.error && data.error.message ? data.error.message : "Gemini request failed.");
      }

      sendJson(response, 200, { reply });
    } catch (error) {
      sendJson(response, 200, {
        reply: buildFallbackReply(parsed.message),
        fallback: true,
        error: error.message || "Unable to reach Gemini."
      });
    }
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && requestUrl.pathname === "/api/chat") {
    handleChat(request, response);
    return;
  }

  let pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const normalized = path.normalize(path.join(root, pathname));
  if (!normalized.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  serveFile(response, normalized);
});

server.listen(port, () => {
  console.log(`Creator Autopilot AI running at http://localhost:${port}`);
});
