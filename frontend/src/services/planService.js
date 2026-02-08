import api from './api'

export const getCurrentPlans = async () => {
  const response = await api.get('/plans/current')
  return response.data
}

export const createDietPlan = async (data) => {
  const response = await api.post('/plans/diet', data)
  return response.data
}

export const createWorkoutPlan = async (data) => {
  const response = await api.post('/plans/workout', data)
  return response.data
}

export const getPlansHistory = async (type, limit = 10) => {
  const response = await api.get('/plans/history', { params: { type, limit } })
  return response.data
}

export const recalculateTDEE = async (userId = 1) => {
  const response = await api.post('/plans/diet/recalculate-tdee', { user_id: userId })
  return response.data
}
