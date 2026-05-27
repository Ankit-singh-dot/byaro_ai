// ============================================================
// AstroVault — SSE Event Stream Hook
// Real-time event consumption with auto-reconnection
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SystemEvent } from "@/lib/types";

interface UseEventStreamOptions {
  role?: string;
  onEvent?: (event: SystemEvent) => void;
  enabled?: boolean;
}

interface UseEventStreamReturn {
  events: SystemEvent[];
  connected: boolean;
  error: string | null;
  clearEvents: () => void;
}

export function useEventStream({
  role = "SYSTEM",
  onEvent,
  enabled = true,
}: UseEventStreamOptions = {}): UseEventStreamReturn {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let retryCount = 0;
    const MAX_RETRIES = 5;
    const BASE_DELAY = 1000;

    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource("/api/events");
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        setError(null);
        retryCount = 0;
      };

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "HEARTBEAT" || data.type === "CONNECTED") {
            return;
          }
          const event = data as SystemEvent;
          setEvents((prev) => [event, ...prev].slice(0, 200)); // keep last 200
          onEvent?.(event);
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();

        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount);
          retryTimeoutRef.current = setTimeout(() => {
            retryCount++;
            connect();
          }, delay);
        } else {
          setError("Connection lost. Max retries reached.");
        }
      };
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enabled, role, onEvent]);

  return { events, connected, error, clearEvents };
}
