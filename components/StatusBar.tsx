// ============================================================
// AstroVault — Status Bar
// Top bar showing system health indicators
// ============================================================

"use client";

import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  uptime: number;
  metrics?: {
    activeSessions: number;
    totalAttacks: number;
    blockedPrompts: number;
    auditChainValid: boolean;
  };
}

export default function StatusBar() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    // Fetch health data
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setHealth(data);
      } catch {
        setHealth(null);
      }
    };

    fetchHealth();
    const healthInterval = setInterval(fetchHealth, 10000);

    // Update clock
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="status-bar">
      <div className="status-indicator">
        <div className={`status-dot ${health ? "green" : "red"} pulse`} />
        <span>{health?.status === "operational" ? "System Operational" : "Checking..."}</span>
      </div>

      <div style={{ width: 1, height: 16, background: "var(--border-primary)" }} />

      <div className="status-indicator">
        <span style={{ color: "var(--text-muted)" }}>Sessions:</span>
        <span style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {health?.metrics?.activeSessions ?? 0}
        </span>
      </div>

      <div className="status-indicator">
        <span style={{ color: "var(--text-muted)" }}>Attacks:</span>
        <span style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {health?.metrics?.totalAttacks ?? 0}
        </span>
      </div>

      <div className="status-indicator">
        <span style={{ color: "var(--text-muted)" }}>Blocked:</span>
        <span
          style={{
            color: (health?.metrics?.blockedPrompts ?? 0) > 0 ? "var(--accent-red)" : "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {health?.metrics?.blockedPrompts ?? 0}
        </span>
      </div>

      <div style={{ width: 1, height: 16, background: "var(--border-primary)" }} />

      <div className="status-indicator">
        <span style={{ color: "var(--text-muted)" }}>Audit Chain:</span>
        <span style={{ color: health?.metrics?.auditChainValid ? "var(--accent-green)" : "var(--accent-red)" }}>
          {health?.metrics?.auditChainValid ? "✓ Valid" : "✗ Invalid"}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <div className="status-indicator">
        <span style={{ color: "var(--text-muted)" }}>Uptime:</span>
        <span>{health ? formatUptime(health.uptime) : "—"}</span>
      </div>

      <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: 11 }}>
        {time}
      </div>
    </div>
  );
}
