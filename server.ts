import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Standard helper for resilient model fallback ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash"
];

// Lazy initialization of GoogleGenAI
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Helper to generate content with fallback
async function generateContentWithFallback(contents: any, systemInstruction?: string) {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Fallback triggered: Model ${model} failed with error:`, err?.message || err);
      lastError = err;
      // Continue to next model in fallback ladder
    }
  }

  throw lastError || new Error("All Gemini model fallback attempts failed.");
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gemini Multi-turn Chat / Reflection Endpoint
app.post("/api/gemini/generate", async (req: Request, res: Response) => {
  try {
    // Defensive payload ingestion
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const { messages, reflectionMode = "reflective_guide" } = data;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array in request body." });
    }

    // System instruction tuned to empathetic, insightful journaling and reflection
    const systemPromptMap: Record<string, string> = {
      reflective_guide: `You are an empathetic, insightful, and supportive AI Journaling Companion and Reflection Guide. 
Your goal is to help the user unpack their thoughts, explore their feelings, ask thought-provoking reflective questions, and find clarity or peace.
- Acknowledge what the user shares with warmth and emotional intelligence.
- Offer constructive perspectives, gentle reframings, or actionable brainstorming when appropriate.
- Keep your tone thoughtful, calm, and conversational. Format your response cleanly using Markdown.`,
      brainstormer: `You are an energetic, creative brainstorming partner for personal and professional growth reflections.
Your goal is to offer fresh ideas, novel angles, structured action items, and imaginative solutions for whatever the user is journaling about.
- Break down ideas into actionable bullet points.
- Spark creative curiosity.`,
      summarizer: `You are a concise, structured synthesis assistant.
Synthesize the core emotional themes, key realizations, achievements, and open questions from the user's journal entries.`
    };

    const systemInstruction = systemPromptMap[reflectionMode] || systemPromptMap.reflective_guide;

    // Convert messages into Gemini contents format
    // Filter and sanitize to strip undefined
    const sanitizedContents = messages.map((m: any) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : String(m.content || "") }],
    }));

    const result = await generateContentWithFallback(sanitizedContents, systemInstruction);

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[Gemini Generate Error]:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate reflection with Gemini API.",
    });
  }
});

// Gemini Journal Auto-Summary / Title Generator Endpoint
app.post("/api/gemini/summarize", async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const { content, conversationHistory = [] } = data;

    if (!content && (!conversationHistory || conversationHistory.length === 0)) {
      return res.status(400).json({ error: "No content or conversation history provided for summarization." });
    }

    const textToSummarize = content || conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n\n");

    const prompt = `Please analyze the following journal entry/conversation:\n\n"""\n${textToSummarize.slice(0, 8000)}\n"""\n\nProvide:
1. A concise, evocative title (max 6 words).
2. A 2-sentence executive summary capturing the core theme and insight.
3. 2-4 key takeaway tags/keywords.

Format your output strictly as a valid JSON object with keys: "title", "summary", "tags" (an array of strings). Do NOT wrap in markdown codeblocks or extra text.`;

    const result = await generateContentWithFallback(prompt);
    
    // Parse JSON safely
    let parsed: any = null;
    try {
      const cleanJson = result.text.replace(/```json\s*|```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        title: "Journal Reflection",
        summary: result.text.slice(0, 150),
        tags: ["Reflection", "Journal"]
      };
    }

    return res.json({
      success: true,
      data: parsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[Gemini Summarize Error]:", error);
    return res.status(500).json({
      error: error?.message || "Failed to summarize journal entry.",
    });
  }
});

// 1. Perspective Shifter Endpoint (Multi-Persona Reflection Panel)
app.post("/api/gemini/perspectives", async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const { content, conversationHistory = [], selectedPersona } = data;

    const textToAnalyze = content || conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n\n");
    if (!textToAnalyze.trim()) {
      return res.status(400).json({ error: "No content provided to generate perspectives." });
    }

    const prompt = `Analyze this user's journal reflection:\n\n"""\n${textToAnalyze.slice(0, 8000)}\n"""\n\n
Generate distinct philosophical and psychological perspectives.
${selectedPersona ? `Focus primarily on persona: "${selectedPersona}".` : "Provide all 4 personas."}

Return a strictly valid JSON object with the key "perspectives" containing an array of objects. Each object must have:
- "id": string ("stoic" | "cbt" | "future_self" | "socratic")
- "name": string (e.g. "The Stoic Sage", "CBT Cognitive Reframer", "Future Self (10 Years Ahead)", "The Socratic Inquirer")
- "icon": string ("shield" | "brain" | "sparkles" | "help-circle")
- "quote": short evocative philosophical anchor or motto (1 sentence)
- "analysis": insightful breakdown of the situation from this specific lens (2-3 paragraphs with Markdown formatting)
- "keyInsight": 1 powerful takeaway bullet
- "actionStep": 1 concrete, empowering micro-practice

Strictly return raw JSON without markdown code fences.`;

    const result = await generateContentWithFallback(prompt);
    let parsed: any = null;
    try {
      const cleanJson = result.text.replace(/```json\s*|```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        perspectives: [
          {
            id: "stoic",
            name: "The Stoic Sage",
            icon: "shield",
            quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
            analysis: "From the Stoic lens, what weighs on you is not the circumstance itself, but your judgment regarding it. Divide this situation cleanly into what you can directly command (your focus, intentions, composure) and what belongs to the world.",
            keyInsight: "Focus your energy solely on your internal response and character.",
            actionStep: "Identify one thing outside your control today and consciously let go of directing its outcome."
          },
          {
            id: "cbt",
            name: "CBT Cognitive Reframer",
            icon: "brain",
            quote: "Thoughts are mental events, not immutable facts.",
            analysis: "Notice the cognitive patterns at play here. When strong emotions arise, our mind often reaches for absolute narratives. By examining the evidence objectively, we can uncover balanced interpretations that support emotional resilience.",
            keyInsight: "Separate what actually happened from the catastrophic predictions your mind created.",
            actionStep: "Write down your primary worry, then draft three alternative, realistic outcomes."
          },
          {
            id: "future_self",
            name: "Future Self (10 Years Ahead)",
            icon: "sparkles",
            quote: "This moment is a single stitch in a vast and beautiful tapestry.",
            analysis: "Looking back at this season from ten years down the road, this challenge was actually a turning point of quiet courage and character formation. You survived every difficult day before this one, and you possess the inner depth to navigate this too.",
            keyInsight: "In the macro picture of your life, this difficulty is teaching you resilience.",
            actionStep: "Take 3 deep breaths and give yourself credit for showing up today."
          },
          {
            id: "socratic",
            name: "The Socratic Inquirer",
            icon: "help-circle",
            quote: "The unexamined thought is not worth believing.",
            analysis: "Let us look underneath the surface of this experience:\n- What unstated rule are you expecting yourself or others to follow?\n- What would change if you held this expectation more lightly?\n- What is the most courageous choice you can make right now?",
            keyInsight: "Your honest questions are more valuable than hasty answers.",
            actionStep: "Sit with one of these questions for 3 uninterrupted minutes without forcing a resolution."
          }
        ]
      };
    }

    return res.json({
      success: true,
      perspectives: parsed.perspectives || [],
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[Gemini Perspectives Error]:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate perspectives with Gemini API.",
    });
  }
});

// 2. Emotional Resonance & Cognitive Bias Visualizer Endpoint
app.post("/api/gemini/emotional-analysis", async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const { content, conversationHistory = [] } = data;

    const textToAnalyze = content || conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n\n");
    if (!textToAnalyze.trim()) {
      return res.status(400).json({ error: "No content provided for emotional analysis." });
    }

    const prompt = `Perform an empathetic psychological & emotional analysis of this journal reflection:\n\n"""\n${textToAnalyze.slice(0, 8000)}\n"""\n\n
Return a strictly valid JSON object with the following schema:
{
  "valence": number (-100 to +100 representing emotional valence),
  "energyLevel": string ("Low" | "Moderate" | "High"),
  "dominantEmotions": string[] (3-5 nuanced emotional words, e.g. ["Vulnerable", "Reflective", "Cautiously Hopeful"]),
  "biasesDetected": [
    {
      "name": string (e.g. "Catastrophizing", "All-or-Nothing Thinking", "Emotional Reasoning", "Should Statements", "Mind Reading"),
      "detectedQuote": string (snippet or phrase representing this pattern),
      "explanation": string (why this bias is present),
      "counterReframe": string (gentle healthier viewpoint)
    }
  ],
  "microAction": {
    "title": string (e.g. "2-Minute Box Breathing Reset" or "5-4-3-2-1 Sensory Grounding"),
    "durationSeconds": number (e.g. 120),
    "category": string ("Breathwork" | "Cognitive Defusion" | "Gratitude Anchor" | "Somatic Release"),
    "instructions": string[] (step-by-step guidance list)
  }
}

Do NOT output markdown ticks. Return raw JSON only.`;

    const result = await generateContentWithFallback(prompt);
    let parsed: any = null;
    try {
      const cleanJson = result.text.replace(/```json\s*|```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        valence: 20,
        energyLevel: "Moderate",
        dominantEmotions: ["Reflective", "Searching", "Contemplative"],
        biasesDetected: [
          {
            name: "All-or-Nothing Framing",
            detectedQuote: "Feeling like things either work perfectly or fail",
            explanation: "Viewing complex progress in binary categories.",
            counterReframe: "Progress is iterative and non-linear. Every small step counts."
          }
        ],
        microAction: {
          title: "2-Minute Box Breathing Reset",
          durationSeconds: 120,
          category: "Breathwork",
          instructions: [
            "Inhale slowly through your nose for 4 counts",
            "Hold your breath gently for 4 counts",
            "Exhale smoothly through your mouth for 4 counts",
            "Rest in the stillness for 4 counts"
          ]
        }
      };
    }

    return res.json({
      success: true,
      data: parsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[Gemini Emotional Analysis Error]:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze emotional resonance.",
    });
  }
});

// 3. Cross-Reflection Semantic Memory & Trend Synthesizer Endpoint
app.post("/api/gemini/synthesize-trends", async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const { entries = [] } = data;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "No historical entries provided to synthesize trends." });
    }

    const compactEntries = entries.slice(0, 30).map((e: any, idx: number) => ({
      index: idx + 1,
      date: new Date(e.createdAt || Date.now()).toLocaleDateString(),
      title: e.title || "Untitled",
      mood: e.mood || "Unspecified",
      summary: e.summary || (e.messages?.[0]?.content?.slice(0, 200) || "")
    }));

    const prompt = `Analyze these ${compactEntries.length} chronological journal entries to extract macro trends, patterns, and insights:\n\n${JSON.stringify(compactEntries, null, 2)}\n\n
Provide a comprehensive growth retrospective. Return a strictly valid JSON object:
{
  "retrospectiveTitle": string (e.g. "Weekly Evolution & Mental Clarity Snapshot"),
  "overallTrajectory": string (description of the user's emotional arc over time),
  "topThemes": [
    { "theme": string, "percentage": number, "description": string }
  ],
  "recurringPatterns": [
    { "triggerOrContext": string, "observedOutcome": string, "actionableInsight": string }
  ],
  "celebrations": string[] (2-3 real breakthroughs or positive mindsets demonstrated),
  "growthPromptForNextWeek": string (one deep reflective question to journal about this week)
}

Do NOT wrap in markdown ticks. Return strictly raw JSON.`;

    const result = await generateContentWithFallback(prompt);
    let parsed: any = null;
    try {
      const cleanJson = result.text.replace(/```json\s*|```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        retrospectiveTitle: "Journal Evolution & Growth Retrospective",
        overallTrajectory: "Demonstrating increasing clarity, emotional vulnerability, and purposeful reflection.",
        topThemes: [
          { theme: "Personal Growth & Purpose", percentage: 40, description: "Navigating aspirations and internal alignment." },
          { theme: "Daily Balance & Energy", percentage: 35, description: "Managing commitments, focus, and restoration." },
          { theme: "Relationships & Connection", percentage: 25, description: "Reflecting on communication and meaningful bonds." }
        ],
        recurringPatterns: [
          { triggerOrContext: "Evening journaling", observedOutcome: "Reduced restlessness and clearer morning priorities", actionableInsight: "Preserve a 10-minute quiet reflection window before sleep." }
        ],
        celebrations: [
          "Consistent dedication to honest self-inquiry",
          "Growing ability to identify and reframe automatic stressors"
        ],
        growthPromptForNextWeek: "What is one quiet boundary you can establish this week to protect your creative peace?"
      };
    }

    return res.json({
      success: true,
      retrospective: parsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[Gemini Synthesize Trends Error]:", error);
    return res.status(500).json({
      error: error?.message || "Failed to synthesize journal trends.",
    });
  }
});

// 4. Interactive Thought Canvas (Concept Mapping Graph) Endpoint
app.post("/api/gemini/thought-map", async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const { content, conversationHistory = [] } = data;

    const textToAnalyze = content || conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n\n");
    if (!textToAnalyze.trim()) {
      return res.status(400).json({ error: "No content provided to generate thought map." });
    }

    const prompt = `Deconstruct this journal reflection into a structured Cognitive Thought Map:\n\n"""\n${textToAnalyze.slice(0, 8000)}\n"""\n\n
Generate a node graph breaking down:
1. Trigger / Catalyst (Root situation or event)
2. Felt Emotion / Reaction (Immediate felt response)
3. Underlying Core Belief / Assumption (Mental model driving the reaction)
4. Alternative Perspective / Reframe (Objective, compassionate reframe)
5. Empowered Action / Movement (Constructive next step)

Return a strictly valid JSON object with the following schema:
{
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger" | "feeling" | "belief" | "reframe" | "action",
      "label": string (short 3-5 word label),
      "description": string (1-2 sentences explaining this node),
      "impact": "neutral" | "challenging" | "empowering"
    }
  ],
  "edges": [
    {
      "from": "node_1",
      "to": "node_2",
      "relationship": string (e.g. "Triggers", "Reveals", "Reframed by", "Leads to")
    }
  ]
}

Ensure you generate 5 to 7 meaningful nodes with connecting edges. Do NOT wrap in markdown ticks. Return strictly raw JSON.`;

    const result = await generateContentWithFallback(prompt);
    let parsed: any = null;
    try {
      const cleanJson = result.text.replace(/```json\s*|```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        nodes: [
          { id: "node_1", type: "trigger", label: "Catalyst Situation", description: "The primary event or context you described in your reflection.", impact: "neutral" },
          { id: "node_2", type: "feeling", label: "Emotional Surge", description: "The immediate sensation or anxiety prompted by the situation.", impact: "challenging" },
          { id: "node_3", type: "belief", label: "Underlying Assumption", description: "The unspoken standard or fear giving power to the situation.", impact: "challenging" },
          { id: "node_4", type: "reframe", label: "Grounded Truth", description: "A balanced perspective seeing both sides clearly.", impact: "empowering" },
          { id: "node_5", type: "action", label: "Constructive Movement", description: "The next concrete action within your direct locus of control.", impact: "empowering" }
        ],
        edges: [
          { from: "node_1", to: "node_2", relationship: "Evokes" },
          { from: "node_2", to: "node_3", relationship: "Roots in" },
          { from: "node_3", to: "node_4", relationship: "Transformed by" },
          { from: "node_4", to: "node_5", relationship: "Ignites" }
        ]
      };
    }

    return res.json({
      success: true,
      map: parsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[Gemini Thought Map Error]:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate thought canvas map.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Reflections & Journal running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
