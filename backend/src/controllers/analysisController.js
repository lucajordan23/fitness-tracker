import { Measurement, User, DietPlan } from '../models/index.js';
import { analyzeComplete } from '../services/TrendAnalyzer.js';

/**
 * GET /api/analysis/trends
 * Analizza trend ultimi 7-14 giorni con raccomandazioni
 *
 * Query params:
 * - user_id: ID utente (default: 1)
 * - days: Periodo analisi in giorni (default: 7)
 */
export async function getTrendAnalysis(req, res) {
  try {
    const {
      user_id = 1,
      days = 7
    } = req.query;

    // Fetch measurements (DESC = più recenti prima)
    const measurements = await Measurement.findAll({
      where: { user_id },
      order: [['data_misurazione', 'DESC']],
      limit: parseInt(days) + 5  // Get extra per calcoli più accurati
    });

    if (measurements.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nessuna misurazione trovata'
      });
    }

    // Fetch user obiettivo
    const user = await User.findByPk(user_id);
    const obiettivo = user?.obiettivo || 'ricomposizione';

    // Fetch piano dieta attivo (opzionale)
    const currentPlan = await DietPlan.findOne({
      where: {
        user_id,
        is_active: true
      }
    });

    // Run analysis
    const analysis = analyzeComplete(
      measurements,
      obiettivo,
      currentPlan,
      parseInt(days)
    );

    res.json({
      success: true,
      data: analysis,
      metadata: {
        user_id,
        objective: obiettivo,
        measurements_count: measurements.length,
        analysis_period_days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Error analyzing trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export default {
  getTrendAnalysis
};
