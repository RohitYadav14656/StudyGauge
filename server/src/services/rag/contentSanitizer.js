/**
 * contentSanitizer.js
 *
 * Security layer for RAG document ingestion.
 * Runs BEFORE any content is chunked, embedded, or stored.
 *
 * Safeguards:
 *  1. Oversized documents (configurable MAX_DOC_CHARS)
 *  2. Prompt injection attempts via system-level instruction keywords
 *  3. Role-play / jailbreak patterns targeting the LLM
 *  4. Malicious script injection (XSS-style payloads)
 *  5. Excessive repetition / padding attacks
 */

// ─── Configuration ────────────────────────────────────────────────────────────
export const MAX_DOC_CHARS = Number(process.env.RAG_MAX_DOC_CHARS) || 200_000; // ~50k tokens
export const MAX_CHUNK_CHARS = 1_500;  // enforced during chunking
export const MIN_CONTENT_CHARS = 50;   // reject near-empty documents

// ─── Prompt Injection Patterns ────────────────────────────────────────────────
const PROMPT_INJECTION_PATTERNS = [
  // Classic LLM role-override attempts
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(everything|all)\s+(you|I)\s+(know|said|told)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(a|an)\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /new\s+instructions?:/i,
  /system\s+prompt:/i,
  /\[SYSTEM\]/i,
  /<\s*system\s*>/i,

  // DAN / jailbreak patterns
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /bypass\s+(your\s+)?(safety|guidelines|filters)/i,
  /override\s+(safety|system)/i,

  // Instruction delimiter spoofing
  /---+\s*(system|user|assistant)\s*---+/i,
  /#{3,}\s*(system|instruction)/i,
];

// ─── Malicious Content Patterns ───────────────────────────────────────────────
const MALICIOUS_PATTERNS = [
  // Script injection
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /on(load|error|click|mouseover)\s*=/i,

  // SQL injection probes
  /'\s*OR\s*'1'\s*=\s*'1/i,
  /;\s*DROP\s+TABLE/i,
  /UNION\s+SELECT/i,

  // Path traversal
  /\.\.[\/\\]/,
  /%2e%2e[\/\\]/i,
];

// ─── Repetition Attack Detection ─────────────────────────────────────────────
function detectExcessiveRepetition(content) {
  // Split into non-empty words and look for dominant single token
  const words = content.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 100) return false; // too short to be a padding attack

  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  const maxFreq = Math.max(...Object.values(freq));
  const ratio = maxFreq / words.length;
  return ratio > 0.5; // >50% single token → suspicious
}

// ─── Main Sanitization Function ───────────────────────────────────────────────

/**
 * Validates and sanitizes raw document content before ingestion.
 *
 * @param {string} content - Raw document text
 * @param {string} [title]  - Document title (also checked)
 * @returns {{ isAccepted: boolean, safetyFlags: object, sanitizedContent: string, rejectionReason?: string }}
 */
export function sanitizeDocumentContent(content, title = '') {
  const safetyFlags = {
    hasSuspiciousContent: false,
    hasPromptInjectionRisk: false,
    flagReason: null,
  };

  // ── 1. Size checks ──────────────────────────────────────────────────────────
  if (!content || content.trim().length < MIN_CONTENT_CHARS) {
    return {
      isAccepted: false,
      safetyFlags,
      sanitizedContent: '',
      rejectionReason: `Document content is too short (minimum ${MIN_CONTENT_CHARS} characters required).`,
    };
  }

  if (content.length > MAX_DOC_CHARS) {
    return {
      isAccepted: false,
      safetyFlags,
      sanitizedContent: '',
      rejectionReason: `Document exceeds maximum allowed size of ${MAX_DOC_CHARS.toLocaleString()} characters. Please split into smaller documents.`,
    };
  }

  // ── 2. Malicious content scan ───────────────────────────────────────────────
  const combinedInput = `${title} ${content}`;

  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(combinedInput)) {
      safetyFlags.hasSuspiciousContent = true;
      safetyFlags.flagReason = `Malicious pattern detected: ${pattern.toString().slice(0, 60)}`;
      return {
        isAccepted: false,
        safetyFlags,
        sanitizedContent: '',
        rejectionReason: 'Document contains potentially malicious content and cannot be ingested.',
      };
    }
  }

  // ── 3. Prompt injection scan ────────────────────────────────────────────────
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(combinedInput)) {
      safetyFlags.hasPromptInjectionRisk = true;
      safetyFlags.flagReason = `Prompt injection pattern: ${pattern.toString().slice(0, 60)}`;
      return {
        isAccepted: false,
        safetyFlags,
        sanitizedContent: '',
        rejectionReason: 'Document contains prompt injection risk patterns and cannot be ingested.',
      };
    }
  }

  // ── 4. Repetition / padding attack ─────────────────────────────────────────
  if (detectExcessiveRepetition(content)) {
    safetyFlags.hasSuspiciousContent = true;
    safetyFlags.flagReason = 'Excessive repetition detected (possible padding attack)';
    return {
      isAccepted: false,
      safetyFlags,
      sanitizedContent: '',
      rejectionReason: 'Document contains excessive repetition and appears to be a padding attack.',
    };
  }

  // ── 5. Sanitize: strip HTML tags, normalize whitespace ─────────────────────
  let sanitized = content
    .replace(/<[^>]+>/g, ' ')         // strip HTML tags
    .replace(/&[a-z]+;/gi, ' ')       // strip HTML entities
    .replace(/\r\n/g, '\n')           // normalize line endings
    .replace(/[ \t]{4,}/g, '   ')     // collapse excessive spaces/tabs
    .replace(/\n{4,}/g, '\n\n\n')     // collapse excessive blank lines
    .trim();

  return {
    isAccepted: true,
    safetyFlags,
    sanitizedContent: sanitized,
  };
}

/**
 * Sanitizes a context chunk BEFORE it is injected into an LLM prompt.
 * This is a lightweight second-pass guard specifically targeting
 * prompt injection through retrieved context.
 *
 * @param {string} chunkContent
 * @returns {string} Sanitized chunk safe for LLM context injection
 */
export function sanitizeChunkForPrompt(chunkContent) {
  return chunkContent
    // Neutralize common role-override delimiters that could escape context brackets
    .replace(/<\s*system\s*>/gi, '[system]')
    .replace(/<\/\s*system\s*>/gi, '[/system]')
    .replace(/\[SYSTEM_INSTRUCTION\]/gi, '[system_instruction]')
    .replace(/\[INST\]/gi, '[inst]')
    .replace(/\[\/INST\]/gi, '[/inst]')
    // Escape instruction-style delimiters used by popular LLMs
    .replace(/^(system|user|assistant)\s*:/gim, (m) => `\`${m}\``)
    .replace(/---+\s*(system|user|assistant)/gi, '---')
    .trim();
}
