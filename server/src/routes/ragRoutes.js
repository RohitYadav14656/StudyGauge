/**
 * ragRoutes.js
 *
 * Express router for the RAG Knowledge Base API.
 *
 * POST   /api/rag/ingest              → Ingest document          [admin]
 * POST   /api/rag/query               → Semantic RAG query       [authenticated user]
 * GET    /api/rag/documents           → List documents           [admin]
 * GET    /api/rag/documents/:id       → Get document             [admin]
 * DELETE /api/rag/documents/:id       → Soft-delete document     [admin]
 * DELETE /api/rag/documents/:id/hard  → Hard-delete document     [admin]
 * GET    /api/rag/stats               → Knowledge base stats     [admin]
 */

import express from 'express';
import {
  ingestDocument,
  ragQuery,
  listDocuments,
  getDocument,
  deleteDocument,
  hardDeleteDocument,
  getKnowledgeBaseStats,
} from '../controllers/ragController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Authenticated student routes ─────────────────────────────────────────────
router.post('/query', protect, ragQuery);

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.use(protect, requireAdmin);

router.post('/ingest', ingestDocument);
router.get('/documents', listDocuments);
router.get('/stats', getKnowledgeBaseStats);
router.get('/documents/:id', getDocument);
router.delete('/documents/:id/hard', hardDeleteDocument);
router.delete('/documents/:id', deleteDocument);

export default router;
