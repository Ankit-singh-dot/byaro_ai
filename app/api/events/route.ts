// ============================================================
// AstroVault — Server-Sent Events
// GET /api/events
// Real-time event stream for dashboard monitoring
// ============================================================

import { addEventListener } from "@/lib/store";
import { TeamRole, SystemEvent } from "@/lib/types";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const role = (request.headers.get("x-team-role") || "SYSTEM").toUpperCase();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", role, timestamp: new Date().toISOString() })}\n\n`)
      );

      // Set up heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "HEARTBEAT", timestamp: new Date().toISOString() })}\n\n`)
          );
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Subscribe to events
      const removeListener = addEventListener((event: SystemEvent) => {
        // Role-based event filtering
        // Red team doesn't see blue team events, and vice versa
        if (role === "RED" && event.role === TeamRole.BLUE) return;
        if (role === "BLUE" && event.role === TeamRole.RED) {
          // Blue team sees attack events but with redacted data
          const redacted = {
            ...event,
            data: {
              ...event.data,
              prompt: undefined,
              payload: undefined,
            },
          };
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(redacted)}\n\n`)
            );
          } catch {
            // stream closed
          }
          return;
        }

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // stream closed
        }
      });

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeListener();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
