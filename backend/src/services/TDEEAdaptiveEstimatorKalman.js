/**
 * 🔥 TDEE ADAPTIVE ESTIMATOR con KALMAN FILTER
 *
 * Sostituisce exponential smoothing con Kalman Filter ottimale
 * per stima dinamica del metabolismo reale.
 *
 * IMPORTANTE: Questo file SOSTITUISCE TDEEAdaptiveEstimator.js
 * La logica è identica ma usa Kalman invece di α-smoothing.
 */

import { Measurement } from '../models/index.js';
import { Op } from 'sequelize';
import { reverseTDEE } from './CalorieCalculator.js';
import {
  updateMetabolismKalman,
  initializeKalmanState,
  getConfidenceInterval,
  isConverged,
  KALMAN_CONFIG
} from './KalmanTDEEEstimator.js';

// ==================== CONFIGURAZIONE ====================

const CONFIG = {
  MIN_MEASUREMENTS_WITH_CALORIES: 10,
  ADAPTIVE_WINDOW_DAYS: 14,
  MIN_DAYS_BETWEEN_UPDATES: 7,
  SIGNIFICANT_CHANGE_PERCENT: 5,
  MIN_TDEE_MULTIPLIER: 1.2
};

// ==================== CORE FUNCTIONS ====================

/**
 * Fetch misurazioni con calorie per finestra temporale
 */
async function fetchMeasurementsWithCalories(userId, days) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const measurements = await Measurement.findAll({
    where: {
      user_id: userId,
      data_misurazione: { [Op.gte]: dateFrom },
      calorie_consumate: { [Op.gt]: 0 }
    },
    attributes: [
      'id',
      'data_misurazione',
      'peso',
      'calorie_consumate',
      'colazione_kcal',
      'pranzo_kcal',
      'cena_kcal',
      'spuntini_kcal'
    ],
    order: [['data_misurazione', 'DESC']]
  });

  return measurements;
}

/**
 * Calcola TDEE adattivo per un piano usando KALMAN FILTER
 *
 * DIFFERENZA vs versione precedente:
 * - OLD: usa exponential smoothing (α=0.75 fisso)
 * - NEW: usa Kalman Filter (gain auto-adattivo)
 *
 * @param {Object} dietPlan - Piano dieta corrente
 * @param {number} userId - ID utente
 * @returns {Object} Risultato calcolo con metadata Kalman
 */
export async function calculateAdaptiveTDEE(dietPlan, userId) {
  // ===== STEP 1: FETCH DATI =====

  const measurements = await fetchMeasurementsWithCalories(
    userId,
    CONFIG.ADAPTIVE_WINDOW_DAYS
  );

  if (measurements.length < CONFIG.MIN_MEASUREMENTS_WITH_CALORIES) {
    return {
      canActivate: false,
      reason: 'insufficient_data',
      message: `Servono almeno ${CONFIG.MIN_MEASUREMENTS_WITH_CALORIES} giorni con calorie tracciate`
    };
  }

  // ===== STEP 2: CALCOLA TDEE REALE (Reverse TDEE) =====

  const tdeeRaw = reverseTDEE(measurements);
  if (!tdeeRaw) {
    return {
      canActivate: false,
      reason: 'calculation_failed',
      message: 'Impossibile calcolare TDEE da dati disponibili'
    };
  }

  // ===== STEP 3: APPLICA KALMAN FILTER =====

  let tdeeAdaptive, variance, kalmanGain, confidenceInterval;

  if (dietPlan.tdee_adaptive_enabled && dietPlan.kalman_variance) {
    // *** UPDATE ESISTENTE: usa stato Kalman precedente ***

    // Prendi ultima misurazione per calcolo incrementale
    const latest = measurements[0]; // Più recente
    const previous = measurements[1]; // Giorno precedente

    if (!previous) {
      // Fallback se manca dato precedente: usa reverse TDEE diretto
      tdeeAdaptive = tdeeRaw;
      variance = dietPlan.kalman_variance;
      kalmanGain = 0;
    } else {
      // Kalman update incrementale
      const kalmanResult = updateMetabolismKalman({
        previousTDEE: dietPlan.tdee_adaptive,
        previousVariance: dietPlan.kalman_variance,
        weightToday: latest.peso,
        weightYesterday: previous.peso,
        caloriesToday: latest.calorie_consumate
      });

      if (!kalmanResult) {
        // Update non valido, mantieni stato precedente
        return {
          canActivate: true,
          updated: false,
          reason: 'invalid_kalman_update',
          message: 'Dati non validi per update Kalman (fluttuazione eccessiva o anomalia)'
        };
      }

      tdeeAdaptive = kalmanResult.tdee;
      variance = kalmanResult.variance;
      kalmanGain = kalmanResult.kalmanGain;
    }
  } else {
    // *** PRIMA ATTIVAZIONE: inizializza stato Kalman ***

    // Usa TDEE stimato come prior iniziale
    const initialState = initializeKalmanState(dietPlan.tdee_stimato);

    // Prima iterazione: blend tra stimato e reverse TDEE
    // Simula un update Kalman partendo da P0 alta
    const firstUpdate = updateMetabolismKalman({
      previousTDEE: initialState.tdee,
      previousVariance: initialState.variance,
      weightToday: measurements[0].peso,
      weightYesterday: measurements[1]?.peso || measurements[0].peso,
      caloriesToday: measurements[0].calorie_consumate
    });

    if (!firstUpdate) {
      // Fallback: usa media tra stimato e reverse TDEE
      tdeeAdaptive = Math.round((dietPlan.tdee_stimato + tdeeRaw) / 2);
      variance = KALMAN_CONFIG.P0;
      kalmanGain = 0.5;
    } else {
      tdeeAdaptive = firstUpdate.tdee;
      variance = firstUpdate.variance;
      kalmanGain = firstUpdate.kalmanGain;
    }
  }

  // ===== STEP 4: SAFETY CHECK =====

  const tdeeMinimum = Math.round(dietPlan.bmr_base * CONFIG.MIN_TDEE_MULTIPLIER);
  tdeeAdaptive = Math.max(tdeeAdaptive, tdeeMinimum);

  // ===== STEP 5: CALCOLA CAMBIO PERCENTUALE =====

  const currentTDEE = dietPlan.tdee_adaptive_enabled
    ? dietPlan.tdee_adaptive
    : dietPlan.tdee_stimato;

  const changePercent = ((tdeeAdaptive - currentTDEE) / currentTDEE) * 100;

  // ===== STEP 6: DIAGNOSTICS =====

  confidenceInterval = getConfidenceInterval(tdeeAdaptive, variance);
  const converged = isConverged(variance);

  // ===== RETURN =====

  return {
    canActivate: true,
    tdeeAdaptive,
    tdeeRaw,
    kalmanVariance: variance,
    kalmanGain,
    changePercent: Math.round(changePercent * 10) / 10,
    confidenceInterval,
    converged,
    metadata: {
      measurementsUsed: measurements.length,
      algorithm: 'kalman_filter',
      confidenceStd: confidenceInterval.std,
      Q: KALMAN_CONFIG.Q,
      R: KALMAN_CONFIG.R
    }
  };
}

/**
 * Determina se serve aggiornare piano
 *
 * IDENTICO alla versione precedente
 */
export function shouldUpdatePlan(dietPlan, adaptiveResult) {
  if (!adaptiveResult.canActivate) return false;

  // Prima attivazione: sempre attiva
  if (!dietPlan.tdee_adaptive_enabled) return true;

  // Verifica tempo minimo tra aggiornamenti
  if (dietPlan.tdee_adaptive_last_update) {
    const daysSince = Math.floor(
      (new Date() - new Date(dietPlan.tdee_adaptive_last_update)) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < CONFIG.MIN_DAYS_BETWEEN_UPDATES) {
      return false;
    }
  }

  // Verifica cambio significativo
  return Math.abs(adaptiveResult.changePercent) >= CONFIG.SIGNIFICANT_CHANGE_PERCENT;
}

/**
 * Aggiorna piano con TDEE adattivo Kalman
 *
 * MODIFICATO: salva anche kalman_variance e kalman_gain
 */
export async function updatePlanWithAdaptiveTDEE(dietPlan, adaptiveResult) {
  const { tdeeAdaptive, tdeeRaw, kalmanVariance, kalmanGain, confidenceInterval } = adaptiveResult;

  // ===== RICALCOLA CALORIE TARGET =====

  // Preserva percentuale deficit/surplus originale
  const deficitPercent = dietPlan.deficit_percent || 0;
  const newTargetCalories = Math.round(
    tdeeAdaptive * (1 + deficitPercent / 100)
  );

  // Safety: minimo BMR × 1.2
  const minimum = Math.round(dietPlan.bmr_base * 1.2);
  const finalCalories = Math.max(newTargetCalories, minimum);

  // ===== RICALCOLA MACROS =====

  // Importa calculateMacros (assumiamo sia disponibile)
  const { calculateMacros } = await import('./CalorieCalculator.js');

  const latestMeasurement = await Measurement.findOne({
    where: { user_id: dietPlan.user_id },
    order: [['data_misurazione', 'DESC']],
    attributes: ['peso', 'massa_magra']
  });

  const peso = latestMeasurement?.peso || 70;
  const massaMagra = latestMeasurement?.massa_magra || null;

  const newMacros = calculateMacros(
    finalCalories,
    peso,
    massaMagra,
    dietPlan.obiettivo
  );

  // ===== AGGIORNA PIANO =====

  const oldValues = {
    tdee_adaptive: dietPlan.tdee_adaptive,
    tdee_reale: dietPlan.tdee_reale,
    calorie_target: dietPlan.calorie_target,
    proteine_g: dietPlan.proteine_g,
    carboidrati_g: dietPlan.carboidrati_g,
    grassi_g: dietPlan.grassi_g
  };

  await dietPlan.update({
    // TDEE fields
    tdee_adaptive_enabled: true,
    tdee_adaptive: tdeeAdaptive,
    tdee_reale: tdeeRaw,

    // *** NUOVI CAMPI KALMAN ***
    kalman_variance: kalmanVariance,
    kalman_gain: kalmanGain,
    kalman_confidence_lower: confidenceInterval.lower,
    kalman_confidence_upper: confidenceInterval.upper,

    // Timestamps
    tdee_adaptive_last_update: new Date(),
    tdee_adaptive_update_count: (dietPlan.tdee_adaptive_update_count || 0) + 1,

    // Calorie e macros
    calorie_target: finalCalories,
    proteine_g: newMacros.proteine,
    carboidrati_g: newMacros.carboidrati,
    grassi_g: newMacros.grassi
  });

  // ===== RETURN CHANGES =====

  return {
    success: true,
    changes: {
      tdee_old: oldValues.tdee_adaptive || dietPlan.tdee_stimato,
      tdee_new: tdeeAdaptive,
      tdee_raw: tdeeRaw,
      tdee_change_percent: adaptiveResult.changePercent,

      calories_old: oldValues.calorie_target,
      calories_new: finalCalories,

      macros_old: {
        proteine: oldValues.proteine_g,
        carboidrati: oldValues.carboidrati_g,
        grassi: oldValues.grassi_g
      },
      macros_new: {
        proteine: newMacros.proteine,
        carboidrati: newMacros.carboidrati,
        grassi: newMacros.grassi
      },

      // Kalman diagnostics
      kalman: {
        variance: kalmanVariance,
        gain: kalmanGain,
        confidence: confidenceInterval,
        converged: adaptiveResult.converged
      }
    }
  };
}

// ==================== LOGGING ====================

/**
 * Log aggiornamento TDEE (opzionale, per tracciamento storico)
 *
 * NOTA: Questa funzione salverebbe in un model TDEEUpdateLog se esistesse.
 * Per ora fa solo console.log. Implementazione futura: salvare in database.
 *
 * @param {Object} dietPlan - Piano dieta
 * @param {Object} adaptiveResult - Risultato calculateAdaptiveTDEE
 * @param {boolean} updated - Se il piano è stato aggiornato
 * @param {string} failureReason - Motivo fallimento (se !updated)
 */
export async function logTDEEUpdate(dietPlan, adaptiveResult, updated, failureReason = null) {
  try {
    const previousTDEE = dietPlan.tdee_adaptive_enabled && dietPlan.tdee_adaptive
      ? dietPlan.tdee_adaptive
      : null;

    const logData = {
      user_id: dietPlan.user_id,
      diet_plan_id: dietPlan.id,
      timestamp: new Date(),
      tdee_adaptive_previous: previousTDEE,
      tdee_real_calculated: adaptiveResult.tdeeRaw || null,
      tdee_adaptive_new: updated ? adaptiveResult.tdeeAdaptive : null,
      measurements_count: adaptiveResult.metadata?.measurementsUsed || 0,
      change_percent: adaptiveResult.changePercent || null,
      updated: updated,
      failure_reason: failureReason,

      // *** KALMAN SPECIFIC FIELDS ***
      kalman_variance: adaptiveResult.kalmanVariance || null,
      kalman_gain: adaptiveResult.kalmanGain || null,
      kalman_confidence_lower: adaptiveResult.confidenceInterval?.lower || null,
      kalman_confidence_upper: adaptiveResult.confidenceInterval?.upper || null,
      converged: adaptiveResult.converged || false
    };

    // TODO: Salvare in TDEEUpdateLog model se esiste
    // await TDEEUpdateLog.create(logData);

    // Per ora: solo console log
    console.log(
      `📝 [Kalman] TDEE Update: ${updated ? '✅ AGGIORNATO' : `❌ NON aggiornato (${failureReason})`}`,
      updated ? `${previousTDEE || dietPlan.tdee_stimato} → ${adaptiveResult.tdeeAdaptive} kcal` : ''
    );

    if (updated && adaptiveResult.kalmanGain !== undefined) {
      console.log(
        `   Kalman Gain: ${adaptiveResult.kalmanGain.toFixed(3)}, ` +
        `Variance: ${Math.round(Math.sqrt(adaptiveResult.kalmanVariance))} kcal std, ` +
        `Converged: ${adaptiveResult.converged ? 'YES ✓' : 'NO'}`
      );
    }
  } catch (error) {
    console.error('❌ Errore log TDEE:', error);
    // Non bloccare il flusso principale se logging fallisce
  }
}

// ==================== HELPER MESSAGES ====================

export function getAdaptiveErrorMessage(adaptiveResult) {
  switch (adaptiveResult.reason) {
    case 'insufficient_data':
      return `Traccia calorie per almeno ${CONFIG.MIN_MEASUREMENTS_WITH_CALORIES} giorni`;
    case 'calculation_failed':
      return 'Dati insufficienti per calcolare TDEE reale';
    case 'invalid_kalman_update':
      return 'Fluttuazione peso eccessiva, aggiornamento ignorato';
    default:
      return 'Impossibile attivare TDEE adattivo';
  }
}

// ==================== EXPORT ====================

export default {
  calculateAdaptiveTDEE,
  shouldUpdatePlan,
  updatePlanWithAdaptiveTDEE,
  logTDEEUpdate,
  getAdaptiveErrorMessage,
  CONFIG
};
