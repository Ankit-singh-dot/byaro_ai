// ============================================================
// AstroVault — Session Management
// All sessions with status, controls, and detail view
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionData {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  promptCount: number;
  blockedCount: number;
  highestThreatLevel: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/gateway/sessions", {
        headers: { "x-team-role": "SYSTEM" },
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const quarantine = async (id: string) => {
    await fetch(`/api/gateway/sessions/${id}/quarantine`, {
      method: "POST",
      headers: { "x-team-role": "SYSTEM" },
    });
    fetchSessions();
  };

  const terminate = async (id: string) => {
    await fetch(`/api/gateway/sessions/${id}`, {
      method: "DELETE",
      headers: { "x-team-role": "SYSTEM" },
    });
    fetchSessions();
  };

  const releaseQuarantine = async (id: string) => {
    await fetch(`/api/gateway/sessions/${id}/quarantine`, {
      method: "DELETE",
      headers: { "x-team-role": "SYSTEM" },
    });
    fetchSessions();
  };

  const active = sessions.filter((s) => s.status === "ACTIVE");
  const quarantined = sessions.filter((s) => s.status === "QUARANTINED");
  const other = sessions.filter((s) => s.status !== "ACTIVE" && s.status !== "QUARANTINED");

  return (
    <>
      <div className="page-header">
        <h2>Session Management</h2>
        <p>Monitor and control all testing sessions across red and blue teams</p>
      </div>

      {/* Summary */}
      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Active</span>
            <div className="status-dot green pulse" />
          </div>
          <div className="card-value" style={{ color: "var(--accent-green)" }}>{active.length}</div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Quarantined</span>
            <div className="status-dot red pulse" />
          </div>
          <div className="card-value" style={{ color: "var(--accent-red)" }}>{quarantined.length}</div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Total</span>
          </div>
          <div className="card-value">{sessions.length}</div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Sessions</span>
        </div>
        <div className="panel-body" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">◎</div>
              <div>No sessions created yet. Use the Red Team console to start an attack session.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Prompts</th>
                  <th>Blocked</th>
                  <th>Max Threat</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="mono" style={{ color: "var(--accent-cyan)" }}>{s.id}</td>
                    <td>
                      <span className={`badge ${s.role === "RED" ? "high" : "info"}`}>
                        {s.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.status.toLowerCase()}`}>{s.status}</span>
                    </td>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {new Date(s.createdAt).toLocaleString("en-US", {
                        hour12: false,
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{s.promptCount}</td>
                    <td
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        color: s.blockedCount > 0 ? "var(--accent-red)" : undefined,
                      }}
                    >
                      {s.blockedCount}
                    </td>
                    <td>
                      <span className={`badge ${s.highestThreatLevel.toLowerCase()}`}>
                        {s.highestThreatLevel}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {s.status === "ACTIVE" && (
                          <>
                            <button
                              className="btn btn-danger"
                              onClick={() => quarantine(s.id)}
                              style={{ padding: "2px 8px", fontSize: 10 }}
                            >
                              Quarantine
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => terminate(s.id)}
                              style={{ padding: "2px 8px", fontSize: 10 }}
                            >
                              Terminate
                            </button>
                          </>
                        )}
                        {s.status === "QUARANTINED" && (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => releaseQuarantine(s.id)}
                              style={{ padding: "2px 8px", fontSize: 10 }}
                            >
                              Release
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => terminate(s.id)}
                              style={{ padding: "2px 8px", fontSize: 10 }}
                            >
                              Terminate
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quarantined Sessions Alert */}
      {quarantined.length > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: "var(--accent-red-dim)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-red)" }}>
              {quarantined.length} session(s) quarantined
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
              These sessions have been isolated due to high-severity threat detection.
              All communications are blocked until reviewed.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
