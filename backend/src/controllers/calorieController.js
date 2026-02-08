import { Measurement } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * GET /api/calories/history
 * Ritorna storico calorie giornaliere con dettaglio pasti
 * Query params: days (default 30), user_id (default 1)
 */
export async function getCalorieHistory(req, res) {
  try {
    const { days = 30, user_id = 1 } = req.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    const measurements = await Measurement.findAll({
      where: {
        user_id,
        data_misurazione: { [Op.gte]: dateFrom },
        [Op.or]: [
          { calorie_consumate: { [Op.gt]: 0 } },
          { colazione_kcal: { [Op.gt]: 0 } },
          { pranzo_kcal: { [Op.gt]: 0 } },
          { cena_kcal: { [Op.gt]: 0 } }
        ]
      },
      attributes: [
        'id',
        'data_misurazione',
        'calorie_consumate',
        'colazione_kcal',
        'pranzo_kcal',
        'cena_kcal',
        'spuntini_kcal',
        'proteine_consumate',
        'carboidrati_consumati',
        'grassi_consumati'
      ],
      order: [['data_misurazione', 'DESC']]
    });

    // Formatta dati per frontend
    const formattedData = measurements.map(m => {
      const colazione = m.colazione_kcal || 0;
      const pranzo = m.pranzo_kcal || 0;
      const cena = m.cena_kcal || 0;
      const spuntini = m.spuntini_kcal || 0;
      const totaleCalcolato = colazione + pranzo + cena + spuntini;

      return {
        id: m.id,
        data: m.data_misurazione,
        calorie_totali: m.calorie_consumate || totaleCalcolato,
        colazione: colazione,
        pranzo: pranzo,
        cena: cena,
        spuntini: spuntini,
        proteine: m.proteine_consumate,
        carboidrati: m.carboidrati_consumati,
        grassi: m.grassi_consumati,
        has_meal_breakdown: colazione > 0 || pranzo > 0 || cena > 0
      };
    });

    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length
    });
  } catch (error) {
    console.error('Error fetching calorie history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/calories/daily
 * Aggiorna calorie giornaliere (crea o aggiorna misurazione esistente)
 * Body: { user_id, data, colazione, pranzo, cena, spuntini }
 */
export async function updateDailyCalories(req, res) {
  try {
    const {
      user_id = 1,
      data,
      colazione,
      pranzo,
      cena,
      spuntini
    } = req.body;

    // Valida input
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data richiesta'
      });
    }

    if (!colazione && !pranzo && !cena && !spuntini) {
      return res.status(400).json({
        success: false,
        error: 'Almeno un pasto deve essere specificato'
      });
    }

    const targetDate = new Date(data);
    targetDate.setHours(0, 0, 0, 0);

    // Calcola totale
    const totaleCalorie = (colazione || 0) + (pranzo || 0) + (cena || 0) + (spuntini || 0);

    // Cerca misurazione esistente per questa data
    const [measurement, created] = await Measurement.findOrCreate({
      where: {
        user_id,
        data_misurazione: targetDate
      },
      defaults: {
        user_id,
        data_misurazione: targetDate,
        peso: 0, // Placeholder, sarà aggiornato da misurazione bilancia
        calorie_consumate: totaleCalorie,
        colazione_kcal: colazione || null,
        pranzo_kcal: pranzo || null,
        cena_kcal: cena || null,
        spuntini_kcal: spuntini || null
      }
    });

    // Se esiste, aggiorna solo i campi calorie
    if (!created) {
      await measurement.update({
        calorie_consumate: totaleCalorie,
        colazione_kcal: colazione || measurement.colazione_kcal,
        pranzo_kcal: pranzo || measurement.pranzo_kcal,
        cena_kcal: cena || measurement.cena_kcal,
        spuntini_kcal: spuntini || measurement.spuntini_kcal
      });
    }

    res.json({
      success: true,
      data: {
        id: measurement.id,
        data: measurement.data_misurazione,
        calorie_totali: totaleCalorie,
        colazione: measurement.colazione_kcal,
        pranzo: measurement.pranzo_kcal,
        cena: measurement.cena_kcal,
        spuntini: measurement.spuntini_kcal,
        created: created
      },
      message: created ? 'Calorie registrate' : 'Calorie aggiornate'
    });
  } catch (error) {
    console.error('Error updating daily calories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/calories/today
 * Ritorna calorie di oggi (per quick entry)
 */
export async function getTodayCalories(req, res) {
  try {
    const { user_id = 1 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const measurement = await Measurement.findOne({
      where: {
        user_id,
        data_misurazione: today
      },
      attributes: [
        'id',
        'calorie_consumate',
        'colazione_kcal',
        'pranzo_kcal',
        'cena_kcal',
        'spuntini_kcal'
      ]
    });

    if (!measurement) {
      return res.json({
        success: true,
        data: {
          colazione: 0,
          pranzo: 0,
          cena: 0,
          spuntini: 0,
          totale: 0
        }
      });
    }

    const totale = (measurement.colazione_kcal || 0) +
                   (measurement.pranzo_kcal || 0) +
                   (measurement.cena_kcal || 0) +
                   (measurement.spuntini_kcal || 0);

    res.json({
      success: true,
      data: {
        id: measurement.id,
        colazione: measurement.colazione_kcal || 0,
        pranzo: measurement.pranzo_kcal || 0,
        cena: measurement.cena_kcal || 0,
        spuntini: measurement.spuntini_kcal || 0,
        totale: totale || measurement.calorie_consumate || 0
      }
    });
  } catch (error) {
    console.error('Error fetching today calories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export default {
  getCalorieHistory,
  updateDailyCalories,
  getTodayCalories
};
