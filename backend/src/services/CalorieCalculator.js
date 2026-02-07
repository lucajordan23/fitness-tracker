/**
 * ⭐ CORE SERVICE: CalorieCalculator
 *
 * Calcola TDEE, target calorico e distribuzione macronutrienti
 * basandosi sul BMR fornito dalla bilancia Huawei Scale 3
 *
 * Fonte algoritmi: CLAUDE.md
 */

/**
 * Activity multipliers per calcolo TDEE
 * TDEE = BMR × Activity Factor
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentario: 1.2,    // 0-1 allenamenti/settimana, lavoro sedentario
  leggero: 1.375,     // 2-3 allenamenti/settimana
  moderato: 1.55,     // 4-5 allenamenti/settimana
  attivo: 1.725       // 6-7 allenamenti/settimana, lavoro fisico
};

/**
 * Percentuali deficit/surplus per cutting/bulking
 */
export const DEFICIT_SURPLUS_PERCENTAGES = {
  cutting: {
    leggero: -0.15,      // -15% TDEE
    moderato: -0.20,     // -20% TDEE
    aggressivo: -0.25    // -25% TDEE
  },
  bulking: {
    lean: 0.10,          // +10% TDEE (lean bulk)
    moderato: 0.15,      // +15% TDEE
    aggressivo: 0.20     // +20% TDEE
  },
  ricomposizione: 0.00,  // Esattamente TDEE
  mantenimento: 0.00     // Esattamente TDEE
};

/**
 * Grammi proteine per kg peso corporeo
 */
export const PROTEIN_PER_KG = {
  cutting: 2.2,         // Alto per preservare muscolo in deficit
  bulking: 1.8,         // Moderato, surplus calorico aiuta
  ricomposizione: 2.0,  // Alto-moderato
  mantenimento: 1.8
};

/**
 * Calcola activity multiplier custom da numero allenamenti/settimana
 *
 * @param {number} workoutsPerWeek - Allenamenti a settimana (0-7)
 * @returns {number} Activity multiplier personalizzato
 */
export function calculateActivityMultiplierFromWorkouts(workoutsPerWeek) {
  // Base sedentario (attività quotidiane minime)
  const baseSedentario = 1.2;

  // Incremento per allenamento
  // 0-1: 1.2-1.3 (sedentario)
  // 2-3: 1.375 (leggero)
  // 4-5: 1.55 (moderato)
  // 6-7: 1.725 (attivo)

  if (workoutsPerWeek <= 0) return 1.2;
  if (workoutsPerWeek >= 7) return 1.725;

  // Interpolazione lineare
  // Formula: 1.2 + (workouts × 0.075)
  // 0 workout = 1.2
  // 1 workout = 1.275
  // 2 workout = 1.35
  // 3 workout = 1.425
  // 4 workout = 1.5
  // 5 workout = 1.575
  // 6 workout = 1.65
  // 7 workout = 1.725

  const multiplier = baseSedentario + (workoutsPerWeek * 0.075);
  return Math.round(multiplier * 1000) / 1000; // 3 decimali
}

/**
 * Calcola TDEE considerando calorie bruciate da smartwatch (opzionale)
 *
 * @param {number} bmr - BMR dalla bilancia
 * @param {number} workoutsPerWeek - Allenamenti a settimana
 * @param {number} workoutCaloriesPerSession - Calorie bruciate per allenamento (opzionale, da smartwatch)
 * @returns {number} TDEE calcolato
 */
export function calculateTDEEWithCustomActivity(bmr, workoutsPerWeek, workoutCaloriesPerSession = null) {
  // Metodo 1: Se hai calorie smartwatch, calcola TDEE preciso
  if (workoutCaloriesPerSession && workoutCaloriesPerSession > 0) {
    // TDEE = BMR × 1.2 (base sedentario) + calorie allenamenti medie giornaliere
    const baseTDEE = bmr * 1.2; // Attività quotidiane base
    const workoutCaloriesDaily = (workoutCaloriesPerSession * workoutsPerWeek) / 7;
    const tdee = baseTDEE + workoutCaloriesDaily;

    return Math.round(tdee);
  }

  // Metodo 2: Usa multiplier calcolato da numero allenamenti
  const multiplier = calculateActivityMultiplierFromWorkouts(workoutsPerWeek);
  return Math.round(bmr * multiplier);
}

/**
 * STEP 1: Calcola TDEE dal BMR
 *
 * @param {number} bmr - Metabolismo basale dalla bilancia (kcal/giorno)
 * @param {string} activityLevel - 'sedentario' | 'leggero' | 'moderato' | 'attivo'
 * @returns {number} TDEE (Total Daily Energy Expenditure) arrotondato
 *
 * @example
 * calculateTDEE(1606, 'moderato') // 2489 kcal
 */
export function calculateTDEE(bmr, activityLevel) {
  if (!bmr || bmr < 800 || bmr > 3500) {
    throw new Error('BMR fuori range valido (800-3500 kcal)');
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  if (!multiplier) {
    throw new Error(`Activity level non valido: ${activityLevel}`);
  }

  return Math.round(bmr * multiplier);
}

/**
 * STEP 2: Calcola target calorico basato su obiettivo
 *
 * @param {number} tdee - TDEE calcolato
 * @param {string} obiettivo - 'cutting' | 'bulking' | 'ricomposizione' | 'mantenimento'
 * @param {string} intensita - 'leggero' | 'moderato' | 'aggressivo' (per cutting/bulking)
 * @param {number} bmr - BMR base per safety check
 * @returns {Object} { targetCalorie, deficit, deficitPercent }
 *
 * @example
 * calculateTargetCalories(2489, 'ricomposizione', null, 1606)
 * // { targetCalorie: 2489, deficit: 0, deficitPercent: 0 }
 */
export function calculateTargetCalories(tdee, obiettivo, intensita, bmr) {
  if (!tdee || tdee < 1000) {
    throw new Error('TDEE non valido');
  }

  let targetCalorie;
  let deficit;

  switch (obiettivo) {
    case 'cutting': {
      if (!intensita || !DEFICIT_SURPLUS_PERCENTAGES.cutting[intensita]) {
        throw new Error(`Intensità cutting non valida: ${intensita}`);
      }
      const deficitPercent = DEFICIT_SURPLUS_PERCENTAGES.cutting[intensita];
      targetCalorie = tdee * (1 + deficitPercent);
      deficit = tdee - targetCalorie;
      break;
    }

    case 'bulking': {
      if (!intensita || !DEFICIT_SURPLUS_PERCENTAGES.bulking[intensita]) {
        throw new Error(`Intensità bulking non valida: ${intensita}`);
      }
      const surplusPercent = DEFICIT_SURPLUS_PERCENTAGES.bulking[intensita];
      targetCalorie = tdee * (1 + surplusPercent);
      deficit = tdee - targetCalorie; // Negativo = surplus
      break;
    }

    case 'ricomposizione':
    case 'mantenimento':
      targetCalorie = tdee;
      deficit = 0;
      break;

    default:
      throw new Error(`Obiettivo non valido: ${obiettivo}`);
  }

  // SAFETY CHECK: Non scendere mai sotto BMR × 1.2
  const minimoAssoluto = bmr * 1.2;
  if (targetCalorie < minimoAssoluto) {
    console.warn(`⚠️ Target ${targetCalorie} sotto minimo ${minimoAssoluto}. Corretto a minimo.`);
    targetCalorie = minimoAssoluto;
    deficit = tdee - targetCalorie;
  }

  return {
    targetCalorie: Math.round(targetCalorie),
    deficit: Math.round(deficit),
    deficitPercent: Math.round((deficit / tdee) * 100)
  };
}

/**
 * STEP 3: Distribuisce macronutrienti
 *
 * PRIORITÀ:
 * 1. Proteine (preservare/costruire muscolo)
 * 2. Grassi (salute ormonale)
 * 3. Carboidrati (energia, riempitivo)
 *
 * @param {number} targetCalorie - Calorie target giornaliere
 * @param {number} peso - Peso corporeo attuale (kg)
 * @param {number} massaMagra - Massa magra (kg) - opzionale ma preferibile
 * @param {string} obiettivo - 'cutting' | 'bulking' | 'ricomposizione' | 'mantenimento'
 * @returns {Object} { proteine, grassi, carboidrati } in grammi
 *
 * @example
 * calculateMacros(2489, 71.9, 55.9, 'ricomposizione')
 * // { proteine: 144, grassi: 72, carboidrati: 316 }
 */
export function calculateMacros(targetCalorie, peso, massaMagra, obiettivo) {
  if (!targetCalorie || targetCalorie < 1000) {
    throw new Error('Target calorie non valido');
  }
  if (!peso || peso < 30 || peso > 300) {
    throw new Error('Peso non valido');
  }

  // PROTEINE: basato su obiettivo
  const proteineGperKg = PROTEIN_PER_KG[obiettivo] || PROTEIN_PER_KG.mantenimento;
  const proteineG = Math.round(peso * proteineGperKg);
  const proteineKcal = proteineG * 4; // 1g proteine = 4 kcal

  // GRASSI: target 1.0 g/kg, minimo 0.8 g/kg
  let grassiG = Math.round(peso * 1.0);
  let grassiKcal = grassiG * 9; // 1g grassi = 9 kcal

  // CARBOIDRATI: tutto il resto delle calorie
  let carbsKcal = targetCalorie - proteineKcal - grassiKcal;
  let carbsG = Math.round(carbsKcal / 4); // 1g carbs = 4 kcal

  // Safety check: se carboidrati troppo bassi (<50g), riduci grassi
  if (carbsG < 50) {
    console.warn('⚠️ Carboidrati troppo bassi, riduco grassi a 0.8g/kg');
    grassiG = Math.round(peso * 0.8);
    grassiKcal = grassiG * 9;
    carbsKcal = targetCalorie - proteineKcal - grassiKcal;
    carbsG = Math.round(carbsKcal / 4);
  }

  return {
    proteine: proteineG,
    grassi: grassiG,
    carboidrati: carbsG
  };
}

/**
 * STEP 4 (OPZIONALE - FASE 2): Reverse engineering TDEE reale
 *
 * Dopo 2+ settimane di tracking calorie, calcola il TDEE REALE
 * basandosi su quanto ha mangiato e come è cambiato il peso
 *
 * @param {Array} measurements - Array di misurazioni degli ultimi 14+ giorni
 * @returns {number|null} TDEE reale o null se dati insufficienti
 *
 * Formula:
 * - Delta peso × 7700 kcal/kg = Delta calorico totale
 * - TDEE reale = Media calorie consumate + (Delta calorico / giorni)
 */
export function reverseTDEE(measurements) {
  if (!measurements || measurements.length < 10) {
    return null; // Dati insufficienti
  }

  // Filtra solo misurazioni con calorie tracciate
  const withCalories = measurements.filter(m => m.calorie_consumate > 0);

  if (withCalories.length < 10) {
    return null;
  }

  // Prendi ultimi 14 giorni
  const last14 = withCalories.slice(0, 14);

  // Media calorie consumate
  const avgCalorie = last14.reduce((sum, m) => sum + m.calorie_consumate, 0) / last14.length;

  // Delta peso (usa media primi 3 e ultimi 3 giorni per stabilità)
  const average = (arr) => arr.reduce((sum, v) => sum + v, 0) / arr.length;

  const pesoInizio = average(last14.slice(-3).map(m => m.peso));
  const pesoFine = average(last14.slice(0, 3).map(m => m.peso));
  const deltaPeso = pesoFine - pesoInizio;

  // 1kg grasso ≈ 7700 kcal
  const deltaCalorieTotali = deltaPeso * 7700;
  const deltaCalorieGiornaliero = deltaCalorieTotali / 14;

  // TDEE reale = calorie mangiate + deficit/surplus effettivo
  const tdeeReale = avgCalorie + deltaCalorieGiornaliero;

  return Math.round(tdeeReale);
}

/**
 * FUNZIONE COMPLETA: Genera piano dieta completo da BMR
 *
 * @param {number} bmr - BMR dalla bilancia
 * @param {number} peso - Peso corrente (kg)
 * @param {number} massaMagra - Massa magra (kg)
 * @param {string} activityLevel - Livello attività
 * @param {string} obiettivo - Obiettivo
 * @param {string} intensita - Intensità deficit/surplus (se applicabile)
 * @returns {Object} Piano completo con TDEE, target, macros, strategia
 */
export function generateCompleteDietPlan(bmr, peso, massaMagra, activityLevel, obiettivo, intensita = 'moderato') {
  // STEP 1: Calcola TDEE
  const tdee = calculateTDEE(bmr, activityLevel);

  // STEP 2: Calcola target calorico
  const { targetCalorie, deficit, deficitPercent } = calculateTargetCalories(
    tdee,
    obiettivo,
    obiettivo === 'ricomposizione' || obiettivo === 'mantenimento' ? null : intensita,
    bmr
  );

  // STEP 3: Distribuisci macros
  const macros = calculateMacros(targetCalorie, peso, massaMagra, obiettivo);

  // Genera strategia descrittiva
  let strategia = '';
  if (obiettivo === 'cutting') {
    strategia = `Deficit ${Math.abs(deficitPercent)}% (${Math.abs(deficit)} kcal/giorno). Focus: preservazione massa muscolare con proteine elevate (${macros.proteine}g/giorno).`;
  } else if (obiettivo === 'bulking') {
    strategia = `Surplus ${deficitPercent}% (+${Math.abs(deficit)} kcal/giorno). Focus: costruzione muscolare progressiva con volume allenamento adeguato.`;
  } else if (obiettivo === 'ricomposizione') {
    strategia = `Calorie a mantenimento (TDEE). Focus: perdita grasso e costruzione/mantenimento muscolo simultanei. Richiede allenamento intenso e proteine elevate.`;
  } else {
    strategia = `Calorie a mantenimento (TDEE). Focus: stabilità composizione corporea.`;
  }

  return {
    bmr_base: bmr,
    tdee_stimato: tdee,
    calorie_target: targetCalorie,
    deficit_surplus: -deficit, // Inverti segno per convenzione (negativo = deficit)
    deficit_percent: -deficitPercent,
    proteine_g: macros.proteine,
    carboidrati_g: macros.carboidrati,
    grassi_g: macros.grassi,
    obiettivo,
    strategia,
    // Verifiche calorie
    calorie_da_macros: (macros.proteine * 4) + (macros.carboidrati * 4) + (macros.grassi * 9)
  };
}

export default {
  ACTIVITY_MULTIPLIERS,
  DEFICIT_SURPLUS_PERCENTAGES,
  PROTEIN_PER_KG,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  reverseTDEE,
  generateCompleteDietPlan
};
