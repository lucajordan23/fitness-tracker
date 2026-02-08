import sequelize, { syncDatabase } from './src/config/database.js';
import './src/models/index.js'; // Carica tutti i models

/**
 * Script migrazione: aggiunge tabella tdee_update_logs per logging interno
 * Esegui con: node migrate-tdee-logging.js
 */

async function migrate() {
  console.log('🔄 Migrating database: adding tdee_update_logs table...\n');

  try {
    // Sync con alter: true per aggiungere nuova tabella senza cancellare dati
    const success = await syncDatabase(false, true);

    if (success) {
      console.log('✅ Migration completed successfully!\n');
      console.log('📝 Added table: tdee_update_logs');
      console.log('   Fields:');
      console.log('   - id (PRIMARY KEY)');
      console.log('   - user_id (FOREIGN KEY)');
      console.log('   - diet_plan_id (FOREIGN KEY)');
      console.log('   - timestamp');
      console.log('   - tdee_adaptive_previous');
      console.log('   - tdee_real_calculated');
      console.log('   - tdee_adaptive_new');
      console.log('   - delta_peso_kg');
      console.log('   - delta_giorni');
      console.log('   - measurements_count');
      console.log('   - change_percent');
      console.log('   - updated (BOOLEAN)');
      console.log('   - failure_reason');
      console.log('   - alpha_smoothing\n');
      console.log('🎯 Il sistema ora logga tutti i tentativi di aggiornamento TDEE!\n');
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
