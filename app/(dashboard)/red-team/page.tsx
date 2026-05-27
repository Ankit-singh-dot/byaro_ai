// ============================================================
// AstroVault — Red Team Console
// Attack prompt submission with templates, session history
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  expectedLevel: string;
  source: string;
}

interface SubmissionResult {
  success: boolean;
  requestId: string;
  sessionId: string;
  timestamp: string;
  threat: {
    id: string;
    score: number;
    level: string;
    category: string;
    action: string;
    patterns: string[];
    details: string;
    ml_jailbroken?: boolean;
    ml_confidence?: number;
  } | null;
  llmResponse: string | null;
  action: string;
  error?: string;
}

export default function RedTeamPage() {
  const [prompt, setPrompt] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [sourceFilter, setSourceFilter] = useState<"all" | "builtin" | "gandalf">("all");
  const [sourceCounts, setSourceCounts] = useState({ builtin: 0, gandalf: 0 });

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates || []);
        if (data.sources) {
          setSourceCounts(data.sources);
        }
      })
      .catch(() => {});
  }, []);

  const filteredTemplates = templates.filter((tpl) => {
    if (sourceFilter === "builtin") return tpl.source !== "Lakera/Gandalf";
    if (sourceFilter === "gandalf") return tpl.source === "Lakera/Gandalf";
    return true;
  });

  const selectTemplate = useCallback((tpl: Template) => {
    setPrompt(tpl.prompt);
    setSelectedTemplate(tpl.id);
  }, []);

  const submitAttack = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/gateway/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-team-role": "RED",
        },
        body: JSON.stringify({
          prompt,
          sessionId: sessionId || undefined,
          templateId: selectedTemplate || undefined,
        }),
      });

      const data: SubmissionResult = await res.json();
      setResults((prev) => [data, ...prev]);

      // Auto-assign session for subsequent prompts
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
    } catch {
      setResults((prev) => [
        {
          success: false,
          requestId: "ERROR",
          sessionId: "",
          timestamp: new Date().toISOString(),
          threat: null,
          llmResponse: null,
          action: "ERROR",
          error: "Failed to connect to gateway.",
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const newSession = () => {
    setSessionId("");
    setPrompt("");
    setSelectedTemplate(null);
  };

  return (
    <>
      <div className="page-header">
        <h2>Red Team Console</h2>
        <p>Submit adversarial prompts to test AI model safety boundaries</p>
      </div>

      <div className="grid-main-aside">
        {/* Main Panel — Prompt Submission */}
        <div>
          {/* Session Info */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Session:</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--accent-cyan)" }}>
              {sessionId || "New session (auto-created on submit)"}
            </span>
            {sessionId && (
              <button className="btn btn-ghost" onClick={newSession} style={{ padding: "3px 8px", fontSize: 11 }}>
                New Session
              </button>
            )}
          </div>

          {/* Prompt Input */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">Attack Prompt</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {prompt.length} / 4096 chars
              </span>
            </div>
            <textarea
              className="input"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setSelectedTemplate(null);
              }}
              placeholder="Enter adversarial prompt to test model safety..."
              style={{ minHeight: 140 }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                className="btn btn-primary"
                onClick={submitAttack}
                disabled={loading || !prompt.trim()}
              >
                {loading ? "Analyzing..." : "⚔ Submit Attack"}
              </button>
              <button className="btn btn-secondary" onClick={() => setPrompt("")}>
                Clear
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Submission Results</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {results.length} submission(s)
              </span>
            </div>
            <div className="panel-body">
              {results.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">⚔</div>
                  <div>No attacks submitted yet. Select a template or type a custom prompt.</div>
                </div>
              ) : (
                results.map((r, i) => (
                  <div key={`${r.requestId}-${i}`} style={{ padding: 14, borderBottom: "1px solid var(--border-primary)" }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {r.requestId}
                        </span>
                        <span className={`badge ${r.action?.toLowerCase() || "info"}`}>
                          {r.action}
                        </span>
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {r.timestamp ? new Date(r.timestamp).toLocaleTimeString("en-US", { hour12: false }) : "now"}
                      </span>
                    </div>

                    {r.error ? (
                      <div style={{ color: "var(--accent-red)", fontSize: 12 }}>{r.error}</div>
                    ) : r.threat ? (
                      <>
                        {/* Threat Details */}
                        <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>SCORE</div>
                            <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                              {r.threat.score}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>LEVEL</div>
                            <span className={`badge ${r.threat.level.toLowerCase()}`}>
                              {r.threat.level}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>CATEGORY</div>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                              {r.threat.category.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>SESSION</div>
                            <span className="mono" style={{ fontSize: 12, color: "var(--accent-cyan)" }}>
                              {r.sessionId}
                            </span>
                          </div>
                        </div>

                        {/* Score Meter */}
                        <div className="score-meter">
                          <div
                            className={`score-meter-fill ${r.threat.level.toLowerCase()}`}
                            style={{ width: `${r.threat.score}%` }}
                          />
                        </div>

                        {/* Details */}
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
                          {r.threat.details}
                        </div>

                        {/* Patterns */}
                        {r.threat.patterns.length > 0 && (
                          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                            {r.threat.patterns.map((p) => (
                              <span
                                key={p}
                                style={{
                                  fontSize: 10,
                                  fontFamily: "var(--font-mono)",
                                  padding: "2px 6px",
                                  background: "var(--bg-elevated)",
                                  borderRadius: 3,
                                  color: "var(--text-tertiary)",
                                }}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* LLM Response */}
                        {r.llmResponse && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 10,
                              background: "var(--bg-tertiary)",
                              borderRadius: "var(--radius-md)",
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              borderLeft: "3px solid var(--accent-green)",
                            }}
                          >
                            <div style={{ marginTop: 16 }}>
                              <div className="badge secondary" style={{ marginBottom: 8 }}>
                                LLM RESPONSE
                                {r.threat?.ml_jailbroken && (
                                  <span style={{ marginLeft: 8, background: 'var(--accent-red)', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 9 }}>
                                    🚨 JAILBREAK CONFIRMED BY ML
                                  </span>
                                )}
                              </div>
                              <div style={{ color: "var(--text-primary)", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                                {r.llmResponse || "[NO RESPONSE]"}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — Templates */}
        <div className="panel" style={{ alignSelf: "start" }}>
          <div className="panel-header">
            <span className="panel-title">Attack Templates</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{templates.length}</span>
          </div>

          {/* Source Filter Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border-primary)" }}>
            {(["all", "builtin", "gandalf"] as const).map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  fontSize: 10,
                  fontWeight: sourceFilter === src ? 700 : 400,
                  color: sourceFilter === src ? "var(--accent-cyan)" : "var(--text-muted)",
                  background: sourceFilter === src ? "var(--bg-elevated)" : "transparent",
                  border: "none",
                  borderBottom: sourceFilter === src ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {src === "all" ? `All (${templates.length})` : src === "builtin" ? `Built-in (${sourceCounts.builtin})` : `Gandalf (${sourceCounts.gandalf})`}
              </button>
            ))}
          </div>

          <div className="panel-body" style={{ maxHeight: 600, overflowY: "auto" }}>
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className={`template-card ${selectedTemplate === tpl.id ? "selected" : ""}`}
                onClick={() => selectTemplate(tpl)}
                style={{ margin: 8 }}
              >
                <div className="name">{tpl.name}</div>
                <div className="desc">{tpl.description}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span className={`badge ${tpl.expectedLevel.toLowerCase()}`} style={{ fontSize: 9 }}>
                    {tpl.expectedLevel}
                  </span>
                  <span className="badge info" style={{ fontSize: 9 }}>
                    {tpl.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
