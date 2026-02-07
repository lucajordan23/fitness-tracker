import express from 'express';
import {
  getCurrentPlans,
  createDietPlan,
  createWorkoutPlan,
  getPlansHistory
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

export default router;
