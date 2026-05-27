// ============================================================
// AstroVault — Audit Chain Viewer
// Hash-chained audit log with chain verification
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditEntry {
  id: string;
  index: number;
  timestamp: string;
  sessionId: string;
  role: string;
  action: string;
  promptHash: string;
  riskScore: number;
  actionTaken: string;
  previousHash: string;
  currentHash: string;
  metadata: Record<string, string>;
}

interface VerifyResult {
  valid: boolean;
  totalEntries: number;
  breakIndex: number | null;
  message: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [verification, setVerification] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch("/api/audit?limit=200", {
        headers: { "x-team-role": "SYSTEM" },
      });
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 8000);
    return () => clearInterval(interval);
  }, [fetchAudit]);

  const verifyChain = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/audit/verify", {
        headers: { "x-team-role": "SYSTEM" },
      });
      const data = await res.json();
      setVerification(data);
    } catch {
      setVerification({
        valid: false,
        totalEntries: 0,
        breakIndex: null,
        message: "Failed to verify chain.",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Audit Chain</h2>
        <p>Tamper-evident, cryptographically verified audit log of all system activity</p>
      </div>

      {/* Verification Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <button className="btn btn-primary" onClick={verifyChain} disabled={verifying}>
          {verifying ? "Verifying..." : "⛓ Verify Chain Integrity"}
        </button>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {entries.length} audit entries in chain
        </span>
      </div>

      {/* Verification Result */}
      {verification && (
        <div className={`chain-status ${verification.valid ? "valid" : "invalid"}`} style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>{verification.valid ? "✓" : "✗"}</span>
          <div>
            <div style={{ fontWeight: 600 }}>
              {verification.valid ? "Chain Integrity Verified" : "Chain Integrity BROKEN"}
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              {verification.message}
            </div>
          </div>
        </div>
      )}

      {/* Chain Visualization */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Audit Entries (hash-chained)</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>SHA-256 chained</span>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-purple)" }}>
              genesis → latest
            </span>
          </div>
        </div>
        <div className="panel-body" style={{ maxHeight: "calc(100vh - 320px)" }}>
          {entries.length === 0 ? (
            <div className="empty-state">
              <div className="icon">⛓</div>
              <div>No audit entries yet. Activity generates entries automatically.</div>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id}>
                <div
                  className="log-entry"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  style={{ cursor: "pointer" }}
                >
                  <span style={{ color: "var(--text-muted)", fontSize: 10, width: 40, flexShrink: 0, fontFamily: "var(--font-mono)" }}>
                    #{entry.index}
                  </span>
                  <span className="log-timestamp">
                    {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                  </span>
                  <span className={`badge ${entry.role === "RED" ? "high" : entry.role === "BLUE" ? "info" : "active"}`} style={{ fontSize: 9 }}>
                    {entry.role}
                  </span>
                  <span style={{ color: "var(--text-primary)", fontSize: 12, flex: 1 }}>
                    {entry.action}
                  </span>
                  <span className={`badge ${entry.actionTaken.toLowerCase()}`} style={{ fontSize: 9 }}>
                    {entry.actionTaken}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent-purple)", width: 80, textAlign: "right", flexShrink: 0 }}>
                    {entry.currentHash.substring(0, 8)}…
                  </span>
                </div>

                {expandedId === entry.id && (
                  <div style={{ padding: "12px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)" }}>
                    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>SESSION ID</div>
                        <span className="mono" style={{ color: "var(--accent-cyan)", fontSize: 12 }}>
                          {entry.sessionId}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>RISK SCORE</div>
                        <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                          {entry.riskScore}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>PROMPT HASH</div>
                      <div className="hash-display">{entry.promptHash || "—"}</div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>PREVIOUS HASH</div>
                      <div className="hash-display">{entry.previousHash}</div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>CURRENT HASH</div>
                      <div className="hash-display">{entry.currentHash}</div>
                    </div>

                    {/* Chain Link Visualization */}
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--text-muted)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-purple)" }}>
                        prev:{entry.previousHash.substring(0, 12)}…
                      </span>
                      <span>→</span>
                      <span style={{ color: "var(--text-tertiary)" }}>SHA-256(entry + prev)</span>
                      <span>→</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-green)" }}>
                        curr:{entry.currentHash.substring(0, 12)}…
                      </span>
                    </div>

                    {/* Metadata */}
                    {Object.keys(entry.metadata).length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>METADATA</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                          {JSON.stringify(entry.metadata, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
