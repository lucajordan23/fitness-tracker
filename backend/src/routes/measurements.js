import express from 'express';
import {
  createMeasurement,
  getMeasurements,
  getMeasurementById,
  getMeasurementStats,
  deleteMeasurement
} from '../controllers/measurementController.js';

const router = express.Router();

/**
 * Measurements routes
 */

// GET /api/measurements/stats - DEVE venire PRIMA di /:id
router.get('/stats', getMeasurementStats);

// POST /api/measurements
router.post('/', createMeasurement);

// GET /api/measurements
router.get('/', getMeasurements);

// GET /api/measurements/:id
router.get('/:id', getMeasurementById);

// DELETE /api/measurements/:id
router.delete('/:id', deleteMeasurement);

export default router;
