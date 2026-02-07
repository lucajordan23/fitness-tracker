import express from 'express';
import measurementsRouter from './measurements.js';
import plansRouter from './plans.js';
import analysisRouter from './analysis.js';

const router = express.Router();

/**
 * API routes aggregator
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fitness Tracker API is running',
    timestamp: new Date().toISOString()
  });
});

// Measurements endpoints
router.use('/measurements', measurementsRouter);

// Plans endpoints
router.use('/plans', plansRouter);

// Analysis endpoints
router.use('/analysis', analysisRouter);

export default router;
