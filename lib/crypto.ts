// ============================================================
// AstroVault — Cryptographic Utilities
// SHA-256 hash chaining for tamper-evident audit logs
// ============================================================

import { createHash, randomBytes } from "crypto";
import { AUDIT } from "./constants";

/**
 * Compute SHA-256 hash of arbitrary data.
 */
export function sha256(data: string): string {
  return createHash(AUDIT.HASH_ALGORITHM).update(data).digest("hex");
}

/**
 * Hash a prompt payload for audit logging.
 * Normalizes whitespace to prevent trivial hash differences.
 */
export function hashPayload(data: string): string {
  const normalized = data.trim().replace(/\s+/g, " ");
  return sha256(normalized);
}

/**
 * Compute the chain hash for an audit entry.
 * chain_hash = SHA-256(current_entry_json + previous_hash)
 *
 * This creates a tamper-evident chain: modifying any entry
 * breaks all subsequent hashes.
 */
export function computeChainHash(
  entryData: string,
  previousHash: string
): string {
  return sha256(entryData + previousHash);
}

/**
 * Generate a cryptographically random session ID.
 * Format: S-<8 hex chars>
 */
export function generateSessionId(): string {
  return `S-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Generate a cryptographically random request ID.
 * Format: REQ-<12 hex chars>
 */
export function generateRequestId(): string {
  return `REQ-${randomBytes(6).toString("hex").toUpperCase()}`;
}

/**
 * Generate a unique event ID.
 * Format: EVT-<timestamp>-<4 hex chars>
 */
export function generateEventId(): string {
  const ts = Date.now().toString(36);
  const rand = randomBytes(2).toString("hex");
  return `EVT-${ts}-${rand}`;
}

/**
 * Generate a unique audit entry ID.
 * Format: AUD-<index padded to 6>-<4 hex chars>
 */
export function generateAuditId(index: number): string {
  const padded = index.toString().padStart(6, "0");
  const rand = randomBytes(2).toString("hex");
  return `AUD-${padded}-${rand}`;
}

/**
 * Generate a unique threat result ID.
 * Format: THR-<timestamp>-<4 hex chars>
 */
export function generateThreatId(): string {
  const ts = Date.now().toString(36);
  const rand = randomBytes(2).toString("hex");
  return `THR-${ts}-${rand}`;
}
