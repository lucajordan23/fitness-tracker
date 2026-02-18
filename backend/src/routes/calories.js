import express from 'express';
import {
  getCalorieHistory,
  updateDailyCalories,
  getTodayCalories,
  getSmartAverage
} from '../controllers/calorieController.js';

const router = express.Router();

/**
 * Calories tracking routes
 */

// GET /api/calories/history
router.get('/history', getCalorieHistory);

// GET /api/calories/today
router.get('/today', getTodayCalories);

// GET /api/calories/smart-average
router.get('/smart-average', getSmartAverage);

// POST /api/calories/daily
router.post('/daily', updateDailyCalories);

export default router;
