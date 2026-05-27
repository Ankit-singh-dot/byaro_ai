// ============================================================
// AstroVault — Session Management
// GET /api/gateway/sessions — List sessions
// POST /api/gateway/sessions — Create new session
// ============================================================

import { NextRequest } from "next/server";
import { TeamRole } from "@/lib/types";
import { createSession, getAllSessions } from "@/lib/store";

export async function GET(request: NextRequest) {
  const role = (request.headers.get("x-team-role") || "SYSTEM") as TeamRole;

  // Red team sees only their own sessions
  // Blue team sees all sessions but without prompt contents
  // System sees everything
  const sessions = getAllSessions(role === TeamRole.SYSTEM ? undefined : role);

  return Response.json({
    sessions,
    total: sessions.length,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = (body.role || "RED").toUpperCase() as TeamRole;

    if (!["RED", "BLUE"].includes(role)) {
      return Response.json(
        { error: "Role must be RED or BLUE." },
        { status: 400 }
      );
    }

    const session = createSession(role);
    return Response.json({ session }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
