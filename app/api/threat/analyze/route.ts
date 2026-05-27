// ============================================================
// AstroVault — Threat Analysis Endpoint
// POST /api/threat/analyze
// Accepts a prompt and returns threat analysis results
// ============================================================

import { NextRequest } from "next/server";
import { analyzePrompt } from "@/lib/analyzer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, sessionId } = body as {
      prompt?: string;
      sessionId?: string;
    };

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Missing or invalid 'prompt' field." },
        { status: 400 }
      );
    }

    const result = analyzePrompt(prompt, sessionId || "STANDALONE");

    return Response.json({
      threat: {
        id: result.threat.id,
        score: result.threat.score,
        level: result.threat.level,
        category: result.threat.category,
        action: result.threat.action,
        details: result.threat.details,
      },
      matchedPatterns: result.matchedPatterns,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { error: "Failed to analyze prompt." },
      { status: 500 }
    );
  }
}
