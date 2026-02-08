import { reverseTDEE, calculateMacros } from './CalorieCalculator.js';
import { Measurement, TDEEUpdateLog } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * TDEEAdaptiveEstimator
 *
 * Servizio per calcolare e aggiornare il TDEE adattivo basato su dati reali
 * di peso e calorie consumate dall'utente.
 *
 * Usa smoothing esponenziale per convergenza graduale:
 * TDEE_adattivo = α × TDEE_precedente + (1 - α) × TDEE_reale
 */

// Configurazione parametri
export const CONFIG = {
  MIN_MEASUREMENTS_WITH_CALORIES: 10,  // Minimo misurazioni richieste
  ADAPTIVE_WINDOW_DAYS: 14,           // Finestra dati (giorni)
  MIN_DAYS_BETWEEN_UPDATES: 7,        // Minimo giorni tra aggiornamenti
  SIGNIFICANT_CHANGE_PERCENT: 5,      // % cambio minimo per trigger update
  MIN_TDEE_MULTIPLIER: 1.2,           // TDEE minimo = BMR × 1.2
  DEFAULT_ALPHA: 0.75,                // Coefficiente smoothing (75% vecchio, 25% nuovo)
  MIN_DELTA_PESO_KG: 0.15             // Soglia minima delta peso (kg) per evitare rumore
};

/**
 * Calcola TDEE adattivo per un piano dieta
 *
 * @param {Object} dietPlan - Piano dieta attivo
 * @param {number} userId - ID utente
 * @returns {Object} { canActivate, tdeeAdaptive, tdeeRaw, changePercent, metadata }
 */
export async function calculateAdaptiveTDEE(dietPlan, userId) {
  // 1. Fetch misurazioni ultimi N giorni con calorie tracciate
  const measurements = await fetchMeasurementsWithCalories(
    userId,
    CONFIG.ADAPTIVE_WINDOW_DAYS
  );

  // 2. Verifica requisiti minimi
  if (measurements.length < CONFIG.MIN_MEASUREMENTS_WITH_CALORIES) {
    return {
      canActivate: false,
      reason: 'insufficient_data',
      required: CONFIG.MIN_MEASUREMENTS_WITH_CALORIES,
      current: measurements.length,
      metadata: { measurementsUsed: measurements.length }
    };
  }

  // 2.5. Calcola delta peso per verifica soglia minima
  const last14 = measurements.slice(0, 14);
  const average = (arr) => arr.reduce((sum, v) => sum + v, 0) / arr.length;

  const pesoInizio = average(last14.slice(-3).map(m => m.peso));
  const pesoFine = average(last14.slice(0, 3).map(m => m.peso));
  const deltaPeso = pesoFine - pesoInizio;
  const deltaPesoAbs = Math.abs(deltaPeso);

  // 2.6. Verifica soglia minima delta peso (evita rumore)
  if (deltaPesoAbs < CONFIG.MIN_DELTA_PESO_KG) {
    console.log(`⏸️ Delta peso ${deltaPesoAbs.toFixed(3)}kg < soglia ${CONFIG.MIN_DELTA_PESO_KG}kg, aggiornamento saltato`);
    return {
      canActivate: false,
      reason: 'delta_peso_insufficient',
      deltaPeso: Math.round(deltaPeso * 1000) / 1000,
      threshold: CONFIG.MIN_DELTA_PESO_KG,
      message: `Delta peso (${deltaPesoAbs.toFixed(2)}kg) sotto soglia minima (${CONFIG.MIN_DELTA_PESO_KG}kg). Variazione troppo piccola per essere significativa.`,
      metadata: {
        measurementsUsed: measurements.length,
        deltaPesoKg: Math.round(deltaPeso * 1000) / 1000,
        pesoInizio: Math.round(pesoInizio * 10) / 10,
        pesoFine: Math.round(pesoFine * 10) / 10
      }
    };
  }

  // 3. Calcola TDEE reale usando reverseTDEE() esistente
  const tdeeRaw = reverseTDEE(measurements);

  if (!tdeeRaw || tdeeRaw === 0) {
    return {
      canActivate: false,
      reason: 'calculation_failed',
      message: 'Impossibile calcolare TDEE reale dai dati disponibili'
    };
  }

  // 4. Applica smoothing esponenziale
  const alpha = dietPlan.tdee_adaptive_alpha || CONFIG.DEFAULT_ALPHA;
  let tdeeAdaptive;

  if (dietPlan.tdee_adaptive_enabled && dietPlan.tdee_adaptive) {
    // Aggiornamento progressivo: mix vecchio TDEE + nuovo
    tdeeAdaptive = Math.round(
      alpha * dietPlan.tdee_adaptive + (1 - alpha) * tdeeRaw
    );
  } else {
    // Prima attivazione: usa TDEE stimato come base
    tdeeAdaptive = Math.round(
      alpha * dietPlan.tdee_stimato + (1 - alpha) * tdeeRaw
    );
  }

  // 5. Safety check: TDEE minimo = BMR × 1.2
  const tdeeMinimum = Math.round(dietPlan.bmr_base * CONFIG.MIN_TDEE_MULTIPLIER);
  const wasAdjusted = tdeeAdaptive < tdeeMinimum;

  if (wasAdjusted) {
    console.warn(`⚠️ TDEE adattivo ${tdeeAdaptive} sotto minimo ${tdeeMinimum}, applicato safety limit`);
    tdeeAdaptive = tdeeMinimum;
  }

  // 6. Calcola cambio percentuale
  const currentTDEE = dietPlan.tdee_adaptive_enabled && dietPlan.tdee_adaptive
    ? dietPlan.tdee_adaptive
    : dietPlan.tdee_stimato;

  const changePercent = ((tdeeAdaptive - currentTDEE) / currentTDEE) * 100;

  return {
    canActivate: true,
    tdeeAdaptive,
    tdeeRaw,
    changePercent: Math.round(changePercent * 10) / 10,
    metadata: {
      measurementsUsed: measurements.length,
      alpha,
      previousTDEE: currentTDEE,
      tdeeMinimum,
      wasAdjusted,
      deltaPesoKg: Math.round(deltaPeso * 1000) / 1000,
      pesoInizio: Math.round(pesoInizio * 10) / 10,
      pesoFine: Math.round(pesoFine * 10) / 10
    }
  };
}

/**
 * Salva log interno tentativo aggiornamento TDEE
 *
 * @param {Object} dietPlan - Piano dieta
 * @param {Object} adaptiveResult - Risultato calcolo TDEE
 * @param {boolean} updated - Se il piano è stato aggiornato
 * @param {string} failureReason - Motivo interruzione (se non aggiornato)
 * @returns {Promise<TDEEUpdateLog>}
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
      delta_peso_kg: adaptiveResult.metadata?.deltaPesoKg || null,
      delta_giorni: CONFIG.ADAPTIVE_WINDOW_DAYS,
      measurements_count: adaptiveResult.metadata?.measurementsUsed || adaptiveResult.current || 0,
      change_percent: adaptiveResult.changePercent || null,
      updated: updated,
      failure_reason: failureReason,
      alpha_smoothing: adaptiveResult.metadata?.alpha || CONFIG.DEFAULT_ALPHA
    };

    await TDEEUpdateLog.create(logData);

    console.log(`📝 Log TDEE salvato: ${updated ? 'AGGIORNATO' : `NON aggiornato (${failureReason})`}`);
  } catch (error) {
    console.error('❌ Errore salvataggio log TDEE:', error);
    // Non bloccare il flusso principale se logging fallisce
  }
}

/**
 * Determina se il piano deve essere aggiornato con nuovo TDEE
 *
 * @param {Object} dietPlan - Piano dieta attivo
 * @param {Object} adaptiveResult - Risultato da calculateAdaptiveTDEE()
 * @returns {boolean} True se serve aggiornare
 */
export function shouldUpdatePlan(dietPlan, adaptiveResult) {
  if (!adaptiveResult.canActivate) {
    return false;
  }

  // Prima attivazione: sempre attiva
  if (!dietPlan.tdee_adaptive_enabled) {
    console.log('✅ Prima attivazione TDEE adattivo');
    return true;
  }

  // Verifica tempo minimo tra aggiornamenti (7 giorni)
  if (dietPlan.tdee_adaptive_last_update) {
    const daysSince = daysBetween(
      new Date(dietPlan.tdee_adaptive_last_update),
      new Date()
    );

    if (daysSince < CONFIG.MIN_DAYS_BETWEEN_UPDATES) {
      console.log(`⏳ Ultimo update ${daysSince} giorni fa, servono almeno ${CONFIG.MIN_DAYS_BETWEEN_UPDATES}`);
      return false;
    }
  }

  // Verifica cambio significativo (>= 5%)
  const changePercent = Math.abs(adaptiveResult.changePercent);

  if (changePercent < CONFIG.SIGNIFICANT_CHANGE_PERCENT) {
    console.log(`📊 Cambio ${changePercent}% non significativo (serve >= ${CONFIG.SIGNIFICANT_CHANGE_PERCENT}%)`);
    return false;
  }

  console.log(`✅ Aggiornamento necessario: cambio ${changePercent}%`);
  return true;
}

/**
 * Aggiorna piano dieta con TDEE adattivo
 * PRESERVA la percentuale deficit/surplus originale
 *
 * @param {Object} dietPlan - Piano dieta da aggiornare
 * @param {Object} adaptiveResult - Risultato da calculateAdaptiveTDEE()
 * @returns {Object} { success, changes }
 */
export async function updatePlanWithAdaptiveTDEE(dietPlan, adaptiveResult) {
  const { tdeeAdaptive, tdeeRaw } = adaptiveResult;

  // 1. Ricalcola calorie target preservando % deficit/surplus
  const deficitPercent = dietPlan.deficit_percent || 0;
  const newTargetCalories = Math.round(
    tdeeAdaptive * (1 + deficitPercent / 100)
  );

  // 2. Safety: minimo BMR × 1.2
  const minimum = Math.round(dietPlan.bmr_base * CONFIG.MIN_TDEE_MULTIPLIER);
  const finalCalories = Math.max(newTargetCalories, minimum);

  // 3. Fetch ultima misurazione per peso e massa magra attuali
  const latestMeasurement = await Measurement.findOne({
    where: { user_id: dietPlan.user_id },
    order: [['data_misurazione', 'DESC']]
  });

  if (!latestMeasurement) {
    throw new Error('Nessuna misurazione trovata per calcolare macros');
  }

  // 4. Ricalcola macros con nuove calorie
  const newMacros = calculateMacros(
    finalCalories,
    latestMeasurement.peso,
    latestMeasurement.massa_magra,
    dietPlan.obiettivo
  );

  // 5. Calcola nuovo deficit (kcal/giorno)
  const newDeficitSurplus = finalCalories - tdeeAdaptive;
  const newDeficitPercent = ((finalCalories - tdeeAdaptive) / tdeeAdaptive) * 100;

  // 6. Aggiorna piano
  const oldValues = {
    tdee: dietPlan.tdee_adaptive_enabled ? dietPlan.tdee_adaptive : dietPlan.tdee_stimato,
    calories: dietPlan.calorie_target,
    proteine: dietPlan.proteine_g,
    carboidrati: dietPlan.carboidrati_g,
    grassi: dietPlan.grassi_g
  };

  await dietPlan.update({
    tdee_adaptive_enabled: true,
    tdee_adaptive: tdeeAdaptive,
    tdee_reale: tdeeRaw,
    tdee_adaptive_last_update: new Date(),
    tdee_adaptive_update_count: (dietPlan.tdee_adaptive_update_count || 0) + 1,
    calorie_target: finalCalories,
    deficit_surplus: newDeficitSurplus,
    deficit_percent: Math.round(newDeficitPercent * 10) / 10,
    proteine_g: newMacros.proteine,
    carboidrati_g: newMacros.carboidrati,
    grassi_g: newMacros.grassi
  });

  console.log(`✅ Piano aggiornato: TDEE ${oldValues.tdee} → ${tdeeAdaptive} kcal`);

  return {
    success: true,
    changes: {
      tdee_old: oldValues.tdee,
      tdee_new: tdeeAdaptive,
      tdee_raw: tdeeRaw,
      calories_old: oldValues.calories,
      calories_new: finalCalories,
      macros_old: {
        proteine: oldValues.proteine,
        carboidrati: oldValues.carboidrati,
        grassi: oldValues.grassi
      },
      macros_new: {
        proteine: newMacros.proteine,
        carboidrati: newMacros.carboidrati,
        grassi: newMacros.grassi
      },
      deficit_percent: Math.round(newDeficitPercent * 10) / 10,
      update_count: dietPlan.tdee_adaptive_update_count
    }
  };
}

/**
 * Helper: Fetch misurazioni con calorie consumate
 */
async function fetchMeasurementsWithCalories(userId, days) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  return await Measurement.findAll({
    where: {
      user_id: userId,
      data_misurazione: { [Op.gte]: dateFrom },
      calorie_consumate: { [Op.gt]: 0 }
    },
    order: [['data_misurazione', 'DESC']]
  });
}

/**
 * Helper: Calcola giorni tra due date
 */
function daysBetween(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export default {
  calculateAdaptiveTDEE,
  shouldUpdatePlan,
  updatePlanWithAdaptiveTDEE,
  CONFIG
};
