/**
 * 🎯 KALMAN FILTER per TDEE ADATTIVO
 *
 * Stima dinamica del metabolismo reale (TDEE) usando un filtro di Kalman
 * a stato singolo per convergenza ottimale dal tracking peso + calorie.
 *
 * VANTAGGI vs Exponential Smoothing:
 * - Gain auto-adattivo basato su incertezza
 * - Filtraggio ottimale del rumore (fluttuazioni acqua, errori tracking)
 * - Convergenza rapida con dati accurati, conservativa con dati rumorosi
 * - Traccia confidence della stima (variance)
 *
 * MODELLO:
 * - Stato: x[k] = TDEE al giorno k
 * - Dinamica: x[k] = x[k-1] + w[k]  (random walk, metabolismo cambia lentamente)
 * - Misura: Z[k] = Calorie[k] - 7700 * ΔPeso[k]  (TDEE osservato da bilancio energetico)
 *
 * PARAMETRI OTTIMIZZATI:
 * - Q = 100: varianza processo (drift metabolismo ~10 kcal/giorno std)
 * - R = 90000: varianza misura (~300 kcal std, copre errori tracking + fluttuazioni)
 * - P0 = 250000: varianza iniziale (~500 kcal std, incertezza alta all'inizio)
 */

// ==================== CONFIGURAZIONE ====================

/**
 * Parametri Kalman Filter
 * TUNING: Modifica questi valori per adattare il comportamento
 */
export const KALMAN_CONFIG = {
  // Process noise covariance (quanto cambia il metabolismo ogni giorno)
  Q: 100,  // var ≈ (10 kcal)² → metabolismo stabile

  // Measurement noise covariance (quanto è rumorosa la misura)
  R: 90000,  // var ≈ (300 kcal)² → copre errori tracking + peso

  // Initial state covariance (incertezza iniziale)
  P0: 250000,  // var ≈ (500 kcal)² → alta incertezza all'inizio

  // Conversion factor: 1 kg body mass ≈ 7700 kcal
  KCAL_PER_KG: 7700,

  // Safety limits per TDEE finale
  TDEE_MIN: 1200,
  TDEE_MAX: 5000,

  // Soglie validazione
  MAX_WEIGHT_DELTA: 1.5,  // kg, ignora se |ΔW| > 1.5 kg (fluttuazione acqua)
  MIN_CALORIES: 500,      // kcal, ignora se troppo basso
  MAX_CALORIES: 8000      // kcal, ignora se troppo alto
};

// ==================== FUNZIONE PRINCIPALE ====================

/**
 * Aggiorna stima TDEE usando Kalman Filter
 *
 * @param {Object} params - Parametri aggiornamento
 * @param {number} params.previousTDEE - TDEE stimato precedente (stato x[k-1])
 * @param {number} params.previousVariance - Varianza precedente (P[k-1])
 * @param {number} params.weightToday - Peso oggi (kg)
 * @param {number} params.weightYesterday - Peso ieri (kg)
 * @param {number} params.caloriesToday - Calorie consumate oggi (kcal)
 *
 * @returns {Object|null} Nuova stima o null se update non valido
 * @returns {number} return.tdee - TDEE stimato aggiornato (kcal)
 * @returns {number} return.variance - Varianza aggiornata (kcal²)
 * @returns {number} return.kalmanGain - Gain calcolato (0-1, diagnostico)
 * @returns {number} return.measurement - TDEE misurato da dati (kcal)
 * @returns {number} return.innovation - Differenza misura-predizione (kcal)
 * @returns {number} return.confidenceStd - Deviazione standard stima (kcal)
 */
export function updateMetabolismKalman({
  previousTDEE,
  previousVariance,
  weightToday,
  weightYesterday,
  caloriesToday
}) {
  // ===== VALIDAZIONE INPUT =====

  // Check dati mancanti
  if (!weightYesterday || !weightToday || !caloriesToday) {
    return null; // Dati insufficienti
  }

  // Check validità peso
  if (weightToday <= 0 || weightYesterday <= 0) {
    return null;
  }

  // Check validità calorie
  if (caloriesToday < KALMAN_CONFIG.MIN_CALORIES ||
      caloriesToday > KALMAN_CONFIG.MAX_CALORIES) {
    return null; // Calorie fuori range plausibile
  }

  // Calcola delta peso
  const weightDelta = weightToday - weightYesterday;

  // Check fluttuazione eccessiva (probabile ritenzione idrica / errore bilancia)
  if (Math.abs(weightDelta) > KALMAN_CONFIG.MAX_WEIGHT_DELTA) {
    console.warn(`⚠️ Kalman: Delta peso eccessivo (${weightDelta.toFixed(2)} kg), update ignorato`);
    return null;
  }

  // ===== STEP 1: CALCOLA MISURA (Z[k]) =====

  // Formula bilancio energetico:
  // ΔPeso ≈ (Calorie - TDEE) / 7700
  // → TDEE_misurato ≈ Calorie - 7700 * ΔPeso
  const tdeeObserved = caloriesToday - (KALMAN_CONFIG.KCAL_PER_KG * weightDelta);

  // ===== STEP 2: PREDICTION =====

  // Stato predetto (random walk: TDEE non cambia istantaneamente)
  const tdeePredict = previousTDEE;

  // Varianza predetta (aumenta per incertezza processo)
  const variancePredict = previousVariance + KALMAN_CONFIG.Q;

  // ===== STEP 3: KALMAN GAIN =====

  // K = P_pred / (P_pred + R)
  // K → 1 quando P_pred >> R (alta incertezza stima, fida della misura)
  // K → 0 quando P_pred << R (bassa incertezza stima, ignora rumore misura)
  const kalmanGain = variancePredict / (variancePredict + KALMAN_CONFIG.R);

  // ===== STEP 4: UPDATE =====

  // Innovation (quanto la misura differisce dalla predizione)
  const innovation = tdeeObserved - tdeePredict;

  // Stato aggiornato
  let tdeeUpdated = tdeePredict + kalmanGain * innovation;

  // Varianza aggiornata (diminuisce dopo measurement update)
  const varianceUpdated = (1 - kalmanGain) * variancePredict;

  // ===== STEP 5: SAFETY CHECKS =====

  // Limita TDEE entro range fisiologico
  tdeeUpdated = Math.max(KALMAN_CONFIG.TDEE_MIN,
                         Math.min(KALMAN_CONFIG.TDEE_MAX, tdeeUpdated));

  // ===== RETURN =====

  return {
    tdee: Math.round(tdeeUpdated),
    variance: Math.round(varianceUpdated),
    kalmanGain: Math.round(kalmanGain * 1000) / 1000, // 3 decimali
    measurement: Math.round(tdeeObserved),
    innovation: Math.round(innovation),
    confidenceStd: Math.round(Math.sqrt(varianceUpdated)) // Deviazione standard
  };
}

// ==================== FUNZIONE INIZIALIZZAZIONE ====================

/**
 * Inizializza stato Kalman per nuovo piano
 *
 * @param {number} initialTDEE - TDEE stimato da formula BMR o precedente
 * @returns {Object} Stato iniziale Kalman
 */
export function initializeKalmanState(initialTDEE) {
  // Limita TDEE iniziale entro range
  const tdee = Math.max(KALMAN_CONFIG.TDEE_MIN,
                        Math.min(KALMAN_CONFIG.TDEE_MAX, initialTDEE));

  return {
    tdee: Math.round(tdee),
    variance: KALMAN_CONFIG.P0,
    kalmanGain: 0,
    updateCount: 0,
    lastUpdate: new Date()
  };
}

// ==================== FUNZIONI DIAGNOSTICHE ====================

/**
 * Calcola confidence interval (95%) per stima TDEE
 *
 * @param {number} tdee - TDEE stimato
 * @param {number} variance - Varianza stima
 * @returns {Object} { lower, upper, width }
 */
export function getConfidenceInterval(tdee, variance) {
  const std = Math.sqrt(variance);
  const margin = 1.96 * std; // 95% confidence interval

  return {
    lower: Math.round(tdee - margin),
    upper: Math.round(tdee + margin),
    width: Math.round(2 * margin),
    std: Math.round(std)
  };
}

/**
 * Determina se stima è convergente (varianza stabile)
 *
 * @param {number} variance - Varianza corrente
 * @returns {boolean} True se stima è stabile
 */
export function isConverged(variance) {
  // Considera convergente se std < 150 kcal
  const CONVERGENCE_THRESHOLD = 150 * 150; // 22500
  return variance < CONVERGENCE_THRESHOLD;
}

/**
 * Interpreta Kalman Gain
 *
 * @param {number} gain - Kalman gain (0-1)
 * @returns {string} Interpretazione testuale
 */
export function interpretKalmanGain(gain) {
  if (gain > 0.7) return 'Alta fiducia nella misura (stima poco certa)';
  if (gain > 0.3) return 'Bilanciamento misura-predizione';
  if (gain > 0.1) return 'Alta fiducia nella predizione (stima molto certa)';
  return 'Stima molto stabile, ignora fluttuazioni';
}

// ==================== FUNZIONE RESET (OPZIONALE) ====================

/**
 * Reset Kalman quando metabolismo cambia drasticamente
 * (es: cambio fase bulk->cut, infortunio, etc)
 *
 * @param {number} newTDEE - Nuovo TDEE stimato
 * @returns {Object} Stato Kalman resettato
 */
export function resetKalmanState(newTDEE) {
  console.log(`🔄 Kalman reset: nuovo TDEE baseline ${newTDEE} kcal`);
  return initializeKalmanState(newTDEE);
}

// ==================== ESTENSIONE FUTURA: MULTI-STATE ====================

/**
 * PLACEHOLDER per Kalman Filter multi-stato
 *
 * In futuro, estendere per stimare simultaneamente:
 * - x[0] = TDEE (già implementato)
 * - x[1] = Fat Mass (FM)
 * - x[2] = Fat-Free Mass (FFM)
 *
 * Matrice transizione F = diag(1, 1, 1) (random walk per tutti)
 * Matrice misura H dipende da sensori disponibili (bilancia BIA, plicometro, etc)
 */
export function updateMetabolismMultiState() {
  throw new Error('Multi-state Kalman non ancora implementato. TODO: Fase 2.');
}

// ==================== EXPORT DEFAULT ====================

export default {
  KALMAN_CONFIG,
  updateMetabolismKalman,
  initializeKalmanState,
  getConfidenceInterval,
  isConverged,
  interpretKalmanGain,
  resetKalmanState
};
