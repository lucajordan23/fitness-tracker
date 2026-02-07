import express from 'express';
import { getTrendAnalysis } from '../controllers/analysisController.js';

const router = express.Router();

/**
 * Analysis routes
 */

// GET /api/analysis/trends?days=7
router.get('/trends', getTrendAnalysis);

export default router;
