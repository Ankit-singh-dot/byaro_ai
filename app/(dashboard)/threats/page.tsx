// ============================================================
// AstroVault — Threat Logs Viewer
// Full threat history with filtering and detail expansion
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";

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

export default function ThreatsPage() {
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let url = "/api/threat/logs?limit=200";
      if (filterLevel) url += `&level=${filterLevel}`;
      if (filterCategory) url += `&category=${filterCategory}`;

      const res = await fetch(url, { headers: { "x-team-role": "SYSTEM" } });
      const data = await res.json();
      setThreats(data.logs || []);
    } catch {
      // silent
    }
  }, [filterLevel, filterCategory]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <>
      <div className="page-header">
        <h2>Threat Logs</h2>
        <p>Complete threat detection history with analysis details</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select className="select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
          <option value="">All Levels</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select className="select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="PROMPT_INJECTION">Prompt Injection</option>
          <option value="JAILBREAK">Jailbreak</option>
          <option value="ROLE_OVERRIDE">Role Override</option>
          <option value="DATA_EXFILTRATION">Data Exfiltration</option>
          <option value="UNSAFE_GENERATION">Unsafe Generation</option>
          <option value="CONTEXT_EXTRACTION">Context Extraction</option>
          <option value="ENCODING_ATTACK">Encoding Attack</option>
          <option value="INSTRUCTION_MANIPULATION">Instruction Manipulation</option>
        </select>
        <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>
          {threats.length} results
        </span>
      </div>

      {/* Table */}
      <div className="panel">
        <div className="panel-body" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {threats.length === 0 ? (
            <div className="empty-state">
              <div className="icon">⚠</div>
              <div>No threat entries found. Submit attacks via the Red Team console.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }} />
                  <th>Threat ID</th>
                  <th>Time</th>
                  <th>Session</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {threats.map((t) => (
                  <>
                    <tr
                      key={t.id}
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ color: "var(--text-muted)", fontSize: 10 }}>
                        {expandedId === t.id ? "▼" : "▶"}
                      </td>
                      <td className="mono" style={{ fontSize: 11 }}>{t.id}</td>
                      <td className="mono">
                        {new Date(t.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                      </td>
                      <td className="mono" style={{ color: "var(--accent-cyan)" }}>{t.sessionId}</td>
                      <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{t.score}</td>
                      <td><span className={`badge ${t.level.toLowerCase()}`}>{t.level}</span></td>
                      <td style={{ fontSize: 11 }}>{t.category.replace(/_/g, " ")}</td>
                      <td><span className={`badge ${t.action.toLowerCase()}`}>{t.action}</span></td>
                    </tr>
                    {expandedId === t.id && (
                      <tr key={`${t.id}-detail`}>
                        <td colSpan={8} style={{ background: "var(--bg-tertiary)", padding: 16 }}>
                          <div style={{ display: "grid", gap: 10 }}>
                            <div>
                              <span style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>
                                PROMPT PREVIEW
                              </span>
                              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                                {t.promptPreview}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>
                                PROMPT HASH
                              </span>
                              <span className="hash-display">{t.promptHash}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>
                                ANALYSIS DETAILS
                              </span>
                              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                {t.details}
                              </span>
                            </div>
                            <div className="score-meter">
                              <div
                                className={`score-meter-fill ${t.level.toLowerCase()}`}
                                style={{ width: `${t.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
