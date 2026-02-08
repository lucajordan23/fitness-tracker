import sequelize, { syncDatabase } from './src/config/database.js';
import './src/models/index.js'; // Carica tutti i models

/**
 * Script temporaneo per aggiungere campi TDEE adattivo a DietPlan
 * Esegui una volta con: node migrate-tdee-adaptive.js
 */

async function migrate() {
  console.log('🔄 Migrating database: adding TDEE adaptive fields to DietPlan...');

  try {
    // Sync con alter: true per aggiungere nuove colonne
    const success = await syncDatabase(false, true);

    if (success) {
      console.log('✅ Migration completed successfully!');
      console.log('📝 Added fields to diet_plans table:');
      console.log('   - tdee_adaptive_enabled (BOOLEAN)');
      console.log('   - tdee_adaptive (INTEGER)');
      console.log('   - tdee_adaptive_alpha (REAL)');
      console.log('   - tdee_adaptive_last_update (DATE)');
      console.log('   - tdee_adaptive_update_count (INTEGER)');
      console.log('   - require_calorie_tracking (BOOLEAN)');
    } else {
      console.error('❌ Migration failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrate();
