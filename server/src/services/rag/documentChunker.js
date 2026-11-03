

import { MAX_CHUNK_CHARS } from './contentSanitizer.js';

const OVERLAP_CHARS = 150;
const MIN_CHUNK_CHARS = 80;

function splitIntoSentences(paragraph) {

  const raw = paragraph.split(/(?<=[.!?])\s+/);
  return raw.filter((s) => s.trim().length > 0);
}

function splitOversizedParagraph(paragraph) {
  const sentences = splitIntoSentences(paragraph);
  const subChunks = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > MAX_CHUNK_CHARS) {
      if (current) subChunks.push(current.trim());

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

export function chunkDocument(content, options = {}) {
  const maxChars = options.maxChunkChars || MAX_CHUNK_CHARS;
  const overlapChars = options.overlapChars || OVERLAP_CHARS;

  if (!content || content.trim().length === 0) return [];

  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length >= MIN_CHUNK_CHARS);

  const expandedBlocks = [];
  for (const para of paragraphs) {
    if (para.length > maxChars) {
      expandedBlocks.push(...splitOversizedParagraph(para));
    } else {
      expandedBlocks.push(para);
    }
  }

  const chunks = [];
  let currentText = '';
  let charCursor = 0;
  let charStart = 0;

  for (const block of expandedBlocks) {
    const separator = currentText ? '\n\n' : '';
    const candidate = `${currentText}${separator}${block}`;

    if (candidate.length > maxChars && currentText) {

      const trimmed = currentText.trim();
      if (trimmed.length >= MIN_CHUNK_CHARS) {
        chunks.push({
          text: trimmed,
          charStart,
          charEnd: charStart + trimmed.length,
          chunkIndex: chunks.length,
        });
      }

      const overlap = currentText.slice(-overlapChars).trim();
      charStart = charCursor - overlap.length;
      currentText = overlap ? `${overlap}\n\n${block}` : block;
    } else {
      currentText = candidate;
    }
    charCursor += block.length + separator.length;
  }

  const finalTrimmed = currentText.trim();
  if (finalTrimmed.length >= MIN_CHUNK_CHARS) {
    chunks.push({
      text: finalTrimmed,
      charStart,
      charEnd: charStart + finalTrimmed.length,
      chunkIndex: chunks.length,
    });
  }

  return chunks.map((c, i) => ({ ...c, chunkIndex: i }));
}
