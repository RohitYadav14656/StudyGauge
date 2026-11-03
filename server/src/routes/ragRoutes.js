

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

router.post('/query', protect, ragQuery);

router.use(protect, requireAdmin);

router.post('/ingest', ingestDocument);
router.get('/documents', listDocuments);
router.get('/stats', getKnowledgeBaseStats);
router.get('/documents/:id', getDocument);
router.delete('/documents/:id/hard', hardDeleteDocument);
router.delete('/documents/:id', deleteDocument);

export default router;
