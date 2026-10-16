/**
 * ragIngestionService.js
 *
 * Orchestrates the complete document ingestion pipeline:
 *
 *  1. Validate & sanitize (security layer)
 *  2. Dedup check via SHA-256 content hash
 *  3. Persist KnowledgeDocument (status = 'pending')
 *  4. Chunk the sanitized content
 *  5. Batch-embed all chunks via embeddingService
 *  6. Persist KnowledgeChunks with embeddings + metadata
 *  7. Update KnowledgeDocument status → 'complete'
 *
 * This is the single public API for adding knowledge to the RAG store.
 */

import KnowledgeDocument from '../../models/KnowledgeDocument.js';
import KnowledgeChunk from '../../models/KnowledgeChunk.js';
import { sanitizeDocumentContent } from './contentSanitizer.js';
import { chunkDocument } from './documentChunker.js';
import { embedBatch } from './embeddingService.js';

// ─── Main Ingestion Function ──────────────────────────────────────────────────

/**
 * Ingests a document into the RAG knowledge base.
 *
 * @param {object} params
 * @param {string}  params.title          - Human-readable document title
 * @param {string}  params.rawContent     - Raw text content
 * @param {string}  [params.contentType]  - 'text' | 'markdown' | 'pdf_extracted' | 'web_scraped'
 * @param {string}  [params.sourceUrl]    - URL or file path the content came from
 * @param {object}  [params.metadata]     - Educational metadata
 * @param {string}  [params.metadata.exam]
 * @param {string}  [params.metadata.subject]
 * @param {string}  [params.metadata.topic]
 * @param {string}  [params.metadata.source]
 * @param {string}  [params.metadata.difficulty]  - 'beginner'|'intermediate'|'advanced'
 * @param {string[]}[params.metadata.tags]
 * @param {number}  [params.metadata.year]
 * @param {string}  [params.uploadedBy]   - User ObjectId string
 *
 * @returns {Promise<{ success: boolean, document?: object, message: string, skipped?: boolean }>}
 */
export async function ingestDocument(params) {
  const {
    title,
    rawContent,
    contentType = 'text',
    sourceUrl = null,
    metadata = {},
    uploadedBy = null,
  } = params;

  // ── 1. Input validation ────────────────────────────────────────────────────
  if (!title || !rawContent) {
    return { success: false, message: 'title and rawContent are required.' };
  }

  // ── 2. Security sanitization ───────────────────────────────────────────────
  const sanitizationResult = sanitizeDocumentContent(rawContent, title);

  if (!sanitizationResult.isAccepted) {
    console.warn(`[RAG Ingestion] Document "${title}" rejected: ${sanitizationResult.rejectionReason}`);
    return {
      success: false,
      message: sanitizationResult.rejectionReason,
      safetyFlags: sanitizationResult.safetyFlags,
    };
  }

  const { sanitizedContent, safetyFlags } = sanitizationResult;

  // ── 3. Compute hash & check for duplicate ──────────────────────────────────
  // Hash is computed in the KnowledgeDocument pre-validate hook,
  // but we compute it early here for the existence check.
  const { createHash } = await import('crypto');
  const contentHash = createHash('sha256').update(sanitizedContent.trim()).digest('hex');

  const existing = await KnowledgeDocument.findOne({ contentHash });
  if (existing) {
    console.log(`[RAG Ingestion] Duplicate detected for "${title}" (hash: ${contentHash.slice(0, 12)}…). Skipping.`);
    return {
      success: true,
      skipped: true,
      document: existing,
      message: `Document already exists in knowledge base (ID: ${existing._id}).`,
    };
  }

  // ── 4. Create KnowledgeDocument (status: pending) ─────────────────────────
  let doc;
  try {
    doc = await KnowledgeDocument.create({
      title,
      rawContent: sanitizedContent,
      contentType,
      sourceUrl,
      metadata: {
        exam: metadata.exam || null,
        subject: metadata.subject || null,
        topic: metadata.topic || null,
        source: metadata.source || null,
        difficulty: metadata.difficulty || null,
        tags: metadata.tags || [],
        year: metadata.year || null,
        language: metadata.language || 'en',
      },
      safetyFlags,
      isProcessed: false,
      processingStatus: 'pending',
      uploadedBy: uploadedBy || null,
    });
  } catch (err) {
    // Handle duplicate key error (race condition)
    if (err.code === 11000) {
      const existingDoc = await KnowledgeDocument.findOne({ contentHash });
      return {
        success: true,
        skipped: true,
        document: existingDoc,
        message: 'Document already exists (concurrent ingestion detected).',
      };
    }
    throw err;
  }

  // ── 5. Chunk the document ─────────────────────────────────────────────────
  await KnowledgeDocument.findByIdAndUpdate(doc._id, { processingStatus: 'chunking' });

  const rawChunks = chunkDocument(sanitizedContent);

  if (rawChunks.length === 0) {
    await KnowledgeDocument.findByIdAndUpdate(doc._id, {
      processingStatus: 'failed',
      processingError: 'No valid chunks produced from content',
    });
    return { success: false, message: 'Document could not be chunked (content too short or empty).' };
  }

  // ── 6. Embed all chunks ───────────────────────────────────────────────────
  await KnowledgeDocument.findByIdAndUpdate(doc._id, { processingStatus: 'embedding' });

  const chunkTexts = rawChunks.map((c) => c.text);
  let embeddingResults;
  try {
    embeddingResults = await embedBatch(chunkTexts, 'RETRIEVAL_DOCUMENT');
  } catch (err) {
    await KnowledgeDocument.findByIdAndUpdate(doc._id, {
      processingStatus: 'failed',
      processingError: `Embedding failed: ${err.message}`,
    });
    throw err;
  }

  // ── 7. Persist KnowledgeChunks ────────────────────────────────────────────
  const chunkDocs = rawChunks.map((chunk, i) => ({
    documentId: doc._id,
    content: chunk.text,
    chunkIndex: chunk.chunkIndex,
    totalChunksInDoc: rawChunks.length,
    charStart: chunk.charStart,
    charEnd: chunk.charEnd,
    embedding: embeddingResults[i].embedding,
    embeddingModel: embeddingResults[i].model,
    metadata: {
      exam: metadata.exam || null,
      subject: metadata.subject || null,
      topic: metadata.topic || null,
      source: metadata.source || null,
      difficulty: metadata.difficulty || null,
      tags: metadata.tags || [],
      year: metadata.year || null,
      documentTitle: title,
    },
  }));

  await KnowledgeChunk.insertMany(chunkDocs, { ordered: false });

  // ── 8. Mark document as complete ─────────────────────────────────────────
  const completedDoc = await KnowledgeDocument.findByIdAndUpdate(
    doc._id,
    {
      isProcessed: true,
      processingStatus: 'complete',
      totalChunks: rawChunks.length,
    },
    { new: true }
  );

  console.log(`[RAG Ingestion] ✓ "${title}" → ${rawChunks.length} chunks embedded (model: ${embeddingResults[0]?.model || 'unknown'})`);

  return {
    success: true,
    skipped: false,
    document: completedDoc,
    totalChunks: rawChunks.length,
    message: `Document ingested successfully: ${rawChunks.length} chunks created.`,
  };
}

/**
 * Ingests multiple documents. Processes sequentially to avoid embedding rate limits.
 *
 * @param {object[]} documents - Array of ingestion param objects
 * @param {object}   [options]
 * @param {boolean}  [options.continueOnError] - If true, log errors and continue
 * @returns {Promise<{ results: object[], summary: object }>}
 */
export async function ingestDocumentBatch(documents, options = {}) {
  const { continueOnError = true } = options;
  const results = [];
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const doc of documents) {
    try {
      const result = await ingestDocument(doc);
      results.push({ title: doc.title, ...result });
      if (result.success && result.skipped) skippedCount++;
      else if (result.success) successCount++;
      else failedCount++;
    } catch (err) {
      const errorResult = { title: doc.title, success: false, message: err.message };
      results.push(errorResult);
      failedCount++;
      if (!continueOnError) throw err;
      console.error(`[RAG Ingestion] Error ingesting "${doc.title}":`, err.message);
    }
  }

  return {
    results,
    summary: { total: documents.length, successCount, skippedCount, failedCount },
  };
}
