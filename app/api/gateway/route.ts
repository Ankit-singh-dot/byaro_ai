// ============================================================
// AstroVault — Gateway Health Check
// GET /api/gateway
// ============================================================

import { getSystemMetrics } from "@/lib/store";

export async function GET() {
  const metrics = getSystemMetrics();
  return Response.json({
    service: "astrovault-gateway",
    status: "operational",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    metrics: {
      activeSessions: metrics.activeSessions,
      totalAttacks: metrics.totalAttacks,
      auditChainValid: metrics.auditChainValid,
    },
  });
}
