import express from 'express';
import {
  getCalorieHistory,
  updateDailyCalories,
  getTodayCalories
} from '../controllers/calorieController.js';

const router = express.Router();

/**
 * Calories tracking routes
 */

// GET /api/calories/history
router.get('/history', getCalorieHistory);

// GET /api/calories/today
router.get('/today', getTodayCalories);

// POST /api/calories/daily
router.post('/daily', updateDailyCalories);

export default router;
