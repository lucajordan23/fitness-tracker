import sequelize from './src/config/database.js';
import { User, Measurement, DietPlan } from './src/models/index.js';

/**
 * Script per popolare dati di esempio per testing calorie tracking
 * Esegui con: node seed-calorie-data.js
 */

async function seedCalorieData() {
  try {
    console.log('🌱 Seeding calorie data for testing...\n');

    // Force sync database per schema corretto
    console.log('🔄 Ricreando database con schema corretto...');
    await sequelize.sync({ force: true });
    console.log('✅ Database ricreato\n');

    // Verifica che esista un utente
    let user = await User.findByPk(1);

    if (!user) {
      console.log('📝 Creando utente test...');
      user = await User.create({
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
    }

    // Crea misurazione iniziale se non esiste
    const hasMeasurements = await Measurement.count({ where: { user_id: 1 } });

    if (hasMeasurements === 0) {
      console.log('📏 Creando misurazione iniziale...');
      await Measurement.create({
        user_id: 1,
        data_misurazione: new Date(),
        peso: 72.0,
        body_fat_percent: 20.5,
        massa_magra: 57.2,
        massa_grassa: 14.8,
        bmr: 1606
      });
      console.log('✅ Misurazione iniziale creata\n');
    }

    // Crea piano dieta se non esiste
    const hasDietPlan = await DietPlan.count({ where: { user_id: 1, is_active: true } });

    if (hasDietPlan === 0) {
      console.log('📋 Creando piano dieta...');
      await DietPlan.create({
        user_id: 1,
        start_date: new Date(),
        is_active: true,
        bmr_base: 1606,
        tdee_stimato: 2489,
        calorie_target: 2489,
        deficit_surplus: 0,
        deficit_percent: 0,
        proteine_g: 144,
        carboidrati_g: 311,
        grassi_g: 69,
        obiettivo: 'ricomposizione',
        strategia: 'Piano di esempio per testing',
        workouts_per_week: 4
      });
      console.log('✅ Piano dieta creato\n');
    }

    // Crea 7 giorni di dati calorie con dettaglio pasti
    console.log('🍽️ Creando 7 giorni di dati calorie...\n');

    const calorieData = [
      // Oggi
      { colazione: 450, pranzo: 800, cena: 900, spuntini: 350 },
      // Ieri
      { colazione: 500, pranzo: 750, cena: 850, spuntini: 300 },
      // 2 giorni fa
      { colazione: 480, pranzo: 820, cena: 880, spuntini: 320 },
      // 3 giorni fa
      { colazione: 520, pranzo: 780, cena: 920, spuntini: 280 },
      // 4 giorni fa
      { colazione: 460, pranzo: 800, cena: 890, spuntini: 340 },
      // 5 giorni fa
      { colazione: 490, pranzo: 770, cena: 910, spuntini: 310 },
      // 6 giorni fa
      { colazione: 510, pranzo: 790, cena: 870, spuntini: 330 }
    ];

    for (let i = 0; i < calorieData.length; i++) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      data.setHours(0, 0, 0, 0);

      const meal = calorieData[i];
      const totale = meal.colazione + meal.pranzo + meal.cena + meal.spuntini;

      // Usa findOrCreate per non duplicare
      const [measurement, created] = await Measurement.findOrCreate({
        where: {
          user_id: 1,
          data_misurazione: data
        },
        defaults: {
          user_id: 1,
          data_misurazione: data,
          peso: 72.0 - (i * 0.1), // Peso che scende gradualmente
          body_fat_percent: 20.5,
          massa_magra: 57.2,
          massa_grassa: 14.8,
          bmr: 1606,
          calorie_consumate: totale,
          colazione_kcal: meal.colazione,
          pranzo_kcal: meal.pranzo,
          cena_kcal: meal.cena,
          spuntini_kcal: meal.spuntini,
          proteine_consumate: Math.round(totale * 0.25 / 4),
          carboidrati_consumati: Math.round(totale * 0.5 / 4),
          grassi_consumati: Math.round(totale * 0.25 / 9)
        }
      });

      if (!created) {
        // Aggiorna solo i campi calorie se già esiste
        await measurement.update({
          calorie_consumate: totale,
          colazione_kcal: meal.colazione,
          pranzo_kcal: meal.pranzo,
          cena_kcal: meal.cena,
          spuntini_kcal: meal.spuntini
        });
      }

      const dateStr = data.toLocaleDateString('it-IT');
      console.log(`   ${created ? '✅ Creato' : '🔄 Aggiornato'} ${dateStr}: ${totale} kcal (C: ${meal.colazione}, P: ${meal.pranzo}, Ce: ${meal.cena}, S: ${meal.spuntini})`);
    }

    console.log('\n✅ Seed completato con successo!\n');
    console.log('🎯 Ora puoi:');
    console.log('   1. Aprire la dashboard e vedere il pannello "Calorie di Oggi"');
    console.log('   2. Modificare le calorie di oggi');
    console.log('   3. Andare al tab "🍽️ Calorie" per vedere lo storico');
    console.log('   4. Cliccare su una riga per espandere i dettagli dei pasti\n');

  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedCalorieData();
