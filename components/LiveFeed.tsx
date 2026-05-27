// ============================================================
// AstroVault — Live Activity Feed
// Terminal-style real-time event stream
// ============================================================

"use client";

import { useEventStream } from "@/hooks/useEventStream";

export default function LiveFeed() {
  const { events, connected } = useEventStream();

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, { text: string; cls: string }> = {
      ATTACK_SUBMITTED: { text: "ATTACK", cls: "high" },
      PROMPT_BLOCKED: { text: "BLOCKED", cls: "critical" },
      THREAT_DETECTED: { text: "THREAT", cls: "medium" },
      SESSION_CREATED: { text: "SESSION", cls: "low" },
      SESSION_QUARANTINED: { text: "QUARANTINE", cls: "critical" },
      SESSION_TERMINATED: { text: "TERMINATED", cls: "medium" },
      AUDIT_ENTRY: { text: "AUDIT", cls: "low" },
      SYSTEM_ALERT: { text: "ALERT", cls: "critical" },
    };
    return labels[type] || { text: type, cls: "low" };
  };

  const getEventMessage = (event: Record<string, unknown>) => {
    const type = event.type as string;
    const data = event.data as Record<string, unknown>;
    switch (type) {
      case "ATTACK_SUBMITTED":
        return `Red-team prompt submitted to session ${data.sessionId}`;
      case "PROMPT_BLOCKED":
        return `Prompt blocked in session ${data.sessionId} [${data.level}/${data.category}]`;
      case "THREAT_DETECTED":
        return `Threat detected: score ${data.score}, level ${data.level}, category ${data.category}`;
      case "SESSION_CREATED":
        return `New ${data.role} session created: ${data.sessionId}`;
      case "SESSION_QUARANTINED":
        return `Session ${data.sessionId} quarantined — high risk detected`;
      case "SESSION_TERMINATED":
        return `Session ${data.sessionId} terminated`;
      case "AUDIT_ENTRY":
        return `Audit entry #${data.index}: ${data.action}`;
      default:
        return JSON.stringify(data);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Live Activity Feed</span>
        <div className="live-badge">
          <span className="dot" />
          {connected ? "Connected" : "Reconnecting..."}
        </div>
      </div>
      <div className="panel-body">
        {events.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 16px" }}>
            <div className="icon">◇</div>
            <div>No events yet. Submit an attack to see live activity.</div>
          </div>
        ) : (
          events.slice(0, 50).map((event, i) => {
            const label = getEventLabel(event.type);
            return (
              <div key={`${event.id}-${i}`} className="log-entry">
                <span className="log-timestamp">{formatTime(event.timestamp)}</span>
                <span className={`log-level ${label.cls}`}>{label.text}</span>
                <span className="log-message">{getEventMessage(event as unknown as Record<string, unknown>)}</span>
                {event.data.sessionId ? (
                  <span className="log-session">{String(event.data.sessionId)}</span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
