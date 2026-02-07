import { Measurement, User } from '../models/index.js';
import { Op } from 'sequelize';
import { average, round, percentChange } from '../utils/mathHelpers.js';
import { daysAgo } from '../utils/dateHelpers.js';

/**
 * POST /api/measurements
 * Crea nuova misurazione
 */
export async function createMeasurement(req, res) {
  try {
    const {
      user_id,
      data_misurazione,
      peso,
      body_fat_percent,
      massa_magra,
      massa_muscolare,
      bmi,
      bmr,
      grasso_viscerale,
      acqua_percent,
      massa_ossea,
      calorie_consumate,
      proteine_consumate,
      carboidrati_consumati,
      grassi_consumati,
      energia_livello,
      sonno_ore,
      stress_livello,
      note
    } = req.body;

    // Calcola massa grassa da peso e BF% se non fornita
    const massaGrassa = peso && body_fat_percent
      ? round(peso * (body_fat_percent / 100), 1)
      : null;

    const measurement = await Measurement.create({
      user_id: user_id || 1, // Default user ID 1 per MVP
      data_misurazione: data_misurazione || new Date(),
      peso,
      body_fat_percent,
      massa_magra,
      massa_muscolare,
      massa_grassa: massaGrassa,
      bmi,
      bmr,
      grasso_viscerale,
      acqua_percent,
      massa_ossea,
      calorie_consumate,
      proteine_consumate,
      carboidrati_consumati,
      grassi_consumati,
      energia_livello,
      sonno_ore,
      stress_livello,
      note
    });

    res.status(201).json({
      success: true,
      data: measurement
    });
  } catch (error) {
    console.error('Error creating measurement:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/measurements
 * Lista misurazioni con filtri opzionali
 */
export async function getMeasurements(req, res) {
  try {
    const {
      user_id = 1,
      from,
      to,
      limit = 30
    } = req.query;

    const where = { user_id };

    // Filtro date
    if (from || to) {
      where.data_misurazione = {};
      if (from) where.data_misurazione[Op.gte] = new Date(from);
      if (to) where.data_misurazione[Op.lte] = new Date(to);
    }

    const measurements = await Measurement.findAll({
      where,
      order: [['data_misurazione', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: measurements,
      count: measurements.length
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/measurements/:id
 * Singola misurazione
 */
export async function getMeasurementById(req, res) {
  try {
    const { id } = req.params;

    const measurement = await Measurement.findByPk(id);

    if (!measurement) {
      return res.status(404).json({
        success: false,
        error: 'Misurazione non trovata'
      });
    }

    res.json({
      success: true,
      data: measurement
    });
  } catch (error) {
    console.error('Error fetching measurement:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/measurements/stats
 * Statistiche aggregate
 */
export async function getMeasurementStats(req, res) {
  try {
    const {
      user_id = 1,
      days = 30
    } = req.query;

    const dateFrom = daysAgo(parseInt(days));

    const measurements = await Measurement.findAll({
      where: {
        user_id,
        data_misurazione: {
          [Op.gte]: dateFrom
        }
      },
      order: [['data_misurazione', 'DESC']]
    });

    if (measurements.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'Nessuna misurazione trovata nel periodo'
        }
      });
    }

    // Calcola medie
    const avgPeso = average(measurements.map(m => m.peso));
    const avgBF = average(measurements.map(m => m.body_fat_percent).filter(Boolean));
    const avgBMR = average(measurements.map(m => m.bmr).filter(Boolean));
    const avgMassaMagra = average(measurements.map(m => m.massa_magra).filter(Boolean));
    const avgMassaGrassa = average(measurements.map(m => m.massa_grassa).filter(Boolean));

    // Calcola deltas (ultima vs prima misurazione nel periodo)
    const latest = measurements[0];
    const oldest = measurements[measurements.length - 1];

    const deltaPeso = latest.peso - oldest.peso;
    const deltaBF = (latest.body_fat_percent || 0) - (oldest.body_fat_percent || 0);
    const deltaMassaMagra = (latest.massa_magra || 0) - (oldest.massa_magra || 0);
    const deltaMassaGrassa = (latest.massa_grassa || 0) - (oldest.massa_grassa || 0);
    const deltaBMR = (latest.bmr || 0) - (oldest.bmr || 0);

    // Determina trend
    const pesoTrend = deltaPeso > 0.2 ? 'up' : deltaPeso < -0.2 ? 'down' : 'stable';

    res.json({
      success: true,
      data: {
        period_days: parseInt(days),
        measurements_count: measurements.length,
        latest: {
          data: latest.data_misurazione,
          peso: latest.peso,
          body_fat_percent: latest.body_fat_percent,
          massa_magra: latest.massa_magra,
          bmr: latest.bmr
        },
        averages: {
          peso: round(avgPeso, 1),
          body_fat_percent: round(avgBF, 1),
          massa_magra: round(avgMassaMagra, 1),
          massa_grassa: round(avgMassaGrassa, 1),
          bmr: Math.round(avgBMR)
        },
        deltas: {
          peso: round(deltaPeso, 1),
          body_fat_percent: round(deltaBF, 1),
          massa_magra: round(deltaMassaMagra, 1),
          massa_grassa: round(deltaMassaGrassa, 1),
          bmr: Math.round(deltaBMR)
        },
        trend: pesoTrend
      }
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * DELETE /api/measurements/:id
 * Elimina misurazione
 */
export async function deleteMeasurement(req, res) {
  try {
    const { id } = req.params;

    const measurement = await Measurement.findByPk(id);

    if (!measurement) {
      return res.status(404).json({
        success: false,
        error: 'Misurazione non trovata'
      });
    }

    await measurement.destroy();

    res.json({
      success: true,
      message: 'Misurazione eliminata con successo'
    });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export default {
  createMeasurement,
  getMeasurements,
  getMeasurementById,
  getMeasurementStats,
  deleteMeasurement
};
