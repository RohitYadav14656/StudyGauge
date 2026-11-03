

import { ingestDocument, ingestDocumentBatch } from './ragIngestionService.js';
import { buildRagContext } from './ragRetrievalService.js';
import aiService from '../ai/AIService.js';
import KnowledgeDocument from '../../models/KnowledgeDocument.js';
import KnowledgeChunk from '../../models/KnowledgeChunk.js';

export class RAGService {

  async ingest(params) {
    return ingestDocument(params);
  }

  async ingestBatch(documents, options) {
    return ingestDocumentBatch(documents, options);
  }

  async query(query, options = {}) {
    const { exam, subject, topic, difficulty, topK = 5, userId = null } = options;

    const { contextChunks, retrievalMeta } = await buildRagContext(
      query,
      { exam, subject, topic, difficulty },
      topK
    );

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
        .select('-rawContent')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KnowledgeDocument.countDocuments(mongoFilter),
    ]);

    return { docs, total, page, pages: Math.ceil(total / limit) };
  }

  async getDocument(id) {
    return KnowledgeDocument.findById(id).select('-rawContent').lean();
  }

  async deleteDocument(id) {
    const doc = await KnowledgeDocument.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!doc) return { success: false, message: 'Document not found.' };

    const { deletedCount } = await KnowledgeChunk.deleteMany({ documentId: id });

    return {
      success: true,
      message: `Document deactivated and ${deletedCount} chunks removed.`,
    };
  }

  async hardDeleteDocument(id) {
    const doc = await KnowledgeDocument.findByIdAndDelete(id);
    if (!doc) return { success: false, message: 'Document not found.' };
    const { deletedCount } = await KnowledgeChunk.deleteMany({ documentId: id });
    return { success: true, message: `Document and ${deletedCount} chunks permanently deleted.` };
  }

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

const ragService = new RAGService();
export default ragService;
