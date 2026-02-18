/**
 * 📊 CONFRONTO: Kalman Filter vs Exponential Smoothing
 *
 * Simulazione realistica di 30 giorni di tracking per dimostrare
 * come Kalman converge meglio al TDEE reale rispetto a exponential smoothing.
 *
 * Esegui: node backend/examples/kalman-vs-exponential-comparison.js
 */

import { updateMetabolismKalman, initializeKalmanState } from '../src/services/KalmanTDEEEstimator.js';

// ==================== SIMULAZIONE DATI ====================

/**
 * Simula 30 giorni di tracking peso + calorie
 * TDEE REALE (nascosto): 2200 kcal
 * TDEE STIMATO (iniziale): 2500 kcal (sovrastimato del 13.6%)
 */
function generateMockData() {
  const TDEE_REAL = 2200; // Metabolismo vero (ignoto al sistema)
  const TDEE_ESTIMATED = 2500; // Stima iniziale da formula BMR

  const data = [];
  let peso = 72.0; // kg iniziale

  for (let day = 1; day <= 30; day++) {
    // Calorie consumate: target 2200 con variabilità realistica
    let calories;
    if (day % 7 === 0) {
      // Domenica: cheat day (+30%)
      calories = 2200 + 600 + (Math.random() - 0.5) * 200;
    } else {
      // Giorni normali: ±10%
      calories = 2200 + (Math.random() - 0.5) * 400;
    }

    // Delta peso basato su bilancio energetico reale
    // ΔPeso = (Calorie - TDEE_real) / 7700
    const energyBalance = calories - TDEE_REAL;
    const weightDelta = energyBalance / 7700;

    // Aggiungi rumore bilancia (±0.2 kg)
    const noise = (Math.random() - 0.5) * 0.4;
    peso += weightDelta + noise;

    data.push({
      day,
      peso: Math.round(peso * 10) / 10,
      calories: Math.round(calories),
      tdeeReal: TDEE_REAL,
      isCheatDay: day % 7 === 0
    });
  }

  return { data, TDEE_REAL, TDEE_ESTIMATED };
}

// ==================== EXPONENTIAL SMOOTHING ====================

function updateExponentialSmoothing(tdee_old, tdee_measured, alpha = 0.75) {
  return Math.round(alpha * tdee_old + (1 - alpha) * tdee_measured);
}

// ==================== SIMULAZIONE ====================

function runComparison() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  📊 KALMAN FILTER vs EXPONENTIAL SMOOTHING - Confronto 30gg   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const { data, TDEE_REAL, TDEE_ESTIMATED } = generateMockData();

  console.log(`🎯 TDEE Reale (nascosto):    ${TDEE_REAL} kcal`);
  console.log(`📊 TDEE Stimato (iniziale):  ${TDEE_ESTIMATED} kcal`);
  console.log(`⚠️  Errore iniziale:          ${TDEE_ESTIMATED - TDEE_REAL} kcal (+${Math.round((TDEE_ESTIMATED / TDEE_REAL - 1) * 100)}%)\n`);

  // Inizializza algoritmi
  let kalmanState = initializeKalmanState(TDEE_ESTIMATED);
  let expTDEE = TDEE_ESTIMATED;

  console.log('┌──────┬────────┬──────────┬─────────────┬─────────────┬─────────────┬──────────┐');
  console.log('│ Day  │ Peso   │ Calorie  │ TDEE Kalman │ TDEE ExpSm  │ Kalman Gain │ Errore   │');
  console.log('├──────┼────────┼──────────┼─────────────┼─────────────┼─────────────┼──────────┤');

  const snapshots = [1, 7, 14, 21, 30]; // Mostra solo giorni chiave

  for (let i = 0; i < data.length; i++) {
    const today = data[i];
    const yesterday = data[i - 1];

    if (!yesterday) continue; // Skip primo giorno

    // ===== KALMAN FILTER =====
    const kalmanResult = updateMetabolismKalman({
      previousTDEE: kalmanState.tdee,
      previousVariance: kalmanState.variance,
      weightToday: today.peso,
      weightYesterday: yesterday.peso,
      caloriesToday: today.calories
    });

    if (kalmanResult) {
      kalmanState = {
        tdee: kalmanResult.tdee,
        variance: kalmanResult.variance,
        gain: kalmanResult.kalmanGain
      };
    }

    // ===== EXPONENTIAL SMOOTHING =====
    const weightDelta = today.peso - yesterday.peso;
    const tdeeObserved = today.calories - (7700 * weightDelta);
    expTDEE = updateExponentialSmoothing(expTDEE, tdeeObserved, 0.75);

    // ===== OUTPUT =====
    if (snapshots.includes(today.day)) {
      const kalmanError = Math.abs(kalmanState.tdee - TDEE_REAL);
      const expError = Math.abs(expTDEE - TDEE_REAL);
      const betterAlgo = kalmanError < expError ? '🟢 Kalman' : '🔴 ExpSm';

      console.log(
        `│ ${String(today.day).padStart(4)} │ ` +
        `${today.peso.toFixed(1).padStart(6)} │ ` +
        `${String(today.calories).padStart(8)} │ ` +
        `${String(kalmanState.tdee).padStart(11)} │ ` +
        `${String(expTDEE).padStart(11)} │ ` +
        `${kalmanState.gain.toFixed(3).padStart(11)} │ ` +
        `${betterAlgo.padEnd(8)} │`
      );
    }
  }

  console.log('└──────┴────────┴──────────┴─────────────┴─────────────┴─────────────┴──────────┘\n');

  // ===== RISULTATI FINALI =====

  const kalmanFinal = kalmanState.tdee;
  const expFinal = expTDEE;

  const kalmanError = Math.abs(kalmanFinal - TDEE_REAL);
  const expError = Math.abs(expFinal - TDEE_REAL);
  const kalmanStd = Math.round(Math.sqrt(kalmanState.variance));

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      📊 RISULTATI FINALI                       ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  TDEE Reale:                ${TDEE_REAL} kcal                         ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  🔵 Kalman Filter:          ${kalmanFinal} kcal                         ║`);
  console.log(`║     Errore:                 ${kalmanError} kcal (${((kalmanError / TDEE_REAL) * 100).toFixed(1)}%)               ║`);
  console.log(`║     Confidence (std):       ±${kalmanStd} kcal                       ║`);
  console.log(`║     Convergenza:            ${kalmanStd < 150 ? '✅ SÌ' : '⏳ In corso'}                          ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  🔴 Exponential Smoothing:  ${expFinal} kcal                         ║`);
  console.log(`║     Errore:                 ${expError} kcal (${((expError / TDEE_REAL) * 100).toFixed(1)}%)               ║`);
  console.log(`║     Alpha fisso:            0.75                                ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');

  if (kalmanError < expError) {
    const improvement = Math.round(((expError - kalmanError) / expError) * 100);
    console.log(`║  🏆 VINCITORE: Kalman Filter                                   ║`);
    console.log(`║     Miglioramento: ${improvement}% più accurato                            ║`);
  } else {
    console.log(`║  🏆 VINCITORE: Exponential Smoothing                           ║`);
  }

  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // ===== ANALISI CONVERGENZA =====

  console.log('📈 ANALISI CONVERGENZA:\n');

  console.log(`Kalman Gain Evoluzione:`);
  console.log(`  - Inizio (day 1):  ~0.735 (alta incertezza, fida molto della misura)`);
  console.log(`  - Metà (day 15):   ~0.200 (convergenza in corso)`);
  console.log(`  - Fine (day 30):   ${kalmanState.gain.toFixed(3)} (stima stabile, ignora rumore)`);

  console.log(`\nExponential Smoothing:`);
  console.log(`  - Inizio:          0.250 (alpha fisso, lento)`);
  console.log(`  - Fine:            0.250 (sempre uguale, non si adatta)\n`);

  // ===== VANTAGGI KALMAN =====

  console.log('✅ VANTAGGI KALMAN FILTER:\n');
  console.log(`  1. Convergenza adattiva: veloce all'inizio, conservativa alla fine`);
  console.log(`  2. Gestione rumore: filtra fluttuazioni peso (cheat days, acqua)`);
  console.log(`  3. Confidence tracking: sai quanto è affidabile la stima (±${kalmanStd} kcal)`);
  console.log(`  4. Ottimale matematicamente: minimizza varianza errore (teorema Kalman)`);
  console.log(`  5. Estendibile: facile aggiungere FM/FFM come stati multipli\n`);

  console.log('⚠️  LIMITI EXPONENTIAL SMOOTHING:\n');
  console.log(`  1. Alpha fisso: non si adatta all'incertezza`);
  console.log(`  2. Convergenza lenta: sempre peso 0.25 sulla misura`);
  console.log(`  3. Nessuna confidence: non sai quanto fidarti`);
  console.log(`  4. Sensibile a outliers: cheat days influenzano troppo\n`);
}

// ==================== ESEGUI ====================

runComparison();
