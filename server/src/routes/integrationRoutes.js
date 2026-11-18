import express from 'express';
import {
  listIntegrations,
  handleConnectIntegration,
  handleDisconnectIntegration,
  handleSyncIntegration,
  handleConnectAllDemo,
  handleSyncAll,
} from '../controllers/integrationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', listIntegrations);
router.post('/demo/connect-all', handleConnectAllDemo);
router.post('/demo/sync-all', handleSyncAll);
router.post('/:provider/connect', handleConnectIntegration);
router.delete('/:provider', handleDisconnectIntegration);
router.post('/:provider/sync', handleSyncIntegration);

export default router;

