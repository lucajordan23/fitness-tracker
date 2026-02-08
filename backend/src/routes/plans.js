import express from 'express';
import {
  getCurrentPlans,
  createDietPlan,
  createWorkoutPlan,
  getPlansHistory,
  recalculateAdaptiveTDEE
} from '../controllers/planController.js';

const router = express.Router();

/**
 * Plans routes
 */

// GET /api/plans/current
router.get('/current', getCurrentPlans);

// GET /api/plans/history
router.get('/history', getPlansHistory);

// POST /api/plans/diet
router.post('/diet', createDietPlan);

// POST /api/plans/workout
router.post('/workout', createWorkoutPlan);

// POST /api/plans/diet/recalculate-tdee
router.post('/diet/recalculate-tdee', recalculateAdaptiveTDEE);

export default router;
