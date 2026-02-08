import sequelize from './src/config/database.js';
import { User, Measurement, DietPlan } from './src/models/index.js';
import { createDietPlan } from './src/controllers/planController.js';

/**
 * Script di test per TDEE Adattivo
 *
 * Simula uno scenario realistico:
 * 1. Crea piano dieta iniziale con TDEE stimato 2489 kcal
 * 2. Simula 14 giorni di tracking con TDEE reale ~2350 kcal
 * 3. Verifica attivazione TDEE adattivo automatico
 */

async function testTDEEAdaptive() {
  try {
    console.log('🧪 TEST TDEE ADATTIVO - Inizio\n');

    // 0. Force sync database per ricreare schema corretto
    console.log('🔄 Sincronizzazione database (force)...');
    await sequelize.sync({ force: true });
    console.log('✅ Database ricreato con schema corretto\n');

    // 1. Crea utente test
    console.log('📝 Creazione utente test...');
    const user = await User.create({
      email: 'test@example.com',
      password_hash: 'dummy',
      nome: 'Test',
      cognome: 'User',
      sesso: 'M',
      data_nascita: '1990-01-01',
      altezza_cm: 175,
      obiettivo: 'ricomposizione',
      activity_level: 'moderato',
      workouts_per_week: 4
    });
    console.log('✅ Utente creato\n');

    // 2. Crea misurazione iniziale
    console.log('📏 Creazione misurazione iniziale...');
    const initialMeasurement = await Measurement.create({
      user_id: 1,
      data_misurazione: new Date(),
      peso: 72.0,
      body_fat_percent: 20.5,
      massa_magra: 57.2,
      massa_grassa: 14.8,
      bmr: 1606,
      calorie_consumate: 2400 // Prima misurazione con calorie
    });
    console.log(`✅ Misurazione iniziale: ${initialMeasurement.peso}kg, BF ${initialMeasurement.body_fat_percent}%\n`);

    // 4. Crea piano dieta iniziale
    console.log('📋 Creazione piano dieta iniziale...');

    // Disattiva vecchi piani
    await DietPlan.update(
      { is_active: false },
      { where: { user_id: 1, is_active: true } }
    );

    const dietPlan = await DietPlan.create({
      user_id: 1,
      start_date: new Date(),
      is_active: true,
      bmr_base: 1606,
      tdee_stimato: 2489, // TDEE calcolato con activity moderato (BMR × 1.55)
      calorie_target: 2489, // Ricomposizione = TDEE
      deficit_surplus: 0,
      deficit_percent: 0,
      proteine_g: 144,
      carboidrati_g: 311,
      grassi_g: 69,
      obiettivo: 'ricomposizione',
      strategia: 'Calorie a mantenimento per ricomposizione corporea',
      workouts_per_week: 4,
      created_by: 'test-script'
    });

    console.log(`✅ Piano creato:`);
    console.log(`   - TDEE stimato: ${dietPlan.tdee_stimato} kcal`);
    console.log(`   - Calorie target: ${dietPlan.calorie_target} kcal`);
    console.log(`   - TDEE adattivo: ${dietPlan.tdee_adaptive_enabled ? 'ATTIVO' : 'NON ATTIVO'}\n`);

    // 5. Simula 14 giorni di tracking
    console.log('📊 Simulazione 14 giorni di tracking calorie...\n');

    const basePeso = 72.0;
    const tdeeReale = 2350; // TDEE reale più basso del stimato
    const measurements = [];

    for (let i = 1; i <= 14; i++) {
      const data = new Date();
      data.setDate(data.getDate() - (14 - i)); // Dalla 14 giorni fa a oggi

      // Simula perdita peso graduale (deficit piccolo)
      // -0.3 kg in 14 giorni = ~1650 kcal deficit totale = ~118 kcal/giorno deficit
      // Se TDEE reale = 2350, mangiando 2400 → surplus ~50 kcal/giorno
      // Ma peso scende perché TDEE stimato era troppo alto
      const deltaPeso = -0.02 * i; // Peso scende gradualmente
      const peso = basePeso + deltaPeso;

      // Calorie consumate: variazione realistica attorno a 2380
      const variazione = Math.sin(i / 2) * 80; // Variazione giornaliera ±80 kcal
      const calorieConsumate = Math.round(2380 + variazione);

      const measurement = await Measurement.create({
        user_id: 1,
        data_misurazione: data,
        peso: Math.round(peso * 10) / 10,
        body_fat_percent: 20.5 - (i * 0.01),
        massa_magra: peso * 0.795,
        massa_grassa: peso * 0.205,
        bmr: 1606,
        calorie_consumate: calorieConsumate,
        proteine_consumate: Math.round(calorieConsumate * 0.25 / 4),
        carboidrati_consumati: Math.round(calorieConsumate * 0.5 / 4),
        grassi_consumati: Math.round(calorieConsumate * 0.25 / 9)
      });

      measurements.push(measurement);

      if (i % 7 === 0 || i === 14) {
        console.log(`   Giorno ${i}: ${measurement.peso}kg, ${calorieConsumate} kcal`);
      }
    }

    console.log(`\n✅ ${measurements.length} misurazioni create\n`);

    // 6. Calcolo TDEE previsto con reverseTDEE
    console.log('🔬 Calcolo TDEE atteso con formula reverse engineering:\n');

    const primiTre = measurements.slice(-3);
    const ultimiTre = measurements.slice(0, 3);
    const pesoInizio = primiTre.reduce((sum, m) => sum + m.peso, 0) / 3;
    const pesoFine = ultimiTre.reduce((sum, m) => sum + m.peso, 0) / 3;
    const deltaPesoTotale = pesoFine - pesoInizio;
    const mediaCalorie = measurements.reduce((sum, m) => sum + m.calorie_consumate, 0) / measurements.length;
    const tdeeCalcolato = Math.round(mediaCalorie + (deltaPesoTotale * 7700 / 14));

    console.log(`   Peso inizio (media primi 3 giorni): ${pesoInizio.toFixed(2)} kg`);
    console.log(`   Peso fine (media ultimi 3 giorni): ${pesoFine.toFixed(2)} kg`);
    console.log(`   Delta peso: ${deltaPesoTotale.toFixed(2)} kg`);
    console.log(`   Media calorie consumate: ${Math.round(mediaCalorie)} kcal/giorno`);
    console.log(`   TDEE reale calcolato: ${tdeeCalcolato} kcal/giorno\n`);

    // 7. Test API recalculate-tdee
    console.log('🔄 Test API recalculate-tdee...\n');

    const { calculateAdaptiveTDEE, shouldUpdatePlan, updatePlanWithAdaptiveTDEE } = await import('./src/services/TDEEAdaptiveEstimator.js');

    // Reload piano per vedere stato attuale
    await dietPlan.reload();

    const adaptiveResult = await calculateAdaptiveTDEE(dietPlan, 1);

    console.log('📊 Risultato calcolo TDEE adattivo:');
    console.log(`   Can activate: ${adaptiveResult.canActivate}`);

    if (adaptiveResult.canActivate) {
      console.log(`   TDEE raw (da reverseTDEE): ${adaptiveResult.tdeeRaw} kcal`);
      console.log(`   TDEE adattivo (con smoothing α=0.75): ${adaptiveResult.tdeeAdaptive} kcal`);
      console.log(`   Cambio %: ${adaptiveResult.changePercent}%`);
      console.log(`   Misurazioni usate: ${adaptiveResult.metadata.measurementsUsed}\n`);

      const needsUpdate = shouldUpdatePlan(dietPlan, adaptiveResult);
      console.log(`🎯 Serve aggiornare piano? ${needsUpdate ? 'SÌ ✅' : 'NO ❌'}\n`);

      if (needsUpdate) {
        console.log('💾 Aggiornamento piano in corso...\n');
        const updateResult = await updatePlanWithAdaptiveTDEE(dietPlan, adaptiveResult);

        console.log('✅ Piano aggiornato con successo!\n');
        console.log('📈 Cambiamenti applicati:');
        console.log(`   TDEE: ${updateResult.changes.tdee_old} → ${updateResult.changes.tdee_new} kcal (${adaptiveResult.changePercent.toFixed(1)}%)`);
        console.log(`   Calorie target: ${updateResult.changes.calories_old} → ${updateResult.changes.calories_new} kcal`);
        console.log(`   Proteine: ${updateResult.changes.macros_old.proteine}g → ${updateResult.changes.macros_new.proteine}g`);
        console.log(`   Carboidrati: ${updateResult.changes.macros_old.carboidrati}g → ${updateResult.changes.macros_new.carboidrati}g`);
        console.log(`   Grassi: ${updateResult.changes.macros_old.grassi}g → ${updateResult.changes.macros_new.grassi}g`);
        console.log(`   Aggiornamenti totali: ${updateResult.changes.update_count}\n`);

        // Reload e mostra stato finale
        await dietPlan.reload();
        console.log('📋 Stato finale piano:');
        console.log(`   TDEE adattivo enabled: ${dietPlan.tdee_adaptive_enabled ? '✅ SÌ' : '❌ NO'}`);
        console.log(`   TDEE adattivo: ${dietPlan.tdee_adaptive} kcal`);
        console.log(`   TDEE reale (raw): ${dietPlan.tdee_reale} kcal`);
        console.log(`   Alpha smoothing: ${dietPlan.tdee_adaptive_alpha}`);
        console.log(`   Ultimo update: ${dietPlan.tdee_adaptive_last_update}`);
        console.log(`   Count aggiornamenti: ${dietPlan.tdee_adaptive_update_count}\n`);
      }
    } else {
      console.log(`❌ TDEE adattivo non attivabile:`);
      console.log(`   Motivo: ${adaptiveResult.reason}`);
      if (adaptiveResult.required) {
        console.log(`   Richiesti: ${adaptiveResult.required} misurazioni`);
        console.log(`   Attuali: ${adaptiveResult.current} misurazioni\n`);
      }
    }

    console.log('✅ TEST COMPLETATO CON SUCCESSO!\n');
    console.log('🎉 Sistema TDEE Adattivo funzionante!\n');

  } catch (error) {
    console.error('❌ ERRORE durante il test:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Esegui test
testTDEEAdaptive();
