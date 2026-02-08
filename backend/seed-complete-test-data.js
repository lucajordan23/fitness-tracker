import sequelize from './src/config/database.js';
import { User, Measurement, DietPlan } from './src/models/index.js';

/**
 * Script seed COMPLETO per generare dati di test realistici
 * Genera: 60 giorni di misurazioni + calorie + macros + piano dieta
 * Esegui con: node seed-complete-test-data.js
 */

async function seedCompleteTestData() {
  try {
    console.log('🌱 Seeding COMPLETE test data (60 days)...\n');

    // Force sync database
    console.log('🔄 Ricreando database con schema corretto...');
    await sequelize.sync({ force: true });
    console.log('✅ Database ricreato\n');

    // ==================== CREA UTENTE ====================
    console.log('👤 Creando utente test...');
    const user = await User.create({
      email: 'atleta@test.com',
      password_hash: 'dummy_hash_12345',
      nome: 'Marco',
      cognome: 'Rossi',
      sesso: 'M',
      data_nascita: '1992-05-15',
      altezza_cm: 178,
      obiettivo: 'cutting',
      activity_level: 'moderato',
      workouts_per_week: 5
    });
    console.log('✅ Utente creato: Marco Rossi\n');

    // ==================== CREA PIANO DIETA ====================
    console.log('📋 Creando piano dieta...');
    const dietPlan = await DietPlan.create({
      user_id: user.id,
      start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 giorni fa
      is_active: true,
      bmr_base: 1680,
      tdee_stimato: 2520, // BMR × 1.5 (moderato)
      calorie_target: 2270, // -10% deficit per definizione
      deficit_surplus: -250,
      deficit_percent: -10,
      proteine_g: 178, // 2g/kg @ 89kg
      carboidrati_g: 270,
      grassi_g: 70,
      obiettivo: 'cutting',
      strategia: 'Deficit calorico moderato per perdere grasso preservando massa magra. Proteine alte per mantenimento muscolare.',
      workouts_per_week: 5,
      tdee_adaptive_enabled: false, // Sarà attivato dopo 14 giorni
      tdee_adaptive: null,
      tdee_adaptive_alpha: 0.75,
      require_calorie_tracking: true
    });
    console.log('✅ Piano dieta creato (Target: 2270 kcal/giorno)\n');

    // ==================== GENERA 60 GIORNI DI DATI ====================
    console.log('📊 Generando 60 giorni di misurazioni...\n');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 59); // Inizia 59 giorni fa
    startDate.setHours(8, 0, 0, 0); // 8:00 AM

    // Parametri simulazione realistica
    const PESO_INIZIALE = 89.5; // kg
    const PESO_FINALE = 86.2; // kg (perdita ~3.3kg in 60 giorni = ~550g/settimana)
    const BF_INIZIALE = 18.5; // %
    const BF_FINALE = 16.2; // %

    const CALORIE_TARGET = dietPlan.calorie_target;
    const measurements = [];

    for (let i = 0; i < 60; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Trend peso con rumore realistico
      const progressRatio = i / 59;
      const trendPeso = PESO_INIZIALE - (PESO_INIZIALE - PESO_FINALE) * progressRatio;

      // Aggiungi rumore fisiologico (±0.3kg giornaliero)
      const noisePeso = (Math.random() - 0.5) * 0.6; // ±0.3kg
      const peso = Math.round((trendPeso + noisePeso) * 10) / 10;

      // Trend body fat
      const trendBF = BF_INIZIALE - (BF_INIZIALE - BF_FINALE) * progressRatio;
      const noiseBF = (Math.random() - 0.5) * 0.4; // ±0.2%
      const bodyFat = Math.round((trendBF + noiseBF) * 10) / 10;

      // Calcola composizione corporea
      const massaGrassa = Math.round(peso * (bodyFat / 100) * 10) / 10;
      const massaMagra = Math.round((peso - massaGrassa) * 10) / 10;

      // BMR (Katch-McArdle formula)
      const bmr = Math.round(370 + (21.6 * massaMagra));

      // ========== CALORIE E PASTI ==========
      // Giorni di "sforamento" casuali (1 ogni 10 giorni circa)
      const isCheatDay = Math.random() < 0.1;

      // Calorie consumate con variabilità realistica
      let calorieConsumate;
      if (isCheatDay) {
        // Cheat day: +500-800 kcal sopra target
        calorieConsumate = CALORIE_TARGET + 500 + Math.random() * 300;
      } else {
        // Giorni normali: ±200 kcal dal target (aderenza realistica)
        calorieConsumate = CALORIE_TARGET + (Math.random() - 0.5) * 400;
      }
      calorieConsumate = Math.round(calorieConsumate);

      // Distribuzione pasti realistica
      const colazione = Math.round(calorieConsumate * (0.25 + (Math.random() - 0.5) * 0.1)); // 20-30%
      const pranzo = Math.round(calorieConsumate * (0.35 + (Math.random() - 0.5) * 0.1)); // 30-40%
      const cena = Math.round(calorieConsumate * (0.30 + (Math.random() - 0.5) * 0.1)); // 25-35%
      const spuntini = calorieConsumate - colazione - pranzo - cena; // Resto

      // Macronutrienti (con distribuzione realistica)
      // Proteine: 2g/kg peso corporeo
      const proteine = Math.round(peso * 2);
      // Grassi: ~25-30% calorie
      const grassi = Math.round((calorieConsumate * 0.27) / 9);
      // Carboidrati: resto delle calorie
      const carboidrati = Math.round((calorieConsumate - (proteine * 4) - (grassi * 9)) / 4);

      // ========== SALVA MISURAZIONE ==========
      const measurement = {
        user_id: user.id,
        data_misurazione: currentDate,
        peso,
        body_fat_percent: bodyFat,
        massa_magra: massaMagra,
        massa_grassa: massaGrassa,
        bmr,
        calorie_consumate: calorieConsumate,
        colazione_kcal: colazione,
        pranzo_kcal: pranzo,
        cena_kcal: cena,
        spuntini_kcal: spuntini,
        proteine_consumate: proteine,
        carboidrati_consumati: carboidrati,
        grassi_consumati: grassi,
        grasso_viscerale: Math.round(5 + (bodyFat - 10) * 0.3), // Correlato al BF%
        note: isCheatDay ? '🍕 Cheat day!' : null
      };

      measurements.push(measurement);

      // Log progress ogni 10 giorni
      if (i % 10 === 0 || i === 59) {
        const dateStr = currentDate.toLocaleDateString('it-IT');
        console.log(`   📅 ${dateStr}: ${peso}kg, BF ${bodyFat}%, ${calorieConsumate} kcal ${isCheatDay ? '🍕' : ''}`);
      }
    }

    // Bulk insert per performance
    await Measurement.bulkCreate(measurements);
    console.log(`\n✅ Creati ${measurements.length} giorni di misurazioni!\n`);

    // ==================== STATISTICHE FINALI ====================
    const first = measurements[0];
    const last = measurements[59];

    console.log('📈 RIEPILOGO PROGRESSO (60 giorni):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Peso:     ${first.peso}kg → ${last.peso}kg (${(last.peso - first.peso).toFixed(1)}kg)`);
    console.log(`   Body Fat: ${first.body_fat_percent}% → ${last.body_fat_percent}% (${(last.body_fat_percent - first.body_fat_percent).toFixed(1)}%)`);
    console.log(`   Massa Magra: ${first.massa_magra}kg → ${last.massa_magra}kg (${(last.massa_magra - first.massa_magra).toFixed(1)}kg)`);
    console.log(`   Massa Grassa: ${first.massa_grassa}kg → ${last.massa_grassa}kg (${(last.massa_grassa - first.massa_grassa).toFixed(1)}kg)`);

    const avgCalorie = Math.round(measurements.reduce((sum, m) => sum + m.calorie_consumate, 0) / measurements.length);
    const cheatDays = measurements.filter(m => m.note?.includes('Cheat')).length;

    console.log(`\n📊 STATISTICHE CALORIE:`);
    console.log(`   Media giornaliera: ${avgCalorie} kcal`);
    console.log(`   Target piano: ${CALORIE_TARGET} kcal`);
    console.log(`   Aderenza: ${Math.round((avgCalorie / CALORIE_TARGET) * 100)}%`);
    console.log(`   Cheat days: ${cheatDays}/60`);

    console.log('\n✅ Seed completato con successo!\n');
    console.log('🎯 ORA PUOI:');
    console.log('   1. Aprire la dashboard e vedere i 3 grafici trend');
    console.log('   2. Scorrere tra: Peso, Calorie, Macronutrienti');
    console.log('   3. Andare al tab "🍽️ Calorie" per vedere lo storico dettagliato');
    console.log('   4. Vedere trend realistici di 60 giorni di cut/definizione');
    console.log('   5. Testare sistema TDEE adattivo con dati reali\n');

  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedCompleteTestData();
