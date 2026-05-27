// ============================================================
// AstroVault — System Health
// Service status, infrastructure overview, network isolation
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  port: number;
}

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  services: ServiceStatus[];
  metrics: {
    totalAttacks: number;
    blockedPrompts: number;
    activeSessions: number;
    quarantinedSessions: number;
    auditChainValid: boolean;
  };
  audit: {
    chainValid: boolean;
    totalEntries: number;
    message: string;
  };
}

export default function SystemPage() {
  const [health, setHealth] = useState<HealthData | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <>
      <div className="page-header">
        <h2>System Health</h2>
        <p>Infrastructure monitoring, service status, and network isolation verification</p>
      </div>

      {/* System Overview */}
      <div className="metrics-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">System Status</span>
          </div>
          <div
            className="card-value small"
            style={{
              color: health?.status === "operational" ? "var(--accent-green)" : "var(--accent-red)",
            }}
          >
            {health?.status === "operational" ? "● Operational" : "● Degraded"}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Uptime</span>
          </div>
          <div className="card-value small">
            {health ? formatUptime(health.uptime) : "—"}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Audit Chain</span>
          </div>
          <div
            className="card-value small"
            style={{
              color: health?.audit?.chainValid ? "var(--accent-green)" : "var(--accent-red)",
            }}
          >
            {health?.audit?.chainValid ? "✓ Verified" : "✗ Broken"}
          </div>
          <div className="card-subtitle">{health?.audit?.totalEntries || 0} entries</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Service Status */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Service Health</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {health?.services?.length || 0} services
            </span>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Port</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(health?.services || []).map((svc) => (
                  <tr key={svc.name}>
                    <td style={{ fontWeight: 500 }}>{svc.name}</td>
                    <td className="mono">{svc.port}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          className={`status-dot ${
                            svc.status === "healthy" ? "green" : svc.status === "degraded" ? "amber" : "red"
                          }`}
                        />
                        <span style={{ fontSize: 12 }}>{svc.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Network Isolation */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Network Isolation</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
              Docker network topology enforcing tenant isolation:
            </div>

            {/* Network diagram (text-based) */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                lineHeight: 1.8,
                color: "var(--text-tertiary)",
                padding: 12,
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <div style={{ color: "var(--accent-blue)" }}>┌─ frontend-net ────────────┐</div>
              <div>│  nextjs-app  ←→  gateway  │</div>
              <div style={{ color: "var(--accent-blue)" }}>└───────────┬───────────────┘</div>
              <div>            │</div>
              <div style={{ color: "var(--accent-purple)" }}>┌───────────┴───────────────┐</div>
              <div style={{ color: "var(--accent-purple)" }}>│     internal-net          │</div>
              <div>│  threat-engine            │</div>
              <div>│  llm-proxy                │</div>
              <div>│  audit-service            │</div>
              <div style={{ color: "var(--accent-purple)" }}>└───┬───────────────────┬───┘</div>
              <div>    │                   │</div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div style={{ color: "var(--accent-orange)" }}>┌───┴──────────┐</div>
                  <div style={{ color: "var(--accent-orange)" }}>│ redteam-net  │</div>
                  <div>│ red-team-svc │</div>
                  <div style={{ color: "var(--accent-orange)" }}>└──────────────┘</div>
                </div>
                <div>
                  <div style={{ color: "var(--accent-cyan)" }}>┌───┴──────────┐</div>
                  <div style={{ color: "var(--accent-cyan)" }}>│ blueteam-net │</div>
                  <div>│ blue-team-svc│</div>
                  <div style={{ color: "var(--accent-cyan)" }}>└──────────────┘</div>
                </div>
              </div>
              <div style={{ marginTop: 8, color: "var(--accent-red)" }}>
                ✗ red-team ←✗→ blue-team (NO direct access)
              </div>
              <div style={{ color: "var(--accent-red)" }}>
                ✗ red-team ←✗→ llm-proxy (NO direct access)
              </div>
              <div style={{ color: "var(--accent-red)" }}>
                ✗ blue-team ←✗→ llm-proxy (NO direct access)
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
              All cross-boundary communication must transit through the gateway.
              Docker network policies enforce isolation at the infrastructure level.
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Info */}
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <span className="panel-title">Isolation Architecture</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                Container Isolation
              </div>
              <ul style={{ fontSize: 11, color: "var(--text-tertiary)", paddingLeft: 16, lineHeight: 1.8, listStyleType: "disc" }}>
                <li>Separate Docker networks per team</li>
                <li>Non-root container execution</li>
                <li>Read-only root filesystems</li>
                <li>CPU/memory resource limits</li>
                <li>Seccomp security profiles</li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                Access Control
              </div>
              <ul style={{ fontSize: 11, color: "var(--text-tertiary)", paddingLeft: 16, lineHeight: 1.8, listStyleType: "disc" }}>
                <li>Role-based middleware enforcement</li>
                <li>Route-level access matrix</li>
                <li>Per-role rate limiting</li>
                <li>Request ID tracing</li>
                <li>API key isolation per service</li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                Data Isolation
              </div>
              <ul style={{ fontSize: 11, color: "var(--text-tertiary)", paddingLeft: 16, lineHeight: 1.8, listStyleType: "disc" }}>
                <li>Session-scoped memory contexts</li>
                <li>Prompt hash redaction for blue team</li>
                <li>Role-filtered SSE event streams</li>
                <li>Hash-chained tamper-evident audit</li>
                <li>Cryptographic session IDs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
