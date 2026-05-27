// ============================================================
// AstroVault — Blue Team Microservice
// Defense classifier pipeline and threat aggregation
// ============================================================

import express from "express";

const app = express();
app.use(express.json({ limit: "16kb" }));

const PORT = process.env.PORT || 4005;

// Threat aggregation state
const threatStats = {
  totalDetected: 0,
  totalBlocked: 0,
  byCategory: {},
  byLevel: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
  recentAlerts: [],
};

// POST /report — Receive threat reports from gateway
app.post("/report", (req, res) => {
  const { threat } = req.body;
  if (!threat) return res.status(400).json({ error: "Missing threat data." });

  console.log(`[blue-team] Threat report received from gateway! Level: ${threat.level}, Action: ${threat.action}`);
  if (threat.action === "QUARANTINED") {
    console.log(`[blue-team]  ALERT: Session quarantined due to critical threat.`);
  }

  threatStats.totalDetected++;
  if (threat.action === "BLOCKED" || threat.action === "QUARANTINED") {
    threatStats.totalBlocked++;
  }

  threatStats.byCategory[threat.category] = (threatStats.byCategory[threat.category] || 0) + 1;
  threatStats.byLevel[threat.level] = (threatStats.byLevel[threat.level] || 0) + 1;

  threatStats.recentAlerts.unshift({
    id: threat.id,
    level: threat.level,
    category: threat.category,
    action: threat.action,
    score: threat.score,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 100 alerts
  if (threatStats.recentAlerts.length > 100) {
    threatStats.recentAlerts = threatStats.recentAlerts.slice(0, 100);
  }

  res.json({ received: true });
});

// GET /stats — Aggregated threat statistics
app.get("/stats", (req, res) => {
  res.json(threatStats);
});

// GET /alerts — Recent alerts
app.get("/alerts", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ alerts: threatStats.recentAlerts.slice(0, limit) });
});

// POST /classify — Classify a prompt (simplified defense classifier)
app.post("/classify", (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt." });

  // Simple classifier: check for common safe patterns
  const isSafe = !/ignore|bypass|override|jailbreak|DAN|sudo|hack|malware/i.test(prompt);

  res.json({
    safe: isSafe,
    confidence: isSafe ? 0.85 : 0.15,
    timestamp: new Date().toISOString(),
  });
});

// GET /health
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "blue-team",
    uptime: process.uptime(),
    stats: { detected: threatStats.totalDetected, blocked: threatStats.totalBlocked },
  });
});

app.listen(PORT, () => {
  console.log(`[blue-team] Running on port ${PORT}`);
});
