/**
 * Migration: Aggiunge campi Kalman Filter al modello DietPlan
 *
 * Esegui con: node backend/migrations/add-kalman-fields.js
 */

import sequelize, { syncDatabase } from '../src/config/database.js';
import DietPlan from '../src/models/DietPlan.js';

async function migrate() {
  try {
    console.log('🔄 Migrazione: Aggiunta campi Kalman Filter...\n');

    // Sync database con alter: true (aggiunge colonne mancanti)
    await sequelize.sync({ alter: true });

    console.log('✅ Campi Kalman aggiunti con successo!');
    console.log('\nCampi aggiunti:');
    console.log('  - kalman_variance (REAL)');
    console.log('  - kalman_gain (REAL)');
    console.log('  - kalman_confidence_lower (INTEGER)');
    console.log('  - kalman_confidence_upper (INTEGER)\n');

    // Verifica
    const plan = await DietPlan.findOne();
    if (plan) {
      console.log('📊 Esempio record:');
      console.log(`  TDEE Adaptive: ${plan.tdee_adaptive}`);
      console.log(`  Kalman Variance: ${plan.kalman_variance}`);
      console.log(`  Kalman Gain: ${plan.kalman_gain}`);
      console.log(`  Confidence: [${plan.kalman_confidence_lower}, ${plan.kalman_confidence_upper}]`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore migrazione:', error);
    process.exit(1);
  }
}

migrate();
