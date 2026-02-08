import api from './api'

/**
 * GET /api/calories/history
 * Ritorna storico calorie con dettaglio pasti
 */
export const getCalorieHistory = async (days = 30) => {
  const response = await api.get('/calories/history', {
    params: { days }
  })
  return response.data
}

/**
 * GET /api/calories/today
 * Ritorna calorie di oggi
 */
export const getTodayCalories = async () => {
  const response = await api.get('/calories/today')
  return response.data
}

/**
 * POST /api/calories/daily
 * Aggiorna calorie giornaliere
 */
export const updateDailyCalories = async (data) => {
  const response = await api.post('/calories/daily', data)
  return response.data
}
