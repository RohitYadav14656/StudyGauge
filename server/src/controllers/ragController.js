/**
 * ragController.js
 *
 * Express controllers for the RAG Knowledge Base API.
 *
 * Routes:
 *   POST   /api/rag/ingest              - Ingest a document (admin)
 *   POST   /api/rag/query               - Semantic RAG query (authenticated)
 *   GET    /api/rag/documents           - List documents (admin)
 *   GET    /api/rag/documents/:id       - Get document details (admin)
 *   DELETE /api/rag/documents/:id       - Soft-delete document (admin)
 *   DELETE /api/rag/documents/:id/hard  - Hard-delete document (admin)
 *   GET    /api/rag/stats               - Knowledge base statistics (admin)
 */

import ragService from '../services/rag/ragService.js';
import Joi from 'joi';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const ingestSchema = Joi.object({
  title: Joi.string().trim().min(3).max(500).required(),
  rawContent: Joi.string().trim().min(50).required(),
  contentType: Joi.string()
    .valid('text', 'markdown', 'pdf_extracted', 'web_scraped')
    .default('text'),
  sourceUrl: Joi.string().uri().allow('', null).default(null),
  metadata: Joi.object({
    exam: Joi.string().trim().allow('', null).default(null),
    subject: Joi.string().trim().allow('', null).default(null),
    topic: Joi.string().trim().allow('', null).default(null),
    source: Joi.string().trim().allow('', null).default(null),
    difficulty: Joi.string()
      .valid('beginner', 'intermediate', 'advanced', null)
      .allow(null)
      .default(null),
    tags: Joi.array().items(Joi.string().trim()).default([]),
    year: Joi.number().integer().min(1900).max(2100).allow(null).default(null),
    language: Joi.string().default('en'),
  }).default({}),
});

const querySchema = Joi.object({
  query: Joi.string().trim().min(3).max(2000).required(),
  exam: Joi.string().trim().allow('', null).default(null),
  subject: Joi.string().trim().allow('', null).default(null),
  topic: Joi.string().trim().allow('', null).default(null),
  difficulty: Joi.string()
    .valid('beginner', 'intermediate', 'advanced', null)
    .allow(null)
    .default(null),
  topK: Joi.number().integer().min(1).max(20).default(5),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Ingest a document into the RAG knowledge base
 * @route   POST /api/rag/ingest
 * @access  Admin
 */
export const ingestDocument = async (req, res, next) => {
  try {
    const { error, value } = ingestSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join('; '),
      });
    }

    const uploadedBy = req.user?._id?.toString() || null;
    const result = await ragService.ingest({ ...value, uploadedBy });

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: result.message,
        safetyFlags: result.safetyFlags,
      });
    }

    const statusCode = result.skipped ? 200 : 201;
    return res.status(statusCode).json({
      success: true,
      skipped: result.skipped,
      message: result.message,
      data: {
        documentId: result.document?._id,
        title: result.document?.title,
        totalChunks: result.totalChunks || result.document?.totalChunks,
        processingStatus: result.document?.processingStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Semantic RAG query - retrieve context and generate an AI answer
 * @route   POST /api/rag/query
 * @access  Private
 */
export const ragQuery = async (req, res, next) => {
  try {
    const { error, value } = querySchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join('; '),
      });
    }

    const userId = req.user?._id?.toString() || null;
    const result = await ragService.query(value.query, {
      exam: value.exam,
      subject: value.subject,
      topic: value.topic,
      difficulty: value.difficulty,
      topK: value.topK,
      userId,
    });

    return res.json({
      success: true,
      data: {
        answer: result.answer,
        query: value.query,
        contextChunksUsed: result.retrievalMeta.chunkCount,
        retrievalMeta: result.retrievalMeta,
        aiMeta: result.aiMeta,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    List knowledge base documents
 * @route   GET /api/rag/documents
 * @access  Admin
 */
export const listDocuments = async (req, res, next) => {
  try {
    const { exam, subject, topic, difficulty, processingStatus, page = 1, limit = 20 } = req.query;
    const result = await ragService.listDocuments(
      { exam, subject, topic, difficulty, processingStatus },
      Number(page),
      Math.min(Number(limit), 100)
    );

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single knowledge document
 * @route   GET /api/rag/documents/:id
 * @access  Admin
 */
export const getDocument = async (req, res, next) => {
  try {
    const doc = await ragService.getDocument(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    return res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Soft-delete a knowledge document and its chunks
 * @route   DELETE /api/rag/documents/:id
 * @access  Admin
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const result = await ragService.deleteDocument(req.params.id);
    if (!result.success) return res.status(404).json({ success: false, message: result.message });
    return res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Hard-delete a knowledge document and its chunks permanently
 * @route   DELETE /api/rag/documents/:id/hard
 * @access  Admin
 */
export const hardDeleteDocument = async (req, res, next) => {
  try {
    const result = await ragService.hardDeleteDocument(req.params.id);
    if (!result.success) return res.status(404).json({ success: false, message: result.message });
    return res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get knowledge base statistics
 * @route   GET /api/rag/stats
 * @access  Admin
 */
export const getKnowledgeBaseStats = async (req, res, next) => {
  try {
    const stats = await ragService.getStats();
    return res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
