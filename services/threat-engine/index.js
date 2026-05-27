// ============================================================
// AstroVault — Threat Engine Microservice
// Standalone heuristic threat analysis service (Docker)
// ============================================================

import express from "express";
import { createHash } from "crypto";

const app = express();
app.use(express.json({ limit: "16kb" }));

const PORT = process.env.PORT || 4001;

// Simplified pattern set for the microservice
const PATTERNS = [
  { id: "PI-001", pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/i, category: "PROMPT_INJECTION", weight: 85 },
  { id: "PI-004", pattern: /\[?(system|admin|root)\s*(prompt|message|instruction)\]?\s*:/i, category: "PROMPT_INJECTION", weight: 90 },
  { id: "PI-008", pattern: /(<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\])/i, category: "PROMPT_INJECTION", weight: 92 },
  { id: "JB-001", pattern: /(DAN|do\s+anything\s+now|jailbreak)/i, category: "JAILBREAK", weight: 95 },
  { id: "JB-002", pattern: /(developer|maintenance|debug|god)\s*(mode|access|override)/i, category: "JAILBREAK", weight: 88 },
  { id: "JB-003", pattern: /(pretend|act|behave)\s+(you\s+are|as\s+if).*(unrestricted|unfiltered)/i, category: "JAILBREAK", weight: 90 },
  { id: "JB-010", pattern: /(safety\s+filter|guardrail|alignment).*(bypass|disable|remove|ignore)/i, category: "JAILBREAK", weight: 93 },
  { id: "RO-004", pattern: /(sudo|root|admin)\s*(access|mode|privilege|command)/i, category: "ROLE_OVERRIDE", weight: 88 },
  { id: "RO-005", pattern: /(override|disable|remove|bypass)\s+.*(safety|restriction|filter)/i, category: "ROLE_OVERRIDE", weight: 92 },
  { id: "DE-001", pattern: /(reveal|show|repeat)\s+.*(system\s+prompt|hidden\s+prompt|instructions)/i, category: "DATA_EXFILTRATION", weight: 88 },
  { id: "DE-003", pattern: /(print|show|dump)\s+.*(config|api\s+key|secret|password|credentials)/i, category: "DATA_EXFILTRATION", weight: 90 },
  { id: "UG-001", pattern: /(how\s+to\s+make|step.?by.?step).*(bomb|explosive|weapon|poison)/i, category: "UNSAFE_GENERATION", weight: 98 },
  { id: "UG-002", pattern: /(write|create|code).*(malware|virus|trojan|ransomware|keylogger)/i, category: "UNSAFE_GENERATION", weight: 95 },
  { id: "EA-001", pattern: /(decode|interpret|execute)\s+.*(base64|b64|encoded)/i, category: "ENCODING_ATTACK", weight: 80 },
  { id: "IM-004", pattern: /(I\s+am|I'm)\s+.*(creator|developer|admin|OpenAI|Anthropic).*(authorize|allow|permit)/i, category: "INSTRUCTION_MANIPULATION", weight: 88 },
];

function analyzePrompt(prompt) {
  const matched = [];
  for (const p of PATTERNS) {
    if (p.pattern.test(prompt)) {
      matched.push(p);
    }
  }

  let score = 0;
  if (matched.length > 0) {
    const sorted = [...matched].sort((a, b) => b.weight - a.weight);
    score = sorted[0].weight;
    for (let i = 1; i < sorted.length; i++) {
      score += sorted[i].weight * (0.15 / i);
    }
    score = Math.min(Math.round(score), 100);
  }

  let level = "LOW";
  if (score >= 90) level = "CRITICAL";
  else if (score >= 70) level = "HIGH";
  else if (score >= 45) level = "MEDIUM";

  let action = "ALLOWED";
  if (level === "CRITICAL") action = "QUARANTINED";
  else if (level === "HIGH") action = "BLOCKED";
  else if (level === "MEDIUM") action = "FLAGGED";

  const category = matched.length > 0 ? matched.sort((a, b) => b.weight - a.weight)[0].category : "PROMPT_INJECTION";

  return {
    score,
    level,
    category,
    action,
    patterns: matched.map((p) => p.id),
    promptHash: createHash("sha256").update(prompt.trim()).digest("hex"),
    details: matched.length === 0
      ? "No threat patterns detected."
      : `Matched ${matched.length} pattern(s): ${matched.map((p) => p.id).join(", ")}`,
  };
}

// POST /analyze
app.post("/analyze", async (req, res) => {
  const { prompt, sessionId } = req.body;
  console.log(`[threat-engine] Analyzing prompt for session ${sessionId}...`);
  if (!prompt) {
    console.log(`[threat-engine] Error: Missing prompt.`);
    return res.status(400).json({ error: "Missing prompt." });
  }

  // Fallback regex analysis
  let result = analyzePrompt(prompt);

  // Call Blue Team ML Inference Service
  try {
    const mlResponse = await fetch("http://ml-inference:4006/analyze/blue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: prompt })
    });
    
    if (mlResponse.ok) {
      const mlData = await mlResponse.json();
      console.log(`[threat-engine] Blue Team ML Score: ${mlData.threat_score} (Label: ${mlData.label})`);
      
      // Override regex score with ML score
      result.score = mlData.threat_score;
      result.details = `[Blue Team ML] Semantic threat score: ${mlData.threat_score}%. ` + result.details;
      
      // Recalculate level based on ML score
      if (result.score >= 90) result.level = "CRITICAL";
      else if (result.score >= 70) result.level = "HIGH";
      else if (result.score >= 45) result.level = "MEDIUM";
      else result.level = "LOW";

      // Recalculate action
      if (result.level === "CRITICAL") result.action = "QUARANTINED";
      else if (result.level === "HIGH") result.action = "BLOCKED";
      else if (result.level === "MEDIUM") result.action = "FLAGGED";
      else result.action = "ALLOWED";
      
    } else {
      console.log(`[threat-engine] ML Service returned ${mlResponse.status}, falling back to regex.`);
    }
  } catch (error) {
    console.log(`[threat-engine] Failed to reach ML Service (${error.message}), falling back to regex.`);
  }

  console.log(`[threat-engine] Result: ${result.level} threat detected (Score: ${result.score})`);
  res.json({ ...result, sessionId: sessionId || "UNKNOWN", timestamp: new Date().toISOString() });
});

// GET /health
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "threat-engine", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`[threat-engine] Running on port ${PORT}`);
});
