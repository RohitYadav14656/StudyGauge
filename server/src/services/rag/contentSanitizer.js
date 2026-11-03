

export const MAX_DOC_CHARS = Number(process.env.RAG_MAX_DOC_CHARS) || 200_000;
export const MAX_CHUNK_CHARS = 1_500;
export const MIN_CONTENT_CHARS = 50;

const PROMPT_INJECTION_PATTERNS = [

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

  /do\s+anything\s+now/i,
  /jailbreak/i,
  /bypass\s+(your\s+)?(safety|guidelines|filters)/i,
  /override\s+(safety|system)/i,

  /---+\s*(system|user|assistant)\s*---+/i,
  /#{3,}\s*(system|instruction)/i,
];

const MALICIOUS_PATTERNS = [

  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /on(load|error|click|mouseover)\s*=/i,

  /'\s*OR\s*'1'\s*=\s*'1/i,
  /;\s*DROP\s+TABLE/i,
  /UNION\s+SELECT/i,

  /\.\.[\/\\]/,
  /%2e%2e[\/\\]/i,
];

function detectExcessiveRepetition(content) {

  const words = content.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 100) return false;

  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  const maxFreq = Math.max(...Object.values(freq));
  const ratio = maxFreq / words.length;
  return ratio > 0.5;
}

export function sanitizeDocumentContent(content, title = '') {
  const safetyFlags = {
    hasSuspiciousContent: false,
    hasPromptInjectionRisk: false,
    flagReason: null,
  };

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

  let sanitized = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{4,}/g, '   ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

  return {
    isAccepted: true,
    safetyFlags,
    sanitizedContent: sanitized,
  };
}

export function sanitizeChunkForPrompt(chunkContent) {
  return chunkContent

    .replace(/<\s*system\s*>/gi, '[system]')
    .replace(/<\/\s*system\s*>/gi, '[/system]')
    .replace(/\[SYSTEM_INSTRUCTION\]/gi, '[system_instruction]')
    .replace(/\[INST\]/gi, '[inst]')
    .replace(/\[\/INST\]/gi, '[/inst]')

    .replace(/^(system|user|assistant)\s*:/gim, (m) => `\`${m}\``)
    .replace(/---+\s*(system|user|assistant)/gi, '---')
    .trim();
}
