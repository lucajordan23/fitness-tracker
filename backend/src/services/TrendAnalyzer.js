/**
 * ⭐ CORE SERVICE: TrendAnalyzer
 *
 * Analizza trend ultimi 7-14 giorni e genera raccomandazioni intelligenti
 * basate su obiettivo utente e variazioni composizione corporea
 *
 * Output: { situazione, deltas, raccomandazioni, metriche }
 */

/**
 * Calcola media di un array di numeri
 */
function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calcola delta settimanale (kg/settimana)
 *
 * @param {Array} measurements - Array misurazioni ordinate DESC (più recenti prima)
 * @param {string} field - Campo da analizzare (es: 'peso', 'massa_grassa')
 * @param {number} days - Giorni da considerare
 * @returns {number} Delta in kg/settimana
 */
export function calculateWeeklyDelta(measurements, field, days = 7) {
  if (!measurements || measurements.length < 2) return 0;

  // Prendi solo ultimi N giorni
  const recent = measurements.slice(0, days);
  if (recent.length < 2) return 0;

  // Media primi 3 giorni (più recenti)
  const endValues = recent.slice(0, Math.min(3, recent.length)).map(m => m[field]).filter(v => v !== null);

  // Media ultimi 3 giorni (meno recenti)
  const startValues = recent.slice(-Math.min(3, recent.length)).map(m => m[field]).filter(v => v !== null);

  if (endValues.length === 0 || startValues.length === 0) return 0;

  const endAvg = average(endValues);
  const startAvg = average(startValues);

  // Delta totale nel periodo
  const totalDelta = endAvg - startAvg;

  // Normalizza a delta settimanale
  const actualDays = recent.length;
  const weeklyDelta = (totalDelta / actualDays) * 7;

  return Math.round(weeklyDelta * 100) / 100; // 2 decimali
}

/**
 * Analizza trend ultimi 7-14 giorni
 *
 * @param {Array} measurements - Misurazioni ordinate DESC
 * @param {number} days - Giorni da analizzare (7 o 14)
 * @returns {Object} { peso, massaGrassa, massaMagra, bodyFat, periodo }
 */
export function analyzeTrends(measurements, days = 7) {
  if (!measurements || measurements.length < 2) {
    return null;
  }

  const deltas = {
    peso: calculateWeeklyDelta(measurements, 'peso', days),
    massaGrassa: calculateWeeklyDelta(measurements, 'massa_grassa', days),
    massaMagra: calculateWeeklyDelta(measurements, 'massa_magra', days),
    bodyFat: calculateWeeklyDelta(measurements, 'body_fat_percent', days),
    periodo: days
  };

  return deltas;
}

/**
 * Classifica situazione basata su obiettivo e deltas
 *
 * @param {Object} deltas - { peso, massaGrassa, massaMagra, bodyFat }
 * @param {string} obiettivo - 'cutting' | 'bulking' | 'ricomposizione' | 'mantenimento'
 * @returns {Object} { status, codice, semaforo, messaggio }
 */
export function classifyTrend(deltas, obiettivo) {
  if (!deltas) {
    return {
      status: 'insufficiente',
      codice: 'DATI_INSUFFICIENTI',
      semaforo: 'grigio',
      messaggio: 'Continua a tracciare per almeno 7 giorni per analisi trend'
    };
  }

  const { massaGrassa, massaMagra, peso } = deltas;

  // === RICOMPOSIZIONE ===
  if (obiettivo === 'ricomposizione') {
    // SANTO GRAAL: perdi grasso E guadagni muscolo
    if (massaGrassa < -0.2 && massaMagra > 0.1) {
      return {
        status: 'ottimale',
        codice: 'RECOMP_PERFECT',
        semaforo: 'verde',
        messaggio: '🔥 SANTO GRAAL! Perdi grasso E costruisci muscolo. Continua così!'
      };
    }

    // BUONO: perdi grasso, muscolo stabile
    if (massaGrassa < -0.15 && massaMagra >= -0.1) {
      return {
        status: 'buono',
        codice: 'RECOMP_GOOD',
        semaforo: 'verde',
        messaggio: 'Perdi grasso preservando muscolo. Ottimo lavoro!'
      };
    }

    // ATTENZIONE: perdi muscolo
    if (massaMagra < -0.2) {
      return {
        status: 'attenzione',
        codice: 'MUSCLE_LOSS',
        semaforo: 'rosso',
        messaggio: '⚠️ Stai perdendo massa muscolare! Aumenta proteine e riduci deficit.'
      };
    }

    // PLATEAU: nessun cambiamento significativo
    if (Math.abs(massaGrassa) < 0.1 && Math.abs(massaMagra) < 0.1) {
      return {
        status: 'plateau',
        codice: 'RECOMP_PLATEAU',
        semaforo: 'giallo',
        messaggio: 'Nessun cambiamento significativo. Considera piccoli aggiustamenti.'
      };
    }

    // DEFAULT: in progresso
    return {
      status: 'in_progresso',
      codice: 'RECOMP_PROGRESS',
      semaforo: 'giallo',
      messaggio: 'Progressi lenti ma costanti. Pazienza e consistenza.'
    };
  }

  // === CUTTING ===
  if (obiettivo === 'cutting') {
    // OTTIMALE: perdi grasso, preservi muscolo
    if (massaGrassa < -0.3 && massaMagra >= -0.1) {
      return {
        status: 'ottimale',
        codice: 'CUTTING_OPTIMAL',
        semaforo: 'verde',
        messaggio: 'Cutting ottimale! Perdi grasso preservando muscolo.'
      };
    }

    // TROPPO VELOCE: perdi troppo muscolo
    if (massaMagra < -0.3) {
      return {
        status: 'critico',
        codice: 'CUTTING_TOO_AGGRESSIVE',
        semaforo: 'rosso',
        messaggio: '🚨 Deficit troppo aggressivo! Stai perdendo muscolo. Aumenta calorie.'
      };
    }

    // TROPPO LENTO: non perdi abbastanza grasso
    if (massaGrassa > -0.1) {
      return {
        status: 'lento',
        codice: 'CUTTING_TOO_SLOW',
        semaforo: 'giallo',
        messaggio: 'Progressi troppo lenti. Considera aumentare deficit leggermente.'
      };
    }

    // BUONO: in range target
    if (massaGrassa < -0.2 && massaGrassa > -0.5) {
      return {
        status: 'buono',
        codice: 'CUTTING_GOOD',
        semaforo: 'verde',
        messaggio: 'Cutting procede bene. Continua così.'
      };
    }

    return {
      status: 'in_progresso',
      codice: 'CUTTING_PROGRESS',
      semaforo: 'giallo',
      messaggio: 'Cutting in corso. Monitora progressi settimanali.'
    };
  }

  // === BULKING ===
  if (obiettivo === 'bulking') {
    // LEAN BULK PERFETTO: guadagni muscolo, minimo grasso
    if (massaMagra > 0.15 && massaGrassa < 0.1) {
      return {
        status: 'ottimale',
        codice: 'BULKING_LEAN',
        semaforo: 'verde',
        messaggio: '💪 Lean bulk perfetto! Costruisci muscolo con minimo grasso.'
      };
    }

    // TROPPO GRASSO: guadagni troppo grasso
    if (massaGrassa > 0.3) {
      return {
        status: 'attenzione',
        codice: 'BULKING_DIRTY',
        semaforo: 'rosso',
        messaggio: '⚠️ Surplus troppo alto! Riduci calorie per evitare grasso eccessivo.'
      };
    }

    // TROPPO LENTO: non guadagni abbastanza
    if (massaMagra < 0.05) {
      return {
        status: 'lento',
        codice: 'BULKING_TOO_SLOW',
        semaforo: 'giallo',
        messaggio: 'Crescita lenta. Considera aumentare surplus o volume allenamento.'
      };
    }

    // BUONO
    if (massaMagra > 0.1 && massaGrassa < 0.2) {
      return {
        status: 'buono',
        codice: 'BULKING_GOOD',
        semaforo: 'verde',
        messaggio: 'Bulking procede bene. Continua così.'
      };
    }

    return {
      status: 'in_progresso',
      codice: 'BULKING_PROGRESS',
      semaforo: 'giallo',
      messaggio: 'Bulking in corso. Monitora progressi settimanali.'
    };
  }

  // === MANTENIMENTO ===
  if (obiettivo === 'mantenimento') {
    // STABILE: nessun cambiamento
    if (Math.abs(peso) < 0.2) {
      return {
        status: 'ottimale',
        codice: 'MAINTENANCE_STABLE',
        semaforo: 'verde',
        messaggio: 'Peso stabile. Mantenimento corretto.'
      };
    }

    // PERDI PESO
    if (peso < -0.3) {
      return {
        status: 'attenzione',
        codice: 'MAINTENANCE_LOSING',
        semaforo: 'giallo',
        messaggio: 'Stai perdendo peso. Aumenta calorie se non intenzionale.'
      };
    }

    // GUADAGNI PESO
    if (peso > 0.3) {
      return {
        status: 'attenzione',
        codice: 'MAINTENANCE_GAINING',
        semaforo: 'giallo',
        messaggio: 'Stai guadagnando peso. Riduci calorie se non intenzionale.'
      };
    }

    return {
      status: 'buono',
      codice: 'MAINTENANCE_GOOD',
      semaforo: 'verde',
      messaggio: 'Mantenimento in range accettabile.'
    };
  }

  // FALLBACK
  return {
    status: 'sconosciuto',
    codice: 'UNKNOWN',
    semaforo: 'grigio',
    messaggio: 'Obiettivo non riconosciuto'
  };
}

/**
 * Genera raccomandazioni basate su classificazione
 *
 * @param {Object} situazione - Output di classifyTrend
 * @param {Object} deltas - Deltas settimanali
 * @param {string} obiettivo - Obiettivo utente
 * @param {Object} currentPlan - Piano dieta corrente (opzionale)
 * @returns {Array} Array di raccomandazioni { tipo, messaggio, priorita, azione }
 */
export function generateRecommendations(situazione, deltas, obiettivo, currentPlan = null) {
  const raccomandazioni = [];

  if (!situazione || !deltas) {
    return [{
      tipo: 'info',
      messaggio: 'Dati insufficienti per raccomandazioni. Continua tracking.',
      priorita: 'bassa',
      azione: null
    }];
  }

  const { codice, semaforo } = situazione;
  const { massaMagra, massaGrassa } = deltas;

  // === RACCOMANDAZIONI PER RICOMPOSIZIONE ===
  if (obiettivo === 'ricomposizione') {
    if (codice === 'RECOMP_PERFECT') {
      raccomandazioni.push({
        tipo: 'mantieni',
        messaggio: 'Non cambiare nulla! Sei nel punto ottimale.',
        priorita: 'alta',
        azione: null
      });
    }

    if (codice === 'MUSCLE_LOSS') {
      raccomandazioni.push({
        tipo: 'critico',
        messaggio: 'Aumenta proteine a 2.4g/kg e riduci deficit del 10%',
        priorita: 'alta',
        azione: 'increase_protein'
      });
      raccomandazioni.push({
        tipo: 'allenamento',
        messaggio: 'Riduci volume allenamento del 15-20%, mantieni intensità',
        priorita: 'alta',
        azione: 'reduce_volume'
      });
    }

    if (codice === 'RECOMP_PLATEAU') {
      raccomandazioni.push({
        tipo: 'aggiusta',
        messaggio: 'Prova diet break 2 settimane a TDEE per reset metabolico',
        priorita: 'media',
        azione: 'diet_break'
      });
    }
  }

  // === RACCOMANDAZIONI PER CUTTING ===
  if (obiettivo === 'cutting') {
    if (codice === 'CUTTING_TOO_AGGRESSIVE') {
      raccomandazioni.push({
        tipo: 'critico',
        messaggio: 'Aumenta calorie +200 kcal/giorno immediatamente',
        priorita: 'alta',
        azione: 'increase_calories'
      });
      raccomandazioni.push({
        tipo: 'proteine',
        messaggio: 'Aumenta proteine a 2.4-2.6 g/kg per preservare muscolo',
        priorita: 'alta',
        azione: 'increase_protein'
      });
    }

    if (codice === 'CUTTING_TOO_SLOW') {
      raccomandazioni.push({
        tipo: 'aggiusta',
        messaggio: 'Riduci calorie -100 kcal/giorno (principalmente carboidrati)',
        priorita: 'media',
        azione: 'decrease_calories'
      });
      raccomandazioni.push({
        tipo: 'cardio',
        messaggio: 'Aggiungi 2 sessioni cardio LISS 30min a settimana',
        priorita: 'media',
        azione: 'add_cardio'
      });
    }

    if (codice === 'CUTTING_OPTIMAL') {
      raccomandazioni.push({
        tipo: 'mantieni',
        messaggio: 'Continua così! Progressi ottimali.',
        priorita: 'alta',
        azione: null
      });
    }
  }

  // === RACCOMANDAZIONI PER BULKING ===
  if (obiettivo === 'bulking') {
    if (codice === 'BULKING_DIRTY') {
      raccomandazioni.push({
        tipo: 'critico',
        messaggio: 'Riduci calorie -200 kcal/giorno (riduci carboidrati)',
        priorita: 'alta',
        azione: 'decrease_calories'
      });
    }

    if (codice === 'BULKING_TOO_SLOW') {
      raccomandazioni.push({
        tipo: 'aggiusta',
        messaggio: 'Aumenta calorie +150 kcal/giorno (principalmente carboidrati)',
        priorita: 'media',
        azione: 'increase_calories'
      });
      raccomandazioni.push({
        tipo: 'allenamento',
        messaggio: 'Aumenta volume allenamento del 10-15%',
        priorita: 'media',
        azione: 'increase_volume'
      });
    }

    if (codice === 'BULKING_LEAN') {
      raccomandazioni.push({
        tipo: 'mantieni',
        messaggio: 'Lean bulk perfetto! Continua così.',
        priorita: 'alta',
        azione: null
      });
    }
  }

  // RACCOMANDAZIONI GENERALI basate su specifici deltas
  if (massaMagra < -0.2 && obiettivo !== 'bulking') {
    raccomandazioni.push({
      tipo: 'warning',
      messaggio: 'Perdita massa magra rilevata. Priorità: preservare muscolo.',
      priorita: 'alta',
      azione: null
    });
  }

  if (Math.abs(massaGrassa) < 0.05 && Math.abs(massaMagra) < 0.05) {
    raccomandazioni.push({
      tipo: 'info',
      messaggio: 'Nessun cambiamento significativo. Sii paziente e costante.',
      priorita: 'bassa',
      azione: null
    });
  }

  // Se nessuna raccomandazione, default
  if (raccomandazioni.length === 0) {
    raccomandazioni.push({
      tipo: 'info',
      messaggio: 'Continua il monitoraggio. Progressi in linea con aspettative.',
      priorita: 'bassa',
      azione: null
    });
  }

  return raccomandazioni;
}

/**
 * FUNZIONE PRINCIPALE: Analisi completa
 *
 * @param {Array} measurements - Misurazioni ordinate DESC
 * @param {string} obiettivo - Obiettivo utente
 * @param {Object} currentPlan - Piano dieta corrente (opzionale)
 * @param {number} days - Giorni da analizzare (7 o 14)
 * @returns {Object} { situazione, deltas, raccomandazioni, metriche, timestamp }
 */
export function analyzeComplete(measurements, obiettivo, currentPlan = null, days = 7) {
  // Calcola deltas
  const deltas = analyzeTrends(measurements, days);

  // Classifica situazione
  const situazione = classifyTrend(deltas, obiettivo);

  // Genera raccomandazioni
  const raccomandazioni = generateRecommendations(situazione, deltas, obiettivo, currentPlan);

  // Metriche addizionali
  const metriche = {
    misurazioni_analizzate: measurements ? measurements.slice(0, days).length : 0,
    periodo_giorni: days,
    dati_sufficienti: measurements && measurements.length >= 3,
    ultima_misurazione: measurements && measurements.length > 0 ? measurements[0].data_misurazione : null
  };

  return {
    situazione,
    deltas,
    raccomandazioni,
    metriche,
    timestamp: new Date().toISOString()
  };
}

export default {
  calculateWeeklyDelta,
  analyzeTrends,
  classifyTrend,
  generateRecommendations,
  analyzeComplete
};
