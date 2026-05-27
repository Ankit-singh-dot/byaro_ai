// ============================================================
// AstroVault — Blue Team Monitoring
// Live attack feed, threat classification, quarantine controls
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import LiveFeed from "@/components/LiveFeed";

interface ThreatLog {
  id: string;
  sessionId: string;
  timestamp: string;
  score: number;
  level: string;
  category: string;
  action: string;
  promptPreview: string;
  promptHash: string;
  details: string;
}

interface SessionData {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  promptCount: number;
  blockedCount: number;
  highestThreatLevel: string;
}

export default function BlueTeamPage() {
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      let url = "/api/threat/logs?limit=50";
      if (filterLevel) url += `&level=${filterLevel}`;
      if (filterCategory) url += `&category=${filterCategory}`;

      const [threatsRes, sessionsRes] = await Promise.all([
        fetch(url, { headers: { "x-team-role": "BLUE" } }),
        fetch("/api/gateway/sessions", { headers: { "x-team-role": "BLUE" } }),
      ]);

      const threatsData = await threatsRes.json();
      const sessionsData = await sessionsRes.json();
      setThreats(threatsData.logs || []);
      setSessions(sessionsData.sessions || []);
    } catch {
      // silent
    }
  }, [filterLevel, filterCategory]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const quarantineSession = async (id: string) => {
    try {
      await fetch(`/api/gateway/sessions/${id}/quarantine`, {
        method: "POST",
        headers: { "x-team-role": "BLUE" },
      });
      fetchData();
    } catch {
      // silent
    }
  };

  const categories = [
    "PROMPT_INJECTION",
    "JAILBREAK",
    "ROLE_OVERRIDE",
    "DATA_EXFILTRATION",
    "UNSAFE_GENERATION",
    "CONTEXT_EXTRACTION",
    "ENCODING_ATTACK",
    "INSTRUCTION_MANIPULATION",
  ];

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const t of threats) {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  }

  return (
    <>
      <div className="page-header">
        <h2>Blue Team Monitoring</h2>
        <p>Monitor threats, classify attacks, and enforce quarantine controls</p>
      </div>

      {/* Category Breakdown */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Threat Categories</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <div
              key={cat}
              style={{
                padding: "6px 12px",
                background: filterCategory === cat ? "var(--accent-blue-dim)" : "var(--bg-tertiary)",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${filterCategory === cat ? "var(--accent-blue)" : "var(--border-primary)"}`,
                cursor: "pointer",
                fontSize: 11,
              }}
              onClick={() => setFilterCategory(filterCategory === cat ? "" : cat)}
            >
              <span style={{ color: "var(--text-secondary)" }}>{cat.replace(/_/g, " ")}</span>
              <span style={{ marginLeft: 6, fontWeight: 700, color: "var(--text-primary)" }}>
                {categoryCounts[cat] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-main-aside">
        {/* Threats Table */}
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select
              className="select"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Blocked Prompts Panel */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-header">
              <span className="panel-title">Detected Threats</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {threats.length} entries (prompts redacted)
              </span>
            </div>
            <div className="panel-body">
              {threats.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">🛡</div>
                  <div>No threats to display. Waiting for red-team activity.</div>
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
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threats.map((t) => (
                      <tr key={t.id}>
                        <td className="mono">
                          {new Date(t.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                        </td>
                        <td className="mono" style={{ color: "var(--accent-cyan)" }}>
                          {t.sessionId}
                        </td>
                        <td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                          {t.score}
                        </td>
                        <td>
                          <span className={`badge ${t.level.toLowerCase()}`}>{t.level}</span>
                        </td>
                        <td style={{ fontSize: 11 }}>{t.category.replace(/_/g, " ")}</td>
                        <td>
                          <span className={`badge ${t.action.toLowerCase()}`}>{t.action}</span>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.promptPreview}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sessions with Quarantine Controls */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Active Sessions — Quarantine Controls</span>
            </div>
            <div className="panel-body">
              {sessions.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">◎</div>
                  <div>No active sessions.</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Status</th>
                      <th>Prompts</th>
                      <th>Blocked</th>
                      <th>Max Threat</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td className="mono" style={{ color: "var(--accent-cyan)" }}>
                          {s.id}
                        </td>
                        <td>
                          <span className={`badge ${s.status.toLowerCase()}`}>{s.status}</span>
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{s.promptCount}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums", color: s.blockedCount > 0 ? "var(--accent-red)" : undefined }}>
                          {s.blockedCount}
                        </td>
                        <td>
                          <span className={`badge ${s.highestThreatLevel.toLowerCase()}`}>
                            {s.highestThreatLevel}
                          </span>
                        </td>
                        <td>
                          {s.status === "ACTIVE" && s.highestThreatLevel !== "LOW" && (
                            <button
                              className="btn btn-danger"
                              onClick={() => quarantineSession(s.id)}
                              style={{ padding: "3px 10px", fontSize: 11 }}
                            >
                              Quarantine
                            </button>
                          )}
                          {s.status === "QUARANTINED" && (
                            <span style={{ fontSize: 11, color: "var(--accent-red)" }}>⚠ Isolated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Live Feed sidebar */}
        <LiveFeed />
      </div>
    </>
  );
}
