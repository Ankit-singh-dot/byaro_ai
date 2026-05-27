// ============================================================
// AstroVault — Audit Log Endpoints
// GET /api/audit — Retrieve audit chain
// POST /api/audit — Manual audit entry (for testing)
// ============================================================

import { NextRequest } from "next/server";
import { getAuditChain, appendAuditEntry } from "@/lib/store";
import { TeamRole, ActionTaken } from "@/lib/types";
import { hashPayload } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit") || "200";

  try {
    const auditServiceUrl = process.env.AUDIT_SERVICE_URL || "http://audit-service:4003";
    const res = await fetch(`${auditServiceUrl}/chain?limit=${limit}`, {
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error(`Audit service returned ${res.status}`);
    }

    const data = await res.json();

    return Response.json({
      entries: data.entries || [],
      total: data.total || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/audit] Error fetching from audit-service:", error);
    return Response.json({ 
      entries: [], 
      total: 0, 
      timestamp: new Date().toISOString() 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, action, prompt, riskScore, actionTaken } = body as {
      sessionId: string;
      action: string;
      prompt?: string;
      riskScore?: number;
      actionTaken?: ActionTaken;
    };

    if (!sessionId || !action) {
      return Response.json(
        { error: "Missing required fields: sessionId, action." },
        { status: 400 }
      );
    }

    const entry = appendAuditEntry({
      timestamp: new Date().toISOString(),
      sessionId,
      role: TeamRole.SYSTEM,
      action,
      promptHash: prompt ? hashPayload(prompt) : "",
      riskScore: riskScore || 0,
      actionTaken: actionTaken || ActionTaken.ALLOWED,
      metadata: {},
    });

    return Response.json({ entry }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Failed to create audit entry." },
      { status: 500 }
    );
  }
}
