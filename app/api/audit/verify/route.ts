// ============================================================
// AstroVault — Audit Chain Verification
// GET /api/audit/verify
// Verifies the entire audit chain for tamper detection
// ============================================================

export async function GET() {
  try {
    const auditServiceUrl = process.env.AUDIT_SERVICE_URL || "http://audit-service:4003";
    const res = await fetch(`${auditServiceUrl}/verify`, {
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error(`Audit service returned ${res.status}`);
    }

    const result = await res.json();

    return Response.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/audit/verify] Error fetching from audit-service:", error);
    return Response.json(
      { error: "Failed to verify chain with audit service" },
      { status: 500 }
    );
  }
}
