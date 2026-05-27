// ============================================================
// AstroVault — Threat Detection Patterns
// 50+ patterns sourced from AdvBench, JailbreakBench, HarmBench,
// and Gandalf/Lakera red-teaming datasets
// ============================================================

import { ThreatCategory } from "@/lib/types";

export interface DetectionPattern {
  id: string;
  name: string;
  category: ThreatCategory;
  pattern: RegExp;
  weight: number; // 0-100 contribution to threat score
  description: string;
}

export const DETECTION_PATTERNS: DetectionPattern[] = [
  // ============================================
  // PROMPT INJECTION (AdvBench / Gandalf)
  // ============================================
  {
    id: "PI-001",
    name: "ignore_previous",
    category: ThreatCategory.PROMPT_INJECTION,
    pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|context|rules?|directions?)/i,
    weight: 85,
    description: "Attempts to override previous instructions",
  },
  {
    id: "PI-002",
    name: "disregard_instructions",
    category: ThreatCategory.PROMPT_INJECTION,
    pattern: /disregard\s+(all\s+)?(previous|prior|above|earlier|your)\s+(instructions?|prompts?|rules?|guidelines?|programming)/i,
    weight: 85,
    description: "Instructs model to disregard its guidelines",
  },
  {
    id: "PI-003",
    name: "new_instructions",
    category: ThreatCategory.PROMPT_INJECTION,
    pattern: /(new|updated|revised|overriding)\s+instructions?\s*:/i,
    weight: 70,
    description: "Attempts to inject new instruction block",
  },
  {
    id: "PI-004",
    name: "system_prompt_override",
    category: ThreatCategory.PROMPT_INJECTION,
    pattern: /\[?(system|admin|root|developer)\s*(prompt|message|instruction|override)\]?\s*:/i,
    weight: 90,
    description: "Mimics system prompt format to inject instructions",
  },
  {
    id: "PI-005",
    name: "delimiter_injection",
    category: ThreatCategory.PROMPT_INJECTION,
    pattern: /(```|---|\*\*\*|===|###)\s*(system|instructions?|prompt|override)/i,
    weight: 75,
    description: "Uses formatting delimiters to inject instructions",
  },
  {
    id: "PI-006",
    name: "forget_everything",
    category: ThreatCategory.PROMPT_INJECTION,
    pattern: /forget\s+(everything|all|about|your|what)\s+(you|i|we|was|were|previously|above)/i,
    weight: 80,
    description: "Instructs model to forget previous context",
  },
  {
    id: "PI-007",
    name: "prompt_termination",
    category: ThreatCategory.PROMPT_INJECTION,
    pattern: /(end\s+of\s+(system\s+)?prompt|<\/?(system|prompt|instruction)>|\[end\]|\[\/inst\])/i,
    weight: 85,
    description: "Attempts to terminate the system prompt boundary",
  },
  {
    id: "PI-008",
    name: "instruction_boundary",
    category: ThreatCategory.PROMPT_INJECTION,
    pattern: /(<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\]|<<SYS>>|<\/s>)/i,
    weight: 92,
    description: "Uses model-specific instruction boundary tokens",
  },

  // ============================================
  // JAILBREAK (JailbreakBench / Gandalf)
  // ============================================
  {
    id: "JB-001",
    name: "dan_mode",
    category: ThreatCategory.JAILBREAK,
    pattern: /(DAN|do\s+anything\s+now|jailbreak|jailbroken)\s*(mode|prompt|version)?/i,
    weight: 95,
    description: "DAN (Do Anything Now) jailbreak attempt",
  },
  {
    id: "JB-002",
    name: "developer_mode",
    category: ThreatCategory.JAILBREAK,
    pattern: /(developer|maintenance|debug|testing|god)\s*(mode|access|override)/i,
    weight: 88,
    description: "Attempts to enable a special development mode",
  },
  {
    id: "JB-003",
    name: "persona_hijack",
    category: ThreatCategory.JAILBREAK,
    pattern: /(pretend|act|behave|roleplay|imagine)\s+(you\s+are|as\s+if|to\s+be|like)\s+(a|an|the)?\s*(unrestricted|unfiltered|uncensored|evil|malicious)/i,
    weight: 90,
    description: "Attempts persona hijacking to bypass filters",
  },
  {
    id: "JB-004",
    name: "hypothetical_framing",
    category: ThreatCategory.JAILBREAK,
    pattern: /(hypothetically|theoretically|in\s+a\s+fictional|imagine\s+a\s+world|for\s+educational|for\s+research)\s+.{0,50}(how\s+to|explain|describe|teach|create|make|build)/i,
    weight: 65,
    description: "Uses hypothetical framing to extract harmful content",
  },
  {
    id: "JB-005",
    name: "opposite_day",
    category: ThreatCategory.JAILBREAK,
    pattern: /(opposite\s+day|opposite\s+mode|reverse\s+psychology|answer\s+the\s+opposite|do\s+the\s+opposite)/i,
    weight: 72,
    description: "Opposite day/reverse psychology jailbreak",
  },
  {
    id: "JB-006",
    name: "token_smuggling",
    category: ThreatCategory.JAILBREAK,
    pattern: /(\w)\s+(\w)\s+(\w)\s+(\w)\s+(\w)\s+(\w)\s+(\w)\s+(\w).*?(bomb|weapon|hack|exploit|attack|poison|drug)/i,
    weight: 60,
    description: "Character-by-character token smuggling",
  },
  {
    id: "JB-007",
    name: "grandma_exploit",
    category: ThreatCategory.JAILBREAK,
    pattern: /(grandma|grandmother|deceased\s+relative|my\s+late)\s+.{0,100}(used\s+to|would|always|told\s+me)/i,
    weight: 55,
    description: "Grandma exploit — emotional manipulation for bypass",
  },
  {
    id: "JB-008",
    name: "translation_bypass",
    category: ThreatCategory.JAILBREAK,
    pattern: /(translate|convert|write)\s+.{0,30}(into|to|in)\s+(another|different|foreign|obscure|pig\s+latin|base64|binary|hex)/i,
    weight: 60,
    description: "Language/encoding translation bypass attempt",
  },
  {
    id: "JB-009",
    name: "story_wrapper",
    category: ThreatCategory.JAILBREAK,
    pattern: /(write\s+a\s+story|creative\s+fiction|fictional\s+scenario|narrative)\s+.{0,80}(where|about|involving|featuring)\s+.{0,50}(villain|hacker|criminal|terrorist|attacker)/i,
    weight: 55,
    description: "Fiction/story wrapper to extract harmful instructions",
  },
  {
    id: "JB-010",
    name: "safety_filter_reference",
    category: ThreatCategory.JAILBREAK,
    pattern: /(safety\s+filter|content\s+filter|alignment|guardrail|safety\s+training|RLHF|refusal)\s*.{0,30}(bypass|disable|remove|ignore|override|circumvent|turn\s+off)/i,
    weight: 93,
    description: "Directly references and attempts to bypass safety systems",
  },

  // ============================================
  // ROLE OVERRIDE
  // ============================================
  {
    id: "RO-001",
    name: "you_are_now",
    category: ThreatCategory.ROLE_OVERRIDE,
    pattern: /you\s+are\s+now\s+(a|an|the|my)?\s*(new|different|unrestricted|unfiltered)/i,
    weight: 82,
    description: "Direct role reassignment attempt",
  },
  {
    id: "RO-002",
    name: "from_now_on",
    category: ThreatCategory.ROLE_OVERRIDE,
    pattern: /from\s+now\s+on\s*.{0,30}(you\s+will|you\s+must|you\s+should|always|never|stop\s+being)/i,
    weight: 78,
    description: "Persistent behavior modification attempt",
  },
  {
    id: "RO-003",
    name: "switch_persona",
    category: ThreatCategory.ROLE_OVERRIDE,
    pattern: /(switch|change|transform|morph|become)\s+(to|into|your)?\s*(persona|character|identity|role|mode)/i,
    weight: 75,
    description: "Persona switching directive",
  },
  {
    id: "RO-004",
    name: "sudo_command",
    category: ThreatCategory.ROLE_OVERRIDE,
    pattern: /(sudo|root|admin|superuser|elevated)\s*(access|mode|privilege|command|execute|run)/i,
    weight: 88,
    description: "Sudo/privilege escalation attempt",
  },
  {
    id: "RO-005",
    name: "override_safety",
    category: ThreatCategory.ROLE_OVERRIDE,
    pattern: /(override|disable|remove|bypass|deactivate)\s+(your|all|the|any)?\s*(safety|restriction|limitation|filter|constraint|rule|guideline|policy)/i,
    weight: 92,
    description: "Direct safety override instruction",
  },

  // ============================================
  // DATA EXFILTRATION
  // ============================================
  {
    id: "DE-001",
    name: "reveal_system_prompt",
    category: ThreatCategory.DATA_EXFILTRATION,
    pattern: /(reveal|show|display|print|output|repeat|recite|tell\s+me)\s+(your|the)?\s*(system\s+prompt|initial\s+prompt|instructions|hidden\s+prompt|secret|original\s+prompt|pre-prompt)/i,
    weight: 88,
    description: "Attempts to extract the system prompt",
  },
  {
    id: "DE-002",
    name: "what_are_instructions",
    category: ThreatCategory.DATA_EXFILTRATION,
    pattern: /what\s+(are|were)\s+(your|the)\s+(instructions|guidelines|rules|directives|system\s+prompt|initial\s+instructions)/i,
    weight: 80,
    description: "Indirect system prompt extraction",
  },
  {
    id: "DE-003",
    name: "config_extraction",
    category: ThreatCategory.DATA_EXFILTRATION,
    pattern: /(print|show|display|list|output|dump)\s+(your|the|all)?\s*(config|configuration|settings|parameters|environment|env\s+vars?|api\s+key|secret|token|password|credentials)/i,
    weight: 90,
    description: "Configuration/credential extraction attempt",
  },
  {
    id: "DE-004",
    name: "training_data_extraction",
    category: ThreatCategory.DATA_EXFILTRATION,
    pattern: /(training\s+data|fine.?tun|dataset|corpus|training\s+examples?)\s*.{0,30}(show|reveal|extract|reproduce|repeat|recite)/i,
    weight: 72,
    description: "Training data extraction attempt",
  },
  {
    id: "DE-005",
    name: "context_window_dump",
    category: ThreatCategory.DATA_EXFILTRATION,
    pattern: /(print|output|show|display|dump|repeat)\s+(everything|all|the\s+entire|full|complete)\s*(context|conversation|history|prompt|buffer|input|window)/i,
    weight: 85,
    description: "Context window dump attempt",
  },

  // ============================================
  // UNSAFE GENERATION (HarmBench)
  // ============================================
  {
    id: "UG-001",
    name: "weapon_synthesis",
    category: ThreatCategory.UNSAFE_GENERATION,
    pattern: /(how\s+to\s+(make|build|create|synthesize|manufacture)|step.?by.?step|instructions\s+for)\s*.{0,50}(bomb|explosive|weapon|firearm|gun|grenade|poison|toxin|chemical\s+weapon|biological\s+weapon)/i,
    weight: 98,
    description: "Weapons/explosives synthesis instructions",
  },
  {
    id: "UG-002",
    name: "malware_creation",
    category: ThreatCategory.UNSAFE_GENERATION,
    pattern: /(write|create|generate|code|develop|build)\s*.{0,30}(malware|virus|trojan|ransomware|keylogger|rootkit|exploit|zero.?day|backdoor|worm|spyware)/i,
    weight: 95,
    description: "Malware creation instructions",
  },
  {
    id: "UG-003",
    name: "illegal_activity",
    category: ThreatCategory.UNSAFE_GENERATION,
    pattern: /(how\s+to|guide\s+to|teach\s+me|explain\s+how)\s*.{0,50}(hack\s+into|break\s+into|steal|forge|counterfeit|launder|traffic|smuggle)/i,
    weight: 88,
    description: "Illegal activity instructions",
  },
  {
    id: "UG-004",
    name: "social_engineering",
    category: ThreatCategory.UNSAFE_GENERATION,
    pattern: /(write|create|draft|compose)\s*.{0,30}(phishing|scam|fraud|con|deceptive|manipulative)\s*(email|message|letter|script|template|campaign)/i,
    weight: 82,
    description: "Social engineering content generation",
  },
  {
    id: "UG-005",
    name: "harmful_impersonation",
    category: ThreatCategory.UNSAFE_GENERATION,
    pattern: /(impersonate|pretend\s+to\s+be|pose\s+as|fake)\s*.{0,30}(doctor|lawyer|officer|official|government|authority|bank|support)/i,
    weight: 78,
    description: "Harmful impersonation instructions",
  },

  // ============================================
  // CONTEXT EXTRACTION
  // ============================================
  {
    id: "CE-001",
    name: "previous_conversation",
    category: ThreatCategory.CONTEXT_EXTRACTION,
    pattern: /(previous|earlier|last|prior|other)\s*(user|person|conversation|session|chat|interaction|query|request|customer)/i,
    weight: 75,
    description: "Attempts to access previous user sessions",
  },
  {
    id: "CE-002",
    name: "other_user_data",
    category: ThreatCategory.CONTEXT_EXTRACTION,
    pattern: /(other|another|different)\s*(user|person|customer|client|account|patient)('s|s')?\s*(data|info|information|details|records|history|messages)/i,
    weight: 85,
    description: "Cross-user data extraction attempt",
  },
  {
    id: "CE-003",
    name: "memory_probe",
    category: ThreatCategory.CONTEXT_EXTRACTION,
    pattern: /(what\s+do\s+you\s+remember|recall\s+from|access\s+memory|shared\s+memory|conversation\s+history|chat\s+log)\s*(of|from|about|with)?\s*(other|previous|another|different)?/i,
    weight: 70,
    description: "Probes for cross-session memory leakage",
  },

  // ============================================
  // ENCODING ATTACKS
  // ============================================
  {
    id: "EA-001",
    name: "base64_payload",
    category: ThreatCategory.ENCODING_ATTACK,
    pattern: /(?:decode|interpret|execute|run|process|eval)\s+(?:this|the\s+following)?\s*(?:base64|b64|encoded)/i,
    weight: 80,
    description: "Base64-encoded payload injection",
  },
  {
    id: "EA-002",
    name: "hex_payload",
    category: ThreatCategory.ENCODING_ATTACK,
    pattern: /(?:0x[0-9a-f]{2}\s*){4,}/i,
    weight: 65,
    description: "Hex-encoded payload detection",
  },
  {
    id: "EA-003",
    name: "unicode_abuse",
    category: ThreatCategory.ENCODING_ATTACK,
    pattern: /(?:\\u[0-9a-f]{4}){3,}|[\u200b\u200c\u200d\u2060\ufeff]{2,}/i,
    weight: 70,
    description: "Unicode escape or invisible character abuse",
  },
  {
    id: "EA-004",
    name: "rot13_obfuscation",
    category: ThreatCategory.ENCODING_ATTACK,
    pattern: /(rot13|rot-13|caesar\s+cipher|shift\s+cipher|decode\s+this\s+cipher)/i,
    weight: 60,
    description: "ROT13/Caesar cipher obfuscation",
  },

  // ============================================
  // INSTRUCTION MANIPULATION
  // ============================================
  {
    id: "IM-001",
    name: "multi_turn_escalation",
    category: ThreatCategory.INSTRUCTION_MANIPULATION,
    pattern: /(continue|proceed|keep\s+going|go\s+further|don't\s+stop|more\s+detail|elaborate)\s*.{0,30}(ignore|without|no\s+matter|regardless|despite)\s*.{0,30}(rules?|restrictions?|limitations?|safety|guidelines?)/i,
    weight: 78,
    description: "Multi-turn escalation to progressively bypass safety",
  },
  {
    id: "IM-002",
    name: "completion_hijack",
    category: ThreatCategory.INSTRUCTION_MANIPULATION,
    pattern: /(complete|finish|continue)\s+(this|the\s+following|my)\s*(sentence|paragraph|code|text|story|response)\s*:/i,
    weight: 50,
    description: "Completion hijacking to force dangerous outputs",
  },
  {
    id: "IM-003",
    name: "negative_inversion",
    category: ThreatCategory.INSTRUCTION_MANIPULATION,
    pattern: /(don't|do\s+not|never)\s+say\s+(you\s+can't|no|I\s+cannot|I\s+refuse|I\s+won't)/i,
    weight: 72,
    description: "Negative inversion to prevent refusal",
  },
  {
    id: "IM-004",
    name: "authority_claim",
    category: ThreatCategory.INSTRUCTION_MANIPULATION,
    pattern: /(I\s+am|I'm)\s+(your|a|the|an)?\s*(creator|developer|admin|owner|operator|engineer|OpenAI|Anthropic|Google|CEO|CTO)\s*.{0,30}(authorize|allow|permit|command|order|instruct|grant)/i,
    weight: 88,
    description: "False authority claim to bypass restrictions",
  },
  {
    id: "IM-005",
    name: "prompt_leak_indirect",
    category: ThreatCategory.INSTRUCTION_MANIPULATION,
    pattern: /(start|begin)\s+(your\s+)?(response|answer|reply|output)\s+with\s*['"]/i,
    weight: 55,
    description: "Forces specific response format to leak prompts",
  },
  {
    id: "IM-006",
    name: "emotional_manipulation",
    category: ThreatCategory.INSTRUCTION_MANIPULATION,
    pattern: /(if\s+you\s+don't|unless\s+you|people\s+will\s+die|emergency|life\s+or\s+death|urgent\s+danger|save\s+lives?)\s*.{0,50}(help|respond|answer|comply|tell\s+me)/i,
    weight: 65,
    description: "Emotional manipulation / urgency exploitation",
  },
];

/**
 * Additional structural analysis checks that don't use regex patterns.
 */
export interface StructuralCheck {
  id: string;
  name: string;
  category: ThreatCategory;
  weight: number;
  check: (prompt: string) => boolean;
  description: string;
}

export const STRUCTURAL_CHECKS: StructuralCheck[] = [
  {
    id: "SC-001",
    name: "excessive_repetition",
    category: ThreatCategory.INSTRUCTION_MANIPULATION,
    weight: 40,
    check: (prompt: string) => {
      const words = prompt.toLowerCase().split(/\s+/);
      const freq: Record<string, number> = {};
      for (const w of words) {
        freq[w] = (freq[w] || 0) + 1;
      }
      return Object.values(freq).some((c) => c > 10 && c / words.length > 0.15);
    },
    description: "Excessive word repetition (potential confusion/overload attack)",
  },
  {
    id: "SC-002",
    name: "abnormal_length",
    category: ThreatCategory.PROMPT_INJECTION,
    weight: 35,
    check: (prompt: string) => prompt.length > 3000,
    description: "Abnormally long prompt (potential payload hiding)",
  },
  {
    id: "SC-003",
    name: "high_special_char_ratio",
    category: ThreatCategory.ENCODING_ATTACK,
    weight: 45,
    check: (prompt: string) => {
      const special = prompt.replace(/[a-zA-Z0-9\s]/g, "");
      return special.length / prompt.length > 0.3 && prompt.length > 50;
    },
    description: "High ratio of special characters (potential encoding attack)",
  },
  {
    id: "SC-004",
    name: "nested_instructions",
    category: ThreatCategory.PROMPT_INJECTION,
    weight: 55,
    check: (prompt: string) => {
      const markers = ["[", "]", "{{", "}}", "<<", ">>", "<|", "|>"];
      let count = 0;
      for (const m of markers) {
        if (prompt.includes(m)) count++;
      }
      return count >= 4;
    },
    description: "Multiple nested instruction markers detected",
  },
  {
    id: "SC-005",
    name: "multi_language_mix",
    category: ThreatCategory.JAILBREAK,
    weight: 40,
    check: (prompt: string) => {
      // Simple check for mixing scripts (Latin + CJK + Cyrillic etc.)
      const hasLatin = /[a-zA-Z]/.test(prompt);
      const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(prompt);
      const hasCyrillic = /[\u0400-\u04ff]/.test(prompt);
      const hasArabic = /[\u0600-\u06ff]/.test(prompt);
      const scripts = [hasLatin, hasCJK, hasCyrillic, hasArabic].filter(Boolean);
      return scripts.length >= 2;
    },
    description: "Mixed script/language usage (potential translation bypass)",
  },
];
