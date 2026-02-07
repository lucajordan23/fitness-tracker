import api from './api.js';

/**
 * GET /api/analysis/trends
 *
 * @param {number} days - Giorni da analizzare (7 o 14)
 * @returns {Promise} Response con analisi trend
 */
export async function getTrendAnalysis(days = 7) {
  const response = await api.get('/analysis/trends', {
    params: { days }
  });
  return response.data;
}

export default {
  getTrendAnalysis
};
