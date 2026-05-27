// ============================================================
// AstroVault — System Metrics
// GET /api/metrics
// ============================================================

import { getSystemMetrics } from "@/lib/store";

export async function GET() {
  const metrics = getSystemMetrics();
  return Response.json({
    ...metrics,
    timestamp: new Date().toISOString(),
  });
}
