// ============================================================
// AstroVault — Threat Logs Query
// GET /api/threat/logs
// Blue-team endpoint for querying threat history
// ============================================================

import { NextRequest } from "next/server";
import { getThreatLogs } from "@/lib/store";
import { ThreatLevel, ThreatCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const level = searchParams.get("level") as ThreatLevel | null;
  const category = searchParams.get("category") as ThreatCategory | null;
  const sessionId = searchParams.get("sessionId");
  const limit = searchParams.get("limit");

  const logs = getThreatLogs({
    level: level || undefined,
    category: category || undefined,
    sessionId: sessionId || undefined,
    limit: limit ? parseInt(limit, 10) : 100,
  });

  // Strip raw prompt text for blue-team view (only hashes visible)
  const sanitized = logs.map((log) => ({
    ...log,
    prompt: undefined, // redacted
    promptPreview: log.prompt.substring(0, 50) + (log.prompt.length > 50 ? "..." : ""),
  }));

  return Response.json({
    logs: sanitized,
    total: sanitized.length,
    timestamp: new Date().toISOString(),
  });
}
