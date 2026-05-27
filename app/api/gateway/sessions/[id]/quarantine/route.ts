// ============================================================
// AstroVault — Session Quarantine Controls
// POST /api/gateway/sessions/[id]/quarantine — Quarantine a session
// DELETE /api/gateway/sessions/[id]/quarantine — Release quarantine
// ============================================================

import { getSession, quarantineSession, updateSession } from "@/lib/store";
import { SessionStatus } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return Response.json({ error: `Session ${id} not found.` }, { status: 404 });
  }

  if (session.status === SessionStatus.QUARANTINED) {
    return Response.json({ error: `Session ${id} is already quarantined.` }, { status: 409 });
  }

  if (session.status === SessionStatus.TERMINATED) {
    return Response.json({ error: `Session ${id} has been terminated.` }, { status: 410 });
  }

  const updated = quarantineSession(id);
  return Response.json({
    message: `Session ${id} has been quarantined.`,
    session: updated,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return Response.json({ error: `Session ${id} not found.` }, { status: 404 });
  }

  if (session.status !== SessionStatus.QUARANTINED) {
    return Response.json(
      { error: `Session ${id} is not quarantined (current: ${session.status}).` },
      { status: 409 }
    );
  }

  const updated = updateSession(id, { status: SessionStatus.ACTIVE });
  return Response.json({
    message: `Session ${id} quarantine released.`,
    session: updated,
  });
}
