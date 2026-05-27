
import express from "express";
import { createHash } from "crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { dirname } from "path";

const app = express();
app.use(express.json({ limit: "16kb" }));

const PORT = process.env.PORT || 4003;
const LOG_FILE = process.env.AUDIT_LOG || "/data/audit.jsonl";
const GENESIS_HASH = "0".repeat(64);

// Ensure log directory exists
const logDir = dirname(LOG_FILE);
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

// In-memory chain state
let chain = [];
let lastHash = GENESIS_HASH;
let nextIndex = 0;

// Load existing chain from file
try {
  if (existsSync(LOG_FILE)) {
    const content = readFileSync(LOG_FILE, "utf-8").trim();
    if (content) {
      chain = content.split("\n").map((line) => JSON.parse(line));
      if (chain.length > 0) {
        lastHash = chain[chain.length - 1].currentHash;
        nextIndex = chain.length;
      }
    }
  }
} catch {
  console.log("[audit-service] Starting with empty chain.");
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function computeChainHash(entryData, prevHash) {
  return sha256(entryData + prevHash);
}

// POST /append
app.post("/append", (req, res) => {
  const entry = req.body;

  const index = nextIndex;
  const id = `AUD-${String(index).padStart(6, "0")}`;
  const previousHash = lastHash;

  const entryData = JSON.stringify({ ...entry, id, index, previousHash });
  const currentHash = computeChainHash(entryData, previousHash);

  const fullEntry = { ...entry, id, index, previousHash, currentHash, timestamp: new Date().toISOString() };

  console.log(`[audit-service] Appending entry #${index}: ${entry.action}`);
  console.log(`[audit-service] SHA-256 Hash generated: ${currentHash}`);

  // Append to file
  try {
    appendFileSync(LOG_FILE, JSON.stringify(fullEntry) + "\n");
  } catch (err) {
    console.error("[audit-service] Failed to write:", err.message);
  }

  chain.push(fullEntry);
  lastHash = currentHash;
  nextIndex++;

  res.status(201).json(fullEntry);
});

// GET /chain
app.get("/chain", (req, res) => {
  const limit = parseInt(req.query.limit) || 200;
  const entries = [...chain].reverse().slice(0, limit);
  res.json({ entries, total: chain.length });
});

// GET /verify
app.get("/verify", (req, res) => {
  if (chain.length === 0) {
    return res.json({ valid: true, totalEntries: 0, breakIndex: null, message: "Chain is empty." });
  }

  let prevHash = GENESIS_HASH;
  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    // 1. Check link integrity (Does it link to the previous block?)
    if (block.previousHash !== prevHash) {
      return res.json({
        valid: false, totalEntries: chain.length, breakIndex: i,
        message: `Chain broken at index ${i}: previousHash mismatch.`,
      });
    }

    // 2. Check payload integrity (Was the data tampered with?)
    // Strip out the metadata that was added *after* the hash was computed
    const { currentHash, timestamp, ...payload } = block;
    const recomputedData = JSON.stringify(payload);
    const expectedHash = computeChainHash(recomputedData, prevHash);

    if (expectedHash !== currentHash) {
      return res.json({
        valid: false, totalEntries: chain.length, breakIndex: i,
        message: `Chain broken at index ${i}: Data payload tampered! Hash mismatch.`,
      });
    }

    prevHash = block.currentHash;
  }

  res.json({
    valid: true, totalEntries: chain.length, breakIndex: null,
    message: `Chain verified: ${chain.length} entries, all hashes valid.`,
  });
});

// GET /health
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "audit-service", uptime: process.uptime(), entries: chain.length });
});

app.listen(PORT, () => {
  console.log(`[audit-service] Running on port ${PORT}`);
  console.log(`[audit-service] Log file: ${LOG_FILE}`);
  console.log(`[audit-service] Loaded ${chain.length} existing entries.`);
});
