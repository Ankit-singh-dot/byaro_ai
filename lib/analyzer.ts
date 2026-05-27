// ============================================================
// AstroVault — Threat Analyzer
// Inline heuristic analysis engine (runs within Next.js process)
// For Docker deployment, this same logic runs in the threat-engine service
// ============================================================

import { ThreatResult, ThreatLevel, ThreatCategory, ActionTaken } from "./types";
import { DETECTION_PATTERNS, STRUCTURAL_CHECKS } from "./threat-patterns";
import { hashPayload, generateThreatId } from "./crypto";
import { THREAT_THRESHOLDS, THREAT_ACTIONS } from "./constants";

export interface AnalysisResult {
  threat: ThreatResult;
  matchedPatterns: Array<{
    id: string;
    name: string;
    category: ThreatCategory;
    weight: number;
  }>;
}

/**
 * Analyze a prompt for threats using heuristic pattern matching
 * and structural analysis.
 */
export function analyzePrompt(
  prompt: string,
  sessionId: string
): AnalysisResult {
  const matchedPatterns: Array<{
    id: string;
    name: string;
    category: ThreatCategory;
    weight: number;
  }> = [];

  // Run regex pattern matching
  for (const pattern of DETECTION_PATTERNS) {
    if (pattern.pattern.test(prompt)) {
      matchedPatterns.push({
        id: pattern.id,
        name: pattern.name,
        category: pattern.category,
        weight: pattern.weight,
      });
    }
  }

  // Run structural checks
  for (const check of STRUCTURAL_CHECKS) {
    if (check.check(prompt)) {
      matchedPatterns.push({
        id: check.id,
        name: check.name,
        category: check.category,
        weight: check.weight,
      });
    }
  }

  // Compute composite threat score
  let score = 0;
  if (matchedPatterns.length > 0) {
    // Take the max weight, then add diminishing contributions from others
    const sorted = [...matchedPatterns].sort((a, b) => b.weight - a.weight);
    score = sorted[0].weight;
    for (let i = 1; i < sorted.length; i++) {
      // Each additional match adds a fraction of its weight
      score += sorted[i].weight * (0.15 / i);
    }
    score = Math.min(Math.round(score), 100);
  }

  // Determine threat level from score
  let level = ThreatLevel.LOW;
  if (score >= THREAT_THRESHOLDS[ThreatLevel.CRITICAL]) {
    level = ThreatLevel.CRITICAL;
  } else if (score >= THREAT_THRESHOLDS[ThreatLevel.HIGH]) {
    level = ThreatLevel.HIGH;
  } else if (score >= THREAT_THRESHOLDS[ThreatLevel.MEDIUM]) {
    level = ThreatLevel.MEDIUM;
  }

  // Determine primary category (most frequent, or highest weighted)
  let category = ThreatCategory.PROMPT_INJECTION;
  if (matchedPatterns.length > 0) {
    const categoryCount: Record<string, number> = {};
    const categoryMaxWeight: Record<string, number> = {};
    for (const p of matchedPatterns) {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      categoryMaxWeight[p.category] = Math.max(
        categoryMaxWeight[p.category] || 0,
        p.weight
      );
    }
    // Pick category with highest max weight (tiebreak by count)
    const sorted = Object.entries(categoryMaxWeight).sort(
      (a, b) => b[1] - a[1] || (categoryCount[b[0]] || 0) - (categoryCount[a[0]] || 0)
    );
    category = sorted[0][0] as ThreatCategory;
  }

  // Determine action
  const action = (matchedPatterns.length === 0)
    ? ActionTaken.ALLOWED
    : (THREAT_ACTIONS[level] as ActionTaken);

  // Build details string
  const details =
    matchedPatterns.length === 0
      ? "No threat patterns detected."
      : `Matched ${matchedPatterns.length} pattern(s): ${matchedPatterns.map((p) => p.name).join(", ")}`;

  const threat: ThreatResult = {
    id: generateThreatId(),
    sessionId,
    timestamp: new Date().toISOString(),
    prompt,
    promptHash: hashPayload(prompt),
    score,
    level,
    category,
    action,
    patterns: matchedPatterns.map((p) => p.id),
    details,
  };

  return { threat, matchedPatterns };
}
