import sequelize, { syncDatabase } from './src/config/database.js';
import './src/models/index.js'; // Carica tutti i models

/**
 * Script migrazione: aggiunge campi pasti a Measurement
 * Esegui con: node migrate-meals.js
 */

async function migrate() {
  console.log('🔄 Migrating database: adding meal fields to Measurement...\n');

  try {
    // Sync con alter: true per aggiungere nuove colonne senza cancellare dati
    const success = await syncDatabase(false, true);

    if (success) {
      console.log('✅ Migration completed successfully!\n');
      console.log('📝 Added fields to measurements table:');
      console.log('   - colazione_kcal (INTEGER)');
      console.log('   - pranzo_kcal (INTEGER)');
      console.log('   - cena_kcal (INTEGER)');
      console.log('   - spuntini_kcal (INTEGER)\n');
      console.log('🎉 Ora puoi tracciare le calorie per pasto!\n');
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
