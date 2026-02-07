import api from './api'

export const getMeasurements = async (params = {}) => {
  const response = await api.get('/measurements', { params })
  return response.data
}

export const createMeasurement = async (data) => {
  const response = await api.post('/measurements', data)
  return response.data
}

export const getMeasurementStats = async (days = 30) => {
  const response = await api.get('/measurements/stats', { params: { days } })
  return response.data
}

export const deleteMeasurement = async (id) => {
  const response = await api.delete(`/measurements/${id}`)
  return response.data
}
