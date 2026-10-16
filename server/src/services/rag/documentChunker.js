/**
 * documentChunker.js
 *
 * Splits a document's sanitized text into overlapping chunks suitable
 * for dense embedding and vector retrieval.
 *
 * Strategy: Paragraph-aware chunking with token-count estimation.
 *  1. Split on paragraph boundaries (double newlines) first
 *  2. If a paragraph exceeds MAX_CHUNK_CHARS, further split on sentences
 *  3. Merge small adjacent paragraphs up to MAX_CHUNK_CHARS with OVERLAP_CHARS overlap
 *
 * The overlap ensures context continuity across chunk boundaries during retrieval.
 */

import { MAX_CHUNK_CHARS } from './contentSanitizer.js';

const OVERLAP_CHARS = 150;         // trailing characters carried into next chunk
const MIN_CHUNK_CHARS = 80;        // discard chunks shorter than this

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Splits text into sentences using punctuation boundaries.
 * Falls back to splitting on newlines for non-sentence text.
 */
function splitIntoSentences(paragraph) {
  // Split on . ! ? followed by whitespace, while preserving trailing punctuation
  const raw = paragraph.split(/(?<=[.!?])\s+/);
  return raw.filter((s) => s.trim().length > 0);
}

/**
 * Splits an oversized paragraph into sentence-grouped sub-chunks
 * each under MAX_CHUNK_CHARS.
 */
function splitOversizedParagraph(paragraph) {
  const sentences = splitIntoSentences(paragraph);
  const subChunks = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > MAX_CHUNK_CHARS) {
      if (current) subChunks.push(current.trim());
      // Even single sentences can exceed limit — hard-split by character
      if (sentence.length > MAX_CHUNK_CHARS) {
        for (let i = 0; i < sentence.length; i += MAX_CHUNK_CHARS - OVERLAP_CHARS) {
          subChunks.push(sentence.slice(i, i + MAX_CHUNK_CHARS).trim());
        }
        current = '';
      } else {
        current = sentence;
      }
    } else {
      current = candidate;
    }
  }

  if (current.trim()) subChunks.push(current.trim());
  return subChunks;
}

// ─── Core Chunking Function ───────────────────────────────────────────────────

/**
 * Chunks a sanitized document content string into an array of chunk objects.
 *
 * @param {string} content         - Sanitized document text
 * @param {object} options
 * @param {number} [options.maxChunkChars]   - Override default MAX_CHUNK_CHARS
 * @param {number} [options.overlapChars]    - Override default OVERLAP_CHARS
 * @returns {Array<{ text: string, charStart: number, charEnd: number, chunkIndex: number }>}
 */
export function chunkDocument(content, options = {}) {
  const maxChars = options.maxChunkChars || MAX_CHUNK_CHARS;
  const overlapChars = options.overlapChars || OVERLAP_CHARS;

  if (!content || content.trim().length === 0) return [];

  // ── Step 1: Split on paragraph boundaries ──────────────────────────────────
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length >= MIN_CHUNK_CHARS);

  // ── Step 2: Expand oversized paragraphs into sentence sub-chunks ──────────
  const expandedBlocks = [];
  for (const para of paragraphs) {
    if (para.length > maxChars) {
      expandedBlocks.push(...splitOversizedParagraph(para));
    } else {
      expandedBlocks.push(para);
    }
  }

  // ── Step 3: Merge small blocks + add overlap ───────────────────────────────
  const chunks = [];
  let currentText = '';
  let charCursor = 0;
  let charStart = 0;

  for (const block of expandedBlocks) {
    const separator = currentText ? '\n\n' : '';
    const candidate = `${currentText}${separator}${block}`;

    if (candidate.length > maxChars && currentText) {
      // Emit current chunk
      const trimmed = currentText.trim();
      if (trimmed.length >= MIN_CHUNK_CHARS) {
        chunks.push({
          text: trimmed,
          charStart,
          charEnd: charStart + trimmed.length,
          chunkIndex: chunks.length,
        });
      }
      // Begin new chunk with overlap from tail of previous chunk
      const overlap = currentText.slice(-overlapChars).trim();
      charStart = charCursor - overlap.length;
      currentText = overlap ? `${overlap}\n\n${block}` : block;
    } else {
      currentText = candidate;
    }
    charCursor += block.length + separator.length;
  }

  // Flush remaining text
  const finalTrimmed = currentText.trim();
  if (finalTrimmed.length >= MIN_CHUNK_CHARS) {
    chunks.push({
      text: finalTrimmed,
      charStart,
      charEnd: charStart + finalTrimmed.length,
      chunkIndex: chunks.length,
    });
  }

  // Re-index to ensure consecutive indices (overlap shuffling can cause gaps)
  return chunks.map((c, i) => ({ ...c, chunkIndex: i }));
}
