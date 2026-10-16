/**
 * ragService.js
 *
 * Public RAG service facade — thin coordination layer that wires
 * ragIngestionService + ragRetrievalService + AIService together.
 *
 * Exposes:
 *   ragService.ingest(params)         → ingest a document
 *   ragService.query(query, options)  → retrieve context + generate LLM answer
 *   ragService.listDocuments(filter)  → list ingested documents
 *   ragService.deleteDocument(id)     → soft-delete a document + its chunks
 */

import { ingestDocument, ingestDocumentBatch } from './ragIngestionService.js';
import { buildRagContext } from './ragRetrievalService.js';
import aiService from '../ai/AIService.js';
import KnowledgeDocument from '../../models/KnowledgeDocument.js';
import KnowledgeChunk from '../../models/KnowledgeChunk.js';

export class RAGService {
  // ─── Ingestion ─────────────────────────────────────────────────────────────

  /**
   * Ingest a single document into the knowledge base.
   */
  async ingest(params) {
    return ingestDocument(params);
  }

  /**
   * Ingest a batch of documents.
   */
  async ingestBatch(documents, options) {
    return ingestDocumentBatch(documents, options);
  }

  // ─── Query ─────────────────────────────────────────────────────────────────

  /**
   * Semantic RAG query: retrieve context then generate an LLM answer.
   *
   * @param {string}  query
   * @param {object}  options
   * @param {string}  [options.exam]
   * @param {string}  [options.subject]
   * @param {string}  [options.topic]
   * @param {string}  [options.difficulty]
   * @param {number}  [options.topK]
   * @param {string}  [options.userId]
   * @returns {Promise<{ answer: string, retrievalMeta: object, aiMeta: object }>}
   */
  async query(query, options = {}) {
    const { exam, subject, topic, difficulty, topK = 5, userId = null } = options;

    // 1. Retrieve relevant context chunks
    const { contextChunks, retrievalMeta } = await buildRagContext(
      query,
      { exam, subject, topic, difficulty },
      topK
    );

    // 2. Generate answer via AIService RAG_QUERY template
    const aiResult = await aiService.executeTask(
      'RAG_QUERY',
      { userQuery: query, contextChunks },
      { userId }
    );

    return {
      answer: aiResult.text,
      retrievalMeta,
      aiMeta: aiResult.metadata,
    };
  }

  // ─── Document Management ───────────────────────────────────────────────────

  /**
   * List all active knowledge documents, with optional metadata filter.
   */
  async listDocuments(filter = {}, page = 1, limit = 20) {
    const mongoFilter = { isActive: true };
    if (filter.exam) mongoFilter['metadata.exam'] = filter.exam;
    if (filter.subject) mongoFilter['metadata.subject'] = filter.subject;
    if (filter.topic) mongoFilter['metadata.topic'] = filter.topic;
    if (filter.difficulty) mongoFilter['metadata.difficulty'] = filter.difficulty;
    if (filter.processingStatus) mongoFilter.processingStatus = filter.processingStatus;

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      KnowledgeDocument.find(mongoFilter)
        .select('-rawContent') // don't return raw content in list
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KnowledgeDocument.countDocuments(mongoFilter),
    ]);

    return { docs, total, page, pages: Math.ceil(total / limit) };
  }

  /**
   * Get a single document by ID (without raw content).
   */
  async getDocument(id) {
    return KnowledgeDocument.findById(id).select('-rawContent').lean();
  }

  /**
   * Soft-delete a document and all its chunks.
   */
  async deleteDocument(id) {
    const doc = await KnowledgeDocument.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!doc) return { success: false, message: 'Document not found.' };

    // Remove all associated chunks
    const { deletedCount } = await KnowledgeChunk.deleteMany({ documentId: id });

    return {
      success: true,
      message: `Document deactivated and ${deletedCount} chunks removed.`,
    };
  }

  /**
   * Hard-delete a document and all its chunks (admin only).
   */
  async hardDeleteDocument(id) {
    const doc = await KnowledgeDocument.findByIdAndDelete(id);
    if (!doc) return { success: false, message: 'Document not found.' };
    const { deletedCount } = await KnowledgeChunk.deleteMany({ documentId: id });
    return { success: true, message: `Document and ${deletedCount} chunks permanently deleted.` };
  }

  /**
   * Returns knowledge base stats.
   */
  async getStats() {
    const [docStats, chunkCount] = await Promise.all([
      KnowledgeDocument.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$processingStatus',
            count: { $sum: 1 },
            totalChunks: { $sum: '$totalChunks' },
            totalChars: { $sum: '$charCount' },
          },
        },
      ]),
      KnowledgeChunk.estimatedDocumentCount(),
    ]);

    const examBreakdown = await KnowledgeDocument.aggregate([
      { $match: { isActive: true, processingStatus: 'complete' } },
      { $group: { _id: '$metadata.exam', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return { docStats, chunkCount, examBreakdown };
  }
}

// Singleton
const ragService = new RAGService();
export default ragService;
