// ============================================================
// AstroVault — Single Session Detail
// GET /api/gateway/sessions/[id]
// DELETE /api/gateway/sessions/[id]
// ============================================================

import { getSession, terminateSession, getThreatLogs } from "@/lib/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return Response.json({ error: `Session ${id} not found.` }, { status: 404 });
  }

  const threats = getThreatLogs({ sessionId: id });

  return Response.json({
    session,
    threats,
    timestamp: new Date().toISOString(),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = terminateSession(id);

  if (!session) {
    return Response.json({ error: `Session ${id} not found.` }, { status: 404 });
  }

  return Response.json({
    message: `Session ${id} terminated.`,
    session,
  });
}
