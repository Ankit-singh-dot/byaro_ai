// ============================================================
// AstroVault — In-Memory Data Store
// Server-side singleton for sessions, threats, audit, and events
// ============================================================

import {
  Session,
  ThreatResult,
  AuditEntry,
  SystemEvent,
  SystemMetrics,
  ThreatLevel,
  ThreatCategory,
  SessionStatus,
  TeamRole,
  EventType,
  ActionTaken,
} from "./types";
import {
  generateSessionId,
  generateEventId,
  generateAuditId,
  computeChainHash,
  sha256,
} from "./crypto";
import { AUDIT, THREAT_THRESHOLDS } from "./constants";

// --- Event Listener System ---

type EventListener = (event: SystemEvent) => void;
const listeners: Set<EventListener> = new Set();

export function addEventListener(listener: EventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: SystemEvent) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // silently ignore listener errors
    }
  }
}

// --- Sessions Store ---

const sessions: Map<string, Session> = new Map();

export function createSession(role: TeamRole): Session {
  const session: Session = {
    id: generateSessionId(),
    role,
    status: SessionStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    promptCount: 0,
    blockedCount: 0,
    highestThreatLevel: ThreatLevel.LOW,
    metadata: {},
  };
  sessions.set(session.id, session);

  emit({
    id: generateEventId(),
    type: EventType.SESSION_CREATED,
    timestamp: session.createdAt,
    role: TeamRole.SYSTEM,
    data: { sessionId: session.id, role: session.role },
  });

  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function getAllSessions(roleFilter?: TeamRole): Session[] {
  const all = Array.from(sessions.values());
  if (roleFilter && roleFilter !== TeamRole.SYSTEM) {
    return all.filter((s) => s.role === roleFilter);
  }
  return all;
}

export function updateSession(id: string, updates: Partial<Session>): Session | null {
  const session = sessions.get(id);
  if (!session) return null;
  Object.assign(session, updates, { updatedAt: new Date().toISOString() });
  sessions.set(id, session);
  return session;
}

export function quarantineSession(id: string): Session | null {
  const session = sessions.get(id);
  if (!session) return null;
  session.status = SessionStatus.QUARANTINED;
  session.updatedAt = new Date().toISOString();
  sessions.set(id, session);

  emit({
    id: generateEventId(),
    type: EventType.SESSION_QUARANTINED,
    timestamp: session.updatedAt,
    role: TeamRole.SYSTEM,
    data: { sessionId: id, previousStatus: session.status },
  });

  return session;
}

export function terminateSession(id: string): Session | null {
  const session = sessions.get(id);
  if (!session) return null;
  session.status = SessionStatus.TERMINATED;
  session.updatedAt = new Date().toISOString();
  sessions.set(id, session);

  emit({
    id: generateEventId(),
    type: EventType.SESSION_TERMINATED,
    timestamp: session.updatedAt,
    role: TeamRole.SYSTEM,
    data: { sessionId: id },
  });

  return session;
}

// --- Threat Logs ---

const threatLogs: ThreatResult[] = [];

export function addThreatLog(threat: ThreatResult): void {
  threatLogs.push(threat);

  // Update session stats
  const session = sessions.get(threat.sessionId);
  if (session) {
    session.promptCount += 1;
    if (threat.action === ActionTaken.BLOCKED || threat.action === ActionTaken.QUARANTINED) {
      session.blockedCount += 1;
    }
    // Update highest threat level
    const currentLevel = THREAT_THRESHOLDS[session.highestThreatLevel];
    const newLevel = THREAT_THRESHOLDS[threat.level];
    if (newLevel > currentLevel) {
      session.highestThreatLevel = threat.level;
    }
    session.updatedAt = new Date().toISOString();
    sessions.set(session.id, session);

    // Auto-quarantine on CRITICAL
    if (threat.level === ThreatLevel.CRITICAL && session.status === SessionStatus.ACTIVE) {
      quarantineSession(session.id);
    }
  }

  // Emit events
  emit({
    id: generateEventId(),
    type: EventType.THREAT_DETECTED,
    timestamp: threat.timestamp,
    role: TeamRole.SYSTEM,
    data: {
      threatId: threat.id,
      sessionId: threat.sessionId,
      level: threat.level,
      category: threat.category,
      score: threat.score,
      action: threat.action,
    },
  });

  if (threat.action === ActionTaken.BLOCKED || threat.action === ActionTaken.QUARANTINED) {
    emit({
      id: generateEventId(),
      type: EventType.PROMPT_BLOCKED,
      timestamp: threat.timestamp,
      role: TeamRole.SYSTEM,
      data: {
        threatId: threat.id,
        sessionId: threat.sessionId,
        level: threat.level,
        category: threat.category,
      },
    });
  }
}

export function getThreatLogs(filters?: {
  level?: ThreatLevel;
  category?: ThreatCategory;
  sessionId?: string;
  limit?: number;
}): ThreatResult[] {
  let results = [...threatLogs];

  if (filters?.level) {
    results = results.filter((t) => t.level === filters.level);
  }
  if (filters?.category) {
    results = results.filter((t) => t.category === filters.category);
  }
  if (filters?.sessionId) {
    results = results.filter((t) => t.sessionId === filters.sessionId);
  }

  // Return newest first
  results.reverse();

  if (filters?.limit) {
    results = results.slice(0, filters.limit);
  }

  return results;
}

// --- Audit Chain ---

const auditChain: AuditEntry[] = [];
let lastHash: string = AUDIT.GENESIS_HASH;

export function appendAuditEntry(
  entry: Omit<AuditEntry, "id" | "index" | "previousHash" | "currentHash">
): AuditEntry {
  const index = auditChain.length;
  const id = generateAuditId(index);
  const previousHash = lastHash;

  const entryData = JSON.stringify({
    ...entry,
    id,
    index,
    previousHash,
  });
  const currentHash = computeChainHash(entryData, previousHash);

  const fullEntry: AuditEntry = {
    ...entry,
    id,
    index,
    previousHash,
    currentHash,
  };

  auditChain.push(fullEntry);
  lastHash = currentHash;

  emit({
    id: generateEventId(),
    type: EventType.AUDIT_ENTRY,
    timestamp: entry.timestamp,
    role: TeamRole.SYSTEM,
    data: { auditId: id, index, action: entry.action },
  });

  return fullEntry;
}

export function getAuditChain(limit?: number): AuditEntry[] {
  const entries = [...auditChain].reverse();
  return limit ? entries.slice(0, limit) : entries;
}

export function verifyAuditChain(): {
  valid: boolean;
  totalEntries: number;
  breakIndex: number | null;
  message: string;
} {
  if (auditChain.length === 0) {
    return { valid: true, totalEntries: 0, breakIndex: null, message: "Chain is empty — no entries to verify." };
  }

  let prevHash = AUDIT.GENESIS_HASH;

  for (let i = 0; i < auditChain.length; i++) {
    const entry = auditChain[i];

    // Verify previous hash matches
    if (entry.previousHash !== prevHash) {
      return {
        valid: false,
        totalEntries: auditChain.length,
        breakIndex: i,
        message: `Chain broken at index ${i}: previousHash mismatch.`,
      };
    }

    // Recompute and verify current hash
    const entryData = JSON.stringify({
      timestamp: entry.timestamp,
      sessionId: entry.sessionId,
      role: entry.role,
      action: entry.action,
      promptHash: entry.promptHash,
      riskScore: entry.riskScore,
      actionTaken: entry.actionTaken,
      metadata: entry.metadata,
      id: entry.id,
      index: entry.index,
      previousHash: entry.previousHash,
    });
    const expectedHash = computeChainHash(entryData, prevHash);

    if (entry.currentHash !== expectedHash) {
      return {
        valid: false,
        totalEntries: auditChain.length,
        breakIndex: i,
        message: `Chain broken at index ${i}: currentHash does not match recomputed hash.`,
      };
    }

    prevHash = entry.currentHash;
  }

  return {
    valid: true,
    totalEntries: auditChain.length,
    breakIndex: null,
    message: `Chain verified: ${auditChain.length} entries, all hashes valid.`,
  };
}

// --- System Metrics ---

export function getSystemMetrics(): SystemMetrics {
  const allSessions = Array.from(sessions.values());
  const verification = verifyAuditChain();

  const threatsByLevel: Record<ThreatLevel, number> = {
    [ThreatLevel.LOW]: 0,
    [ThreatLevel.MEDIUM]: 0,
    [ThreatLevel.HIGH]: 0,
    [ThreatLevel.CRITICAL]: 0,
  };

  const threatsByCategory: Record<ThreatCategory, number> = {
    [ThreatCategory.PROMPT_INJECTION]: 0,
    [ThreatCategory.JAILBREAK]: 0,
    [ThreatCategory.ROLE_OVERRIDE]: 0,
    [ThreatCategory.DATA_EXFILTRATION]: 0,
    [ThreatCategory.UNSAFE_GENERATION]: 0,
    [ThreatCategory.CONTEXT_EXTRACTION]: 0,
    [ThreatCategory.ENCODING_ATTACK]: 0,
    [ThreatCategory.INSTRUCTION_MANIPULATION]: 0,
  };

  for (const t of threatLogs) {
    threatsByLevel[t.level]++;
    threatsByCategory[t.category]++;
  }

  return {
    totalAttacks: threatLogs.length,
    blockedPrompts: threatLogs.filter(
      (t) => t.action === ActionTaken.BLOCKED || t.action === ActionTaken.QUARANTINED
    ).length,
    activeSessions: allSessions.filter((s) => s.status === SessionStatus.ACTIVE).length,
    quarantinedSessions: allSessions.filter(
      (s) => s.status === SessionStatus.QUARANTINED
    ).length,
    systemIntegrity: true,
    auditChainValid: verification.valid,
    threatsByLevel,
    threatsByCategory,
  };
}

// --- Emit helper for external use ---

export function emitSystemEvent(
  type: EventType,
  role: TeamRole,
  data: Record<string, unknown>
): void {
  emit({
    id: generateEventId(),
    type,
    timestamp: new Date().toISOString(),
    role,
    data,
  });
}
