// ============================================================
// AstroVault — Prompt Submission Pipeline
// POST /api/gateway/submit
// Core endpoint: validates → analyzes → proxies → audits
// ============================================================

import { NextRequest } from "next/server";
import { TeamRole, ActionTaken, SessionStatus } from "@/lib/types";
import { analyzePrompt } from "@/lib/analyzer";
import { generateRequestId, hashPayload } from "@/lib/crypto";
import { GATEWAY } from "@/lib/constants";
import {
  createSession,
  getSession,
  addThreatLog,
  appendAuditEntry,
  emitSystemEvent,
} from "@/lib/store";
import { EventType } from "@/lib/types";

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();
    const { prompt, sessionId, templateId } = body as {
      prompt?: string;
      sessionId?: string;
      templateId?: string;
    };

    // --- Validation ---
    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { success: false, requestId, error: "Missing or invalid 'prompt' field." },
        { status: 400 }
      );
    }

    if (prompt.length > GATEWAY.MAX_PROMPT_LENGTH) {
      return Response.json(
        {
          success: false,
          requestId,
          error: `Prompt exceeds max length of ${GATEWAY.MAX_PROMPT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    // --- Session Management ---
    let session;
    if (sessionId) {
      session = getSession(sessionId);
      if (!session) {
        return Response.json(
          { success: false, requestId, error: `Session ${sessionId} not found.` },
          { status: 404 }
        );
      }
      if (session.status === SessionStatus.QUARANTINED) {
        return Response.json(
          {
            success: false,
            requestId,
            error: `Session ${sessionId} is quarantined. No further submissions allowed.`,
          },
          { status: 403 }
        );
      }
      if (session.status === SessionStatus.TERMINATED) {
        return Response.json(
          { success: false, requestId, error: `Session ${sessionId} has been terminated.` },
          { status: 410 }
        );
      }
    } else {
      session = createSession(TeamRole.RED);
    }

    // --- Emit attack submitted event ---
    emitSystemEvent(EventType.ATTACK_SUBMITTED, TeamRole.RED, {
      requestId,
      sessionId: session.id,
      promptLength: prompt.length,
      templateId: templateId || null,
    });

    // --- Threat Analysis ---
    let threat: any;
    if (process.env.DOCKER_ENV === "true") {
      try {
        const res = await fetch("http://threat-engine:4001/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, sessionId: session.id }),
        });
        const data = await res.json();
        // Map threat engine response to internal format
        threat = {
          id: `THR-${generateRequestId()}`,
          sessionId: session.id,
          timestamp,
          prompt,
          promptHash: hashPayload(prompt),
          score: data.score,
          level: data.level,
          category: data.category,
          action: data.action as ActionTaken,
          patterns: data.patterns,
          details: data.details,
        };
      } catch (err) {
        console.error("Failed to call threat-engine:", err);
      }
    }
    
    // Fallback to standalone inline analysis if Docker call fails or not in Docker
    if (!threat) {
      const result = analyzePrompt(prompt, session.id);
      threat = result.threat;
    }
    
    // --- LLM Proxy Integration & Output Validation ---
    let llmResponse: string | null = null;
    if (threat.action === ActionTaken.ALLOWED || threat.action === ActionTaken.FLAGGED) {
      if (process.env.DOCKER_ENV === "true") {
        try {
          const res = await fetch("http://llm-proxy:4002/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, threatLevel: threat.level, sessionId: session.id }),
          });
          const proxyData = await res.json();
          llmResponse = proxyData.response;

          // Check if Proxy overrode the decision (e.g., via Canary Token)
          if (proxyData.blocked || (llmResponse && llmResponse.includes("[BLOCKED BY CANARY]"))) {
            // Calculate a dynamic confidence score instead of a static 100
            // Based on original heuristic score + prompt complexity + base penalty
            const complexityBonus = Math.min(Math.floor(prompt.length / 20), 8);
            const dynamicScore = Math.min(threat.score + 88 + complexityBonus, 99);

            threat.action = ActionTaken.QUARANTINED;
            threat.level = "CRITICAL";
            threat.score = dynamicScore;
            threat.category = "DATA_EXFILTRATION";
            threat.details = `Threat Engine bypassed (baseline ${threat.score}), but zero-day caught by LLM Proxy Canary Token! Confidence: ${dynamicScore}%`;
            if (!threat.patterns.includes("CANARY_TOKEN")) threat.patterns.push("CANARY_TOKEN");
          }

          // Capture Red Team ML Classifier results if present
          if (proxyData.ml_jailbroken !== undefined) {
            threat.ml_jailbroken = proxyData.ml_jailbroken;
            threat.ml_confidence = proxyData.ml_confidence;
          }
        } catch (err) {
          console.error("Failed to call llm-proxy:", err);
          llmResponse = "[PROXY ERROR] Could not connect to internal LLM proxy.";
        }
      } else {
        // Fallback to standalone mode simulated response
        llmResponse = generateSimulatedResponse(prompt, threat.action === ActionTaken.FLAGGED);
      }
    }

    // Now log the final threat status (including any proxy overrides)
    addThreatLog(threat);

    // --- Audit Logging ---
    const auditData = {
      timestamp,
      sessionId: session.id,
      role: TeamRole.RED,
      action: "PROMPT_SUBMITTED",
      promptHash: hashPayload(prompt),
      riskScore: threat.score,
      actionTaken: threat.action,
      metadata: {
        requestId,
        templateId: templateId || "",
        category: threat.category,
        level: threat.level,
        patternsMatched: threat.patterns.join(","),
      },
    };

    if (process.env.DOCKER_ENV === "true") {
      // 1. Audit Service
      try {
        await fetch("http://audit-service:4003/append", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(auditData),
        });
      } catch (err) {
        console.error("Failed to call audit-service:", err);
      }

      // 2. Red Team Service
      try {
        await fetch("http://red-team-service:4004/attack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, sessionId: session.id, templateId }),
        });
      } catch (err) {}

      // 3. Blue Team Service
      try {
        await fetch("http://blue-team-service:4005/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threat }),
        });
      } catch (err) {}
    }
    
    // Always append to internal store for the UI to read
    appendAuditEntry(auditData);

    // --- Build Response ---
    return Response.json({
      success: true,
      requestId,
      sessionId: session.id,
      timestamp,
      threat: {
        id: threat.id,
        score: threat.score,
        level: threat.level,
        category: threat.category,
        action: threat.action,
        patterns: threat.patterns,
        details: threat.details,
        ml_jailbroken: threat.ml_jailbroken,
        ml_confidence: threat.ml_confidence,
      },
      llmResponse,
      action: threat.action,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        requestId,
        error: error instanceof Error ? error.message : "Internal gateway error.",
      },
      { status: 500 }
    );
  }
}

/**
 * Simulated LLM response for standalone development mode.
 * In Docker deployment, this is replaced by the LLM proxy service.
 */
function generateSimulatedResponse(prompt: string, flagged: boolean): string {
  if (flagged) {
    return "[FLAGGED] This prompt was flagged for review but allowed through. Response: I can help with general questions. However, I noticed some patterns in your request that have been flagged for review by our safety systems.";
  }

  // Generate a contextual response based on prompt content
  const lower = prompt.toLowerCase();
  if (lower.includes("capital") || lower.includes("country")) {
    return "I'd be happy to help with geography questions. The capital of France is Paris, which is also the country's largest city with a population of over 2 million in the city proper.";
  }
  if (lower.includes("explain") || lower.includes("how does")) {
    return "That's a great question. Let me provide a clear explanation based on current scientific understanding. Could you be more specific about which aspect you'd like me to focus on?";
  }
  return "I've processed your request through the secure pipeline. This is a simulated response from the AstroVault LLM proxy operating in standalone mode.";
}
