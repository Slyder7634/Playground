const profile = {
  name: "Ava Lens Studio",
  niche: "Short-form ads + reels editing",
  tone: "Confident, sharp, conversion-focused",
  platform: "Instagram",
  quote:
    "We help brands turn flat footage into high-retention creative that actually sells.",
  note: "AI mirrors concise, premium language with direct response framing."
};

const strategyItems = [
  {
    title: "Reposition the bio around outcomes",
    description:
      "Lead with ad performance, retention, and turnaround instead of generic editing services.",
    tags: ["Branding", "Conversion", "Low effort"]
  },
  {
    title: "Shift content toward before/after breakdowns",
    description:
      "Short diagnostic edits outperform passive portfolio posts for this audience and create authority quickly.",
    tags: ["Content", "Authority", "Instagram"]
  },
  {
    title: "Post when decision-makers are active",
    description:
      "Tuesday, Thursday, and Saturday at 7:30 PM has the highest overlap with brand founders reviewing creative.",
    tags: ["Schedule", "Engagement", "Testing"]
  }
];

const opportunities = [
  {
    name: "Northstar Grooming",
    intentScore: 92,
    summary: "Scaling paid social with weak video hooks and inconsistent retention.",
    reason: "Recent ad spend increase, stale creative rotation, active product launch.",
    outreach:
      "Hey Northstar team, I noticed your new product push is getting strong visibility, but the current short-form edits are leaving retention on the table.\n\nI specialize in turning raw product footage into sharper, faster hooks for DTC brands. I sketched two quick improvements I'd make to your current ad style if you want to see them.",
    nextAction: "Approve first-touch message"
  },
  {
    name: "Studio Mysa",
    intentScore: 84,
    summary: "Beautiful brand, but reels cadence dropped while competitors increased output.",
    reason: "Declining posting frequency, strong comments, visible content gap.",
    outreach:
      "Hi Studio Mysa, your brand aesthetic is strong, but there's a real chance to make your reels feel more active and conversion-ready.\n\nI help lifestyle brands package existing footage into cleaner, faster edits that hold attention without losing the premium feel. I'd be happy to share a sample direction built around your recent launches.",
    nextAction: "Adapt tone to softer luxury voice"
  },
  {
    name: "Peakframe Fitness",
    intentScore: 77,
    summary: "Coach-led content is working, but edits are repetitive and visually flat.",
    reason: "Growth spike, hiring signals, productized offer expansion.",
    outreach:
      "Hey Peakframe, you already have the right raw material on camera. The gap is mostly in pacing, structure, and repetition.\n\nI work with performance brands to turn founder-led footage into tighter shorts that feel more dynamic and sell more clearly. If useful, I can send a short audit of your latest three videos.",
    nextAction: "Wait for one more posting signal"
  }
];

const pipeline = [
  {
    client: "Nova Skin Labs",
    stage: "Proposal sent",
    detail: "Awaiting review on monthly short-form editing retainer.",
    progress: 68
  },
  {
    client: "Vanta Social",
    stage: "Editing sprint",
    detail: "Round one delivery due Tuesday with 5 creator ad variations.",
    progress: 42
  },
  {
    client: "Threadline",
    stage: "Follow-up due",
    detail: "Send testimonial deck and pricing clarification tomorrow morning.",
    progress: 85
  }
];

let activeOpportunityIndex = 0;
let rewriteMode = "default";
let chatOpen = false;
let chatBusy = false;

function createChatWidget() {
  const wrapper = document.createElement("div");
  wrapper.className = "assistant-shell";
  wrapper.innerHTML = `
    <button class="assistant-toggle" id="assistantToggle" type="button" aria-expanded="false">
      Ask Autopilot AI
    </button>
    <section class="assistant-panel" id="assistantPanel" hidden>
      <div class="assistant-header">
        <div>
          <p class="panel-label">AI Assistant</p>
          <h3>Creator growth copilot</h3>
        </div>
        <button class="assistant-close" id="assistantClose" type="button" aria-label="Close assistant">×</button>
      </div>
      <div class="assistant-messages" id="assistantMessages">
        <article class="assistant-message assistant-message-bot">
          Ask about positioning, outreach, content plans, or how to use Creator Autopilot AI.
        </article>
      </div>
      <form class="assistant-form" id="assistantForm">
        <textarea
          id="assistantInput"
          class="assistant-input"
          rows="3"
          placeholder="Ask the assistant something..."
        ></textarea>
        <div class="assistant-actions">
          <p class="assistant-note" id="assistantNote">Get your doubts fixed with AI responses.</p>
          <button class="primary-button small-button" id="assistantSend" type="submit">Send</button>
        </div>
      </form>
    </section>
  `;
  document.body.appendChild(wrapper);
}

function setChatOpen(nextOpen) {
  const panel = document.getElementById("assistantPanel");
  const toggle = document.getElementById("assistantToggle");
  if (!panel || !toggle) {
    return;
  }

  chatOpen = nextOpen;
  panel.hidden = !chatOpen;
  toggle.setAttribute("aria-expanded", String(chatOpen));
}

function appendChatMessage(role, text) {
  const messages = document.getElementById("assistantMessages");
  if (!messages) {
    return;
  }

  const item = document.createElement("article");
  item.className = `assistant-message assistant-message-${role}`;
  item.textContent = text;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

async function submitChat(message) {
  const note = document.getElementById("assistantNote");
  const send = document.getElementById("assistantSend");
  if (chatBusy) {
    return;
  }

  chatBusy = true;
  if (send) {
    send.disabled = true;
    send.textContent = "Sending...";
  }
  if (note) {
    note.textContent = "Thinking through your request...";
  }

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Chat request failed.");
    }

    appendChatMessage("bot", data.reply);
    if (note) {
      note.textContent = data.fallback
        ? "Gemini is currently unavailable, so the assistant is replying with a local fallback."
        : "Powered by Gemini through your local configuration.";
    }
  } catch (error) {
    appendChatMessage("bot", error.message);
    if (note) {
      note.textContent = "Add GEMINI_API_KEY to .env, then restart the local server.";
    }
  } finally {
    chatBusy = false;
    if (send) {
      send.disabled = false;
      send.textContent = "Send";
    }
  }
}

function markActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".nav-link").forEach((link) => {
    const target = link.getAttribute("href");
    if (target === `${page}.html`) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function renderProfile() {
  const name = document.getElementById("profileName");
  const niche = document.getElementById("profileNiche");
  const tone = document.getElementById("profileTone");
  const platform = document.getElementById("profilePlatform");
  const quote = document.getElementById("personaQuote");
  const note = document.getElementById("personaNote");

  if (!name || !niche || !tone || !platform || !quote || !note) {
    return;
  }

  name.textContent = profile.name;
  niche.textContent = profile.niche;
  tone.textContent = profile.tone;
  platform.textContent = profile.platform;
  quote.textContent = `"${profile.quote}"`;
  note.textContent = profile.note;
}

function renderStrategies() {
  const strategyCards = document.getElementById("strategyCards");
  if (!strategyCards) {
    return;
  }

  strategyCards.innerHTML = "";
  strategyItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "strategy-card";
    card.innerHTML = `
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      <div class="tag-row">
        ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    `;
    strategyCards.appendChild(card);
  });
}

function buildMessage(opportunity) {
  if (rewriteMode === "soft") {
    return opportunity.outreach
      .replace("I specialize in", "I usually help brands by")
      .replace("I help lifestyle brands", "I often support lifestyle brands")
      .replace("I work with performance brands", "I collaborate with performance brands");
  }

  return opportunity.outreach;
}

function renderOpportunities() {
  const opportunityList = document.getElementById("opportunityList");
  const approvalNote = document.getElementById("approvalNote");
  if (!opportunityList) {
    return;
  }

  opportunityList.innerHTML = "";
  opportunities.forEach((opportunity, index) => {
    const card = document.createElement("article");
    card.className = `opportunity-card${index === activeOpportunityIndex ? " active" : ""}`;
    card.innerHTML = `
      <div class="opportunity-header">
        <div>
          <h4>${opportunity.name}</h4>
          <p class="opportunity-meta">${opportunity.summary}</p>
        </div>
        <span class="score-pill">${opportunity.intentScore} intent</span>
      </div>
      <p>${opportunity.reason}</p>
      <p class="opportunity-meta">${opportunity.nextAction}</p>
    `;
    card.addEventListener("click", () => {
      activeOpportunityIndex = index;
      if (approvalNote) {
        approvalNote.textContent = "Waiting for your approval. Nothing has been sent.";
      }
      renderOpportunities();
      renderMessage();
    });
    opportunityList.appendChild(card);
  });
}

function renderMessage() {
  const messageBox = document.getElementById("messageBox");
  if (!messageBox) {
    return;
  }

  messageBox.textContent = buildMessage(opportunities[activeOpportunityIndex]);
}

function renderPipeline() {
  const pipelineList = document.getElementById("pipelineList");
  if (!pipelineList) {
    return;
  }

  pipelineList.innerHTML = "";
  pipeline.forEach((item) => {
    const block = document.createElement("article");
    block.className = "pipeline-item";
    block.innerHTML = `
      <div class="pipeline-header">
        <div>
          <h4>${item.client}</h4>
          <p class="pipeline-meta">${item.detail}</p>
        </div>
        <span class="stage-pill">${item.stage}</span>
      </div>
      <div class="pipeline-progress"><span style="width:${item.progress}%"></span></div>
    `;
    pipelineList.appendChild(block);
  });
}

function bindControls() {
  const rewriteButton = document.getElementById("rewriteButton");
  const approveButton = document.getElementById("approveButton");
  const assistantToggle = document.getElementById("assistantToggle");
  const assistantClose = document.getElementById("assistantClose");
  const assistantForm = document.getElementById("assistantForm");

  if (rewriteButton) {
    rewriteButton.addEventListener("click", () => {
      const approvalNote = document.getElementById("approvalNote");
      rewriteMode = rewriteMode === "default" ? "soft" : "default";
      renderMessage();
      if (approvalNote) {
        approvalNote.textContent =
          rewriteMode === "soft"
            ? "Draft rewritten in a softer brand voice. Still pending approval."
            : "Draft reset to the default brand voice. Still pending approval.";
      }
    });
  }

  if (approveButton) {
    approveButton.addEventListener("click", () => {
      const approvalNote = document.getElementById("approvalNote");
      if (approvalNote) {
        approvalNote.textContent = `Approved for ${opportunities[activeOpportunityIndex].name}. Ready for manual send.`;
      }
    });
  }

  if (assistantToggle) {
    assistantToggle.addEventListener("click", () => {
      setChatOpen(!chatOpen);
    });
  }

  if (assistantClose) {
    assistantClose.addEventListener("click", () => {
      setChatOpen(false);
    });
  }

  if (assistantForm) {
    assistantForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("assistantInput");
      if (!input) {
        return;
      }

      const message = input.value.trim();
      if (!message) {
        return;
      }

      appendChatMessage("user", message);
      input.value = "";
      setChatOpen(true);
      await submitChat(message);
    });
  }
}

createChatWidget();
markActiveNav();
renderProfile();
renderStrategies();
renderOpportunities();
renderMessage();
renderPipeline();
bindControls();
