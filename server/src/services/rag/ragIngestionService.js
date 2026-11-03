

import KnowledgeDocument from '../../models/KnowledgeDocument.js';
import KnowledgeChunk from '../../models/KnowledgeChunk.js';
import { sanitizeDocumentContent } from './contentSanitizer.js';
import { chunkDocument } from './documentChunker.js';
import { embedBatch } from './embeddingService.js';

export async function ingestDocument(params) {
  const {
    title,
    rawContent,
    contentType = 'text',
    sourceUrl = null,
    metadata = {},
    uploadedBy = null,
  } = params;

  if (!title || !rawContent) {
    return { success: false, message: 'title and rawContent are required.' };
  }

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

  await KnowledgeDocument.findByIdAndUpdate(doc._id, { processingStatus: 'chunking' });

  const rawChunks = chunkDocument(sanitizedContent);

  if (rawChunks.length === 0) {
    await KnowledgeDocument.findByIdAndUpdate(doc._id, {
      processingStatus: 'failed',
      processingError: 'No valid chunks produced from content',
    });
    return { success: false, message: 'Document could not be chunked (content too short or empty).' };
  }

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
