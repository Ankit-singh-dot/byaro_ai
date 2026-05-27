// ============================================================
// AstroVault — Main Dashboard
// Overview: metrics, recent threats, live feed
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import LiveFeed from "@/components/LiveFeed";

interface Metrics {
  totalAttacks: number;
  blockedPrompts: number;
  activeSessions: number;
  quarantinedSessions: number;
  auditChainValid: boolean;
  threatsByLevel: Record<string, number>;
  threatsByCategory: Record<string, number>;
}

interface ThreatLog {
  id: string;
  sessionId: string;
  timestamp: string;
  score: number;
  level: string;
  category: string;
  action: string;
  promptPreview?: string;
  details: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentThreats, setRecentThreats] = useState<ThreatLog[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, threatsRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/threat/logs?limit=10", {
          headers: { "x-team-role": "SYSTEM" },
        }),
      ]);
      const metricsData = await metricsRes.json();
      const threatsData = await threatsRes.json();
      setMetrics(metricsData);
      setRecentThreats(threatsData.logs || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>AstroVault AI Safety Validation — Operational Overview</p>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Attacks"
          value={metrics?.totalAttacks ?? 0}
          icon="⚔"
        />
        <MetricCard
          title="Blocked Prompts"
          value={metrics?.blockedPrompts ?? 0}
          icon="⊘"
          color="var(--accent-red)"
        />
        <MetricCard
          title="Active Sessions"
          value={metrics?.activeSessions ?? 0}
          icon="◎"
          color="var(--accent-green)"
        />
        <MetricCard
          title="Quarantined"
          value={metrics?.quarantinedSessions ?? 0}
          icon="⚠"
          color="var(--accent-amber)"
        />
        <MetricCard
          title="Audit Integrity"
          value={metrics?.auditChainValid ? "Valid" : "Broken"}
          icon="⛓"
          color={metrics?.auditChainValid ? "var(--accent-green)" : "var(--accent-red)"}
          isText
        />
      </div>

      {/* Threat Level Breakdown */}
      {metrics && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Threat Level Distribution</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {Object.entries(metrics.threatsByLevel).map(([level, count]) => (
              <div key={level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge ${level.toLowerCase()}`}>{level}</span>
                <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid-main-aside">
        {/* Recent Threats Table */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Recent Threat Activity</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Last {recentThreats.length} entries
            </span>
          </div>
          <div className="panel-body">
            {recentThreats.length === 0 ? (
              <div className="empty-state">
                <div className="icon">◇</div>
                <div>No threats detected yet. Use the Red Team console to submit attacks.</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Session</th>
                    <th>Score</th>
                    <th>Level</th>
                    <th>Category</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentThreats.map((t) => (
                    <tr key={t.id}>
                      <td className="mono">
                        {new Date(t.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                      </td>
                      <td className="mono" style={{ color: "var(--accent-cyan)" }}>
                        {t.sessionId}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                          {t.score}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${t.level.toLowerCase()}`}>{t.level}</span>
                      </td>
                      <td style={{ fontSize: 11 }}>{t.category.replace(/_/g, " ")}</td>
                      <td>
                        <span className={`badge ${t.action.toLowerCase()}`}>{t.action}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live Feed */}
        <LiveFeed />
      </div>
    </>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
  isText,
}: {
  title: string;
  value: number | string;
  icon: string;
  color?: string;
  isText?: boolean;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        <span style={{ fontSize: 16, opacity: 0.5 }}>{icon}</span>
      </div>
      <div className={`card-value ${isText ? "small" : ""}`} style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}
