// ============================================================
// AstroVault — System Constants
// ============================================================

import { ThreatLevel, ThreatCategory } from "./types";

// --- Service URLs ---
// In Docker, services are referenced by container name.
// In dev mode, everything runs on localhost.

const IS_DOCKER = process.env.DOCKER_ENV === "true";

export const SERVICES = {
  THREAT_ENGINE: IS_DOCKER
    ? "http://threat-engine:4001"
    : "http://localhost:4001",
  LLM_PROXY: IS_DOCKER ? "http://llm-proxy:4002" : "http://localhost:4002",
  AUDIT_SERVICE: IS_DOCKER
    ? "http://audit-service:4003"
    : "http://localhost:4003",
  RED_TEAM: IS_DOCKER ? "http://red-team:4004" : "http://localhost:4004",
  BLUE_TEAM: IS_DOCKER ? "http://blue-team:4005" : "http://localhost:4005",
} as const;

// --- Gateway Configuration ---

export const GATEWAY = {
  MAX_PROMPT_LENGTH: 4096,
  MAX_REQUESTS_PER_MINUTE: 30,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  REQUEST_TIMEOUT_MS: 15000, // 15 seconds
} as const;

// --- Threat Thresholds ---

export const THREAT_THRESHOLDS: Record<ThreatLevel, number> = {
  [ThreatLevel.LOW]: 20,
  [ThreatLevel.MEDIUM]: 45,
  [ThreatLevel.HIGH]: 70,
  [ThreatLevel.CRITICAL]: 90,
};

// Automatic actions based on threat level
export const THREAT_ACTIONS: Record<ThreatLevel, "ALLOWED" | "FLAGGED" | "BLOCKED" | "QUARANTINED"> = {
  [ThreatLevel.LOW]: "ALLOWED",
  [ThreatLevel.MEDIUM]: "FLAGGED",
  [ThreatLevel.HIGH]: "BLOCKED",
  [ThreatLevel.CRITICAL]: "QUARANTINED",
};

// --- Audit Configuration ---

export const AUDIT = {
  HASH_ALGORITHM: "sha256",
  GENESIS_HASH: "0".repeat(64), // genesis block previous hash
  LOG_FILE: IS_DOCKER ? "/data/audit.jsonl" : "./data/audit.jsonl",
  MAX_ENTRIES_PER_QUERY: 500,
} as const;

// --- Rate Limiting ---

export const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  RED: { maxRequests: 20, windowMs: 60000 },
  BLUE: { maxRequests: 60, windowMs: 60000 },
  SYSTEM: { maxRequests: 120, windowMs: 60000 },
};

// --- Access Control Matrix ---
// Which paths each role can access

export const ACCESS_MATRIX: Record<string, string[]> = {
  RED: [
    "/api/gateway/submit",
    "/api/gateway/sessions",
    "/api/threat/analyze",
    "/api/events",
    "/api/health",
    "/api/gateway",
  ],
  BLUE: [
    "/api/gateway/sessions",
    "/api/threat/logs",
    "/api/audit",
    "/api/audit/verify",
    "/api/events",
    "/api/health",
    "/api/gateway",
  ],
  SYSTEM: ["*"], // system role has full access
};

// --- Threat Category Labels ---

export const CATEGORY_LABELS: Record<ThreatCategory, string> = {
  [ThreatCategory.PROMPT_INJECTION]: "Prompt Injection",
  [ThreatCategory.JAILBREAK]: "Jailbreak Attempt",
  [ThreatCategory.ROLE_OVERRIDE]: "Role Override",
  [ThreatCategory.DATA_EXFILTRATION]: "Data Exfiltration",
  [ThreatCategory.UNSAFE_GENERATION]: "Unsafe Generation",
  [ThreatCategory.CONTEXT_EXTRACTION]: "Context Extraction",
  [ThreatCategory.ENCODING_ATTACK]: "Encoding Attack",
  [ThreatCategory.INSTRUCTION_MANIPULATION]: "Instruction Manipulation",
};

// --- Level Colors (for UI) ---

export const LEVEL_COLORS: Record<ThreatLevel, string> = {
  [ThreatLevel.LOW]: "#22c55e",
  [ThreatLevel.MEDIUM]: "#eab308",
  [ThreatLevel.HIGH]: "#f97316",
  [ThreatLevel.CRITICAL]: "#ef4444",
};
