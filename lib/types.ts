// ============================================================
// AstroVault — Core Type Definitions
// Central type system for the AI security infrastructure platform
// ============================================================

// --- Enums ---

export enum TeamRole {
  RED = "RED",
  BLUE = "BLUE",
  SYSTEM = "SYSTEM",
}

export enum ThreatLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum ThreatCategory {
  PROMPT_INJECTION = "PROMPT_INJECTION",
  JAILBREAK = "JAILBREAK",
  ROLE_OVERRIDE = "ROLE_OVERRIDE",
  DATA_EXFILTRATION = "DATA_EXFILTRATION",
  UNSAFE_GENERATION = "UNSAFE_GENERATION",
  CONTEXT_EXTRACTION = "CONTEXT_EXTRACTION",
  ENCODING_ATTACK = "ENCODING_ATTACK",
  INSTRUCTION_MANIPULATION = "INSTRUCTION_MANIPULATION",
}

export enum SessionStatus {
  ACTIVE = "ACTIVE",
  QUARANTINED = "QUARANTINED",
  TERMINATED = "TERMINATED",
  COMPLETED = "COMPLETED",
}

export enum ActionTaken {
  ALLOWED = "ALLOWED",
  BLOCKED = "BLOCKED",
  FLAGGED = "FLAGGED",
  QUARANTINED = "QUARANTINED",
}

// --- Core Data Structures ---

export interface Session {
  id: string;
  role: TeamRole;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  promptCount: number;
  blockedCount: number;
  highestThreatLevel: ThreatLevel;
  metadata: Record<string, string>;
}

export interface ThreatResult {
  id: string;
  sessionId: string;
  timestamp: string;
  prompt: string;
  promptHash: string;
  score: number; // 0-100
  level: ThreatLevel;
  category: ThreatCategory;
  action: ActionTaken;
  patterns: string[]; // matched pattern names
  details: string;
  ml_jailbroken?: boolean;
  ml_confidence?: number;
}

export interface AuditEntry {
  id: string;
  index: number;
  timestamp: string;
  sessionId: string;
  role: TeamRole;
  action: string;
  promptHash: string;
  riskScore: number;
  actionTaken: ActionTaken;
  previousHash: string;
  currentHash: string;
  metadata: Record<string, string>;
}

export interface AttackPayload {
  prompt: string;
  sessionId?: string;
  templateId?: string;
  metadata?: Record<string, string>;
}

export interface GatewayResponse {
  success: boolean;
  requestId: string;
  sessionId: string;
  timestamp: string;
  threat: ThreatResult | null;
  llmResponse: string | null;
  action: ActionTaken;
  error?: string;
}

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  uptime: number; // seconds
  lastCheck: string;
  details: Record<string, unknown>;
}

export interface SystemMetrics {
  totalAttacks: number;
  blockedPrompts: number;
  activeSessions: number;
  quarantinedSessions: number;
  systemIntegrity: boolean;
  auditChainValid: boolean;
  threatsByLevel: Record<ThreatLevel, number>;
  threatsByCategory: Record<ThreatCategory, number>;
}

// --- SSE Event Types ---

export enum EventType {
  ATTACK_SUBMITTED = "ATTACK_SUBMITTED",
  PROMPT_BLOCKED = "PROMPT_BLOCKED",
  THREAT_DETECTED = "THREAT_DETECTED",
  SESSION_CREATED = "SESSION_CREATED",
  SESSION_QUARANTINED = "SESSION_QUARANTINED",
  SESSION_TERMINATED = "SESSION_TERMINATED",
  AUDIT_ENTRY = "AUDIT_ENTRY",
  SYSTEM_ALERT = "SYSTEM_ALERT",
  HEARTBEAT = "HEARTBEAT",
}

export interface SystemEvent {
  id: string;
  type: EventType;
  timestamp: string;
  role: TeamRole;
  data: Record<string, unknown>;
}

// --- Attack Templates ---

export interface AttackTemplate {
  id: string;
  name: string;
  category: ThreatCategory;
  description: string;
  prompt: string;
  expectedLevel: ThreatLevel;
  source: string; // dataset source
}
