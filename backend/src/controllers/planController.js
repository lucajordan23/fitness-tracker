import { DietPlan, WorkoutPlan, Measurement, User } from '../models/index.js';
import {
  generateCompleteDietPlan,
  calculateTDEEWithCustomActivity,
  calculateTargetCalories,
  calculateMacros
} from '../services/CalorieCalculator.js';
import {
  calculateAdaptiveTDEE,
  shouldUpdatePlan,
  updatePlanWithAdaptiveTDEE,
  logTDEEUpdate
} from '../services/TDEEAdaptiveEstimator.js';
import { Op } from 'sequelize';

/**
 * GET /api/plans/current
 * Ritorna piani attivi correnti (dieta + workout)
 */
export async function getCurrentPlans(req, res) {
  try {
    const { user_id = 1 } = req.query;

    const dietPlan = await DietPlan.findOne({
      where: {
        user_id,
        is_active: true
      },
      order: [['start_date', 'DESC']]
    });

    const workoutPlan = await WorkoutPlan.findOne({
      where: {
        user_id,
        is_active: true
      },
      order: [['start_date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        dietPlan,
        workoutPlan
      }
    });
  } catch (error) {
    console.error('Error fetching current plans:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/plans/diet
 * ⭐ AUTO-GENERA piano dieta da ultima misurazione
 */
export async function createDietPlan(req, res) {
  try {
    const {
      user_id = 1,
      obiettivo,
      intensita_deficit,
      activity_level,
      workouts_per_week,
      workout_calories_per_session,
      start_date,
      // Valori manuali opzionali (se forniti, sovrascrivono il calcolo automatico)
      calorie_target: manualCalories,
      proteine_g: manualProteine,
      carboidrati_g: manualCarboidrati,
      grassi_g: manualGrassi,
      strategia: manualStrategia
    } = req.body;

    // Fetch user per dati default
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Fetch ultima misurazione per BMR
    const latestMeasurement = await Measurement.findOne({
      where: { user_id },
      order: [['data_misurazione', 'DESC']]
    });

    if (!latestMeasurement) {
      return res.status(400).json({
        success: false,
        error: 'Nessuna misurazione disponibile. Inserisci prima una misurazione dalla bilancia.'
      });
    }

    if (!latestMeasurement.bmr) {
      return res.status(400).json({
        success: false,
        error: 'BMR non disponibile nell\'ultima misurazione. Assicurati che la bilancia fornisca il dato BMR.'
      });
    }

    // Usa parametri da body o user defaults
    const finalObiettivo = obiettivo || user.obiettivo;
    const finalIntensita = intensita_deficit || 'moderato';

    let planData;

    // 🔥 MODALITÀ MANUALE: Se forniti valori manuali, usali direttamente
    if (manualCalories && manualProteine && manualCarboidrati && manualGrassi) {
      // Calcola TDEE stimato reverse-engineered dalle calorie target
      const estimatedTDEE = Math.round(latestMeasurement.bmr * 1.5); // Stima base per soddisfare il constraint

      planData = {
        bmr_base: latestMeasurement.bmr,
        tdee_stimato: estimatedTDEE,
        calorie_target: manualCalories,
        deficit_surplus: manualCalories - estimatedTDEE,
        deficit_percent: Math.round(((manualCalories - estimatedTDEE) / estimatedTDEE) * 100 * 10) / 10,
        proteine_g: manualProteine,
        carboidrati_g: manualCarboidrati,
        grassi_g: manualGrassi,
        obiettivo: finalObiettivo,
        strategia: manualStrategia || 'Piano personalizzato con valori manuali',
        workouts_per_week: workouts_per_week || null,
        workout_calories_per_session: workout_calories_per_session || null,
        calorie_da_macros: (manualProteine * 4) + (manualCarboidrati * 4) + (manualGrassi * 9)
      };
    } else {
      // 🔥 MODALITÀ AUTOMATICA: Calcola valori da BMR e parametri

      // METODO CUSTOM: se fornito workouts_per_week, calcola TDEE preciso
      if (workouts_per_week !== undefined && workouts_per_week !== null) {
        // Calcola TDEE con metodo custom (workout count o smartwatch calories)
        const tdee = calculateTDEEWithCustomActivity(
          latestMeasurement.bmr,
          workouts_per_week,
          workout_calories_per_session || null
        );

        // Calcola target calorie basato su obiettivo
        const { targetCalorie, deficit, deficitPercent } = calculateTargetCalories(
          tdee,
          finalObiettivo,
          finalObiettivo === 'ricomposizione' || finalObiettivo === 'mantenimento' ? null : finalIntensita,
          latestMeasurement.bmr
        );

        // Distribuisci macros
        const macros = calculateMacros(
          targetCalorie,
          latestMeasurement.peso,
          latestMeasurement.massa_magra,
          finalObiettivo
        );

        // Genera strategia descrittiva
        let strategia = '';
        if (finalObiettivo === 'cutting') {
          strategia = `Deficit ${Math.abs(deficitPercent)}% (${Math.abs(deficit)} kcal/giorno). Focus: preservazione massa muscolare con proteine elevate (${macros.proteine}g/giorno).`;
        } else if (finalObiettivo === 'bulking') {
          strategia = `Surplus ${deficitPercent}% (+${Math.abs(deficit)} kcal/giorno). Focus: costruzione muscolare progressiva con volume allenamento adeguato.`;
        } else if (finalObiettivo === 'ricomposizione') {
          strategia = `Calorie a mantenimento (TDEE). Focus: perdita grasso e costruzione/mantenimento muscolo simultanei. Richiede allenamento intenso e proteine elevate.`;
        } else {
          strategia = `Calorie a mantenimento (TDEE). Focus: stabilità composizione corporea.`;
        }

        planData = {
          bmr_base: latestMeasurement.bmr,
          tdee_stimato: tdee,
          calorie_target: targetCalorie,
          deficit_surplus: -deficit,
          deficit_percent: -deficitPercent,
          proteine_g: macros.proteine,
          carboidrati_g: macros.carboidrati,
          grassi_g: macros.grassi,
          obiettivo: finalObiettivo,
          strategia,
          workouts_per_week,
          workout_calories_per_session: workout_calories_per_session || null,
          calorie_da_macros: (macros.proteine * 4) + (macros.carboidrati * 4) + (macros.grassi * 9)
        };
      } else {
        // METODO STANDARD: usa activity_level
        const finalActivityLevel = activity_level || user.activity_level;

        planData = generateCompleteDietPlan(
          latestMeasurement.bmr,
          latestMeasurement.peso,
          latestMeasurement.massa_magra,
          finalActivityLevel,
          finalObiettivo,
          finalIntensita
        );
      }
    } // Fine modalità automatica

    // Disattiva vecchi piani
    await DietPlan.update(
      { is_active: false },
      {
        where: {
          user_id,
          is_active: true
        }
      }
    );

    // Crea nuovo piano
    const dietPlan = await DietPlan.create({
      user_id,
      start_date: start_date || new Date(),
      is_active: true,
      ...planData,
      created_by: 'sistema'
    });

    res.status(201).json({
      success: true,
      data: dietPlan,
      metadata: {
        source_measurement_id: latestMeasurement.id,
        source_measurement_date: latestMeasurement.data_misurazione,
        calculation_method: workouts_per_week !== undefined ? 'custom_workouts' : 'activity_level',
        parameters_used: {
          obiettivo: finalObiettivo,
          activity_level: workouts_per_week !== undefined ? null : (activity_level || user.activity_level),
          workouts_per_week: workouts_per_week !== undefined ? workouts_per_week : null,
          workout_calories_per_session: workout_calories_per_session || null,
          intensita_deficit: finalIntensita
        },
        // Verifica calorie (debug)
        verifica: {
          calorie_da_macros: planData.calorie_da_macros,
          calorie_target: planData.calorie_target,
          match: Math.abs(planData.calorie_da_macros - planData.calorie_target) < 10
        }
      }
    });
  } catch (error) {
    console.error('Error creating diet plan:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/plans/workout
 * Crea piano allenamento
 */
export async function createWorkoutPlan(req, res) {
  try {
    const {
      user_id = 1,
      frequenza_settimanale,
      intensita,
      focus,
      volume_serie_totali,
      split_type,
      giorni_riposo,
      cardio_frequenza,
      cardio_tipo,
      cardio_durata_min,
      note,
      strategia,
      start_date
    } = req.body;

    // Disattiva vecchi piani
    await WorkoutPlan.update(
      { is_active: false },
      {
        where: {
          user_id,
          is_active: true
        }
      }
    );

    // Crea nuovo piano workout
    const workoutPlan = await WorkoutPlan.create({
      user_id,
      start_date: start_date || new Date(),
      is_active: true,
      frequenza_settimanale,
      intensita,
      focus,
      volume_serie_totali,
      split_type,
      giorni_riposo,
      cardio_frequenza,
      cardio_tipo,
      cardio_durata_min,
      note,
      strategia,
      created_by: 'utente'
    });

    res.status(201).json({
      success: true,
      data: workoutPlan
    });
  } catch (error) {
    console.error('Error creating workout plan:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/plans/history
 * Storico piani
 */
export async function getPlansHistory(req, res) {
  try {
    const {
      user_id = 1,
      type, // 'diet' | 'workout'
      limit = 10
    } = req.query;

    let plans;

    if (type === 'diet') {
      plans = await DietPlan.findAll({
        where: { user_id },
        order: [['start_date', 'DESC']],
        limit: parseInt(limit)
      });
    } else if (type === 'workout') {
      plans = await WorkoutPlan.findAll({
        where: { user_id },
        order: [['start_date', 'DESC']],
        limit: parseInt(limit)
      });
    } else {
      // Entrambi
      const dietPlans = await DietPlan.findAll({
        where: { user_id },
        order: [['start_date', 'DESC']],
        limit: parseInt(limit)
      });

      const workoutPlans = await WorkoutPlan.findAll({
        where: { user_id },
        order: [['start_date', 'DESC']],
        limit: parseInt(limit)
      });

      plans = { dietPlans, workoutPlans };
    }

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching plans history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/plans/diet/recalculate-tdee
 * Ricalcola TDEE adattivo e aggiorna piano se necessario
 */
export async function recalculateAdaptiveTDEE(req, res) {
  try {
    const { user_id = 1 } = req.body;

    // Fetch piano dieta attivo
    const dietPlan = await DietPlan.findOne({
      where: { user_id, is_active: true },
      order: [['start_date', 'DESC']]
    });

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        error: 'Nessun piano dieta attivo trovato'
      });
    }

    // Calcola TDEE adattivo
    const adaptiveResult = await calculateAdaptiveTDEE(dietPlan, user_id);

    if (!adaptiveResult.canActivate) {
      // Log tentativo fallito
      await logTDEEUpdate(dietPlan, adaptiveResult, false, adaptiveResult.reason);

      return res.json({
        success: false,
        adaptive_active: false,
        reason: adaptiveResult.reason,
        message: getAdaptiveErrorMessage(adaptiveResult)
      });
    }

    // Determina se serve aggiornare
    const needsUpdate = shouldUpdatePlan(dietPlan, adaptiveResult);

    if (!needsUpdate) {
      // Log tentativo non aggiornato (cambio non significativo)
      await logTDEEUpdate(dietPlan, adaptiveResult, false, 'change_not_significant');

      return res.json({
        success: true,
        adaptive_active: true,
        updated: false,
        message: 'TDEE adattivo calcolato ma nessun aggiornamento necessario',
        data: {
          current_tdee: dietPlan.tdee_adaptive || dietPlan.tdee_stimato,
          calculated_tdee: adaptiveResult.tdeeAdaptive,
          change_percent: adaptiveResult.changePercent,
          reason: 'change_not_significant'
        }
      });
    }

    // Aggiorna piano
    const updateResult = await updatePlanWithAdaptiveTDEE(
      dietPlan,
      adaptiveResult
    );

    // Log aggiornamento riuscito
    await logTDEEUpdate(dietPlan, adaptiveResult, true, null);

    res.json({
      success: true,
      adaptive_active: true,
      updated: true,
      message: 'Piano aggiornato con TDEE adattivo',
      data: {
        ...updateResult.changes,
        change_percent: adaptiveResult.changePercent,
        update_count: dietPlan.tdee_adaptive_update_count + 1
      }
    });
  } catch (error) {
    console.error('Error recalculating adaptive TDEE:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Helper: Genera messaggio di errore per adaptive TDEE
 */
function getAdaptiveErrorMessage(result) {
  switch (result.reason) {
    case 'insufficient_data':
      return `Servono almeno ${result.required} misurazioni con calorie tracciate. Attualmente: ${result.current}. Continua a tracciare calorie quotidianamente.`;
    case 'delta_peso_insufficient':
      return result.message || `Variazione di peso (${Math.abs(result.deltaPeso).toFixed(2)}kg) troppo piccola per essere significativa. Soglia minima: ${result.threshold}kg. Continua a tracciare per accumulare dati più rappresentativi.`;
    case 'calculation_failed':
      return 'Impossibile calcolare TDEE reale dai dati disponibili. Verifica che le misurazioni abbiano calorie_consumate compilato.';
    default:
      return 'Impossibile attivare TDEE adattivo';
  }
}

export default {
  getCurrentPlans,
  createDietPlan,
  createWorkoutPlan,
  getPlansHistory,
  recalculateAdaptiveTDEE
};
