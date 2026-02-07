import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { sequelize, User, Measurement, DietPlan, WorkoutPlan } from '../models/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script inizializzazione database
 * Crea tutte le tabelle e inserisce utente default per testing
 */
async function initDatabase() {
  try {
    console.log('🚀 Inizializzazione database...\n');

    // Crea directory database se non esiste
    const dbDir = join(__dirname, '../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('📁 Directory database creata');
    }

    // Test connessione
    await sequelize.authenticate();
    console.log('✅ Connessione database stabilita\n');

    // Sync models (crea tabelle)
    console.log('📊 Creazione tabelle...');
    await sequelize.sync({ force: true }); // force: true = droppa e ricrea (ATTENZIONE: cancella dati!)
    console.log('✅ Tabelle create con successo\n');

    // Crea utente default per testing
    console.log('👤 Creazione utente default...');
    const defaultUser = await User.create({
      nome: 'Lorenzo',
      cognome: 'Test',
      sesso: 'M',
      data_nascita: '1999-01-01',
      altezza_cm: 174,
      activity_level: 'moderato',
      obiettivo: 'ricomposizione'
    });
    console.log(`✅ Utente default creato: ID ${defaultUser.id}\n`);

    // Crea misurazione di esempio (dati dal CLAUDE.md)
    console.log('📏 Creazione misurazione di esempio...');
    const measurement = await Measurement.create({
      user_id: defaultUser.id,
      data_misurazione: new Date(),
      peso: 71.9,
      body_fat_percent: 22.3,
      massa_magra: 55.9,
      massa_grassa: 71.9 * (22.3 / 100), // 16.0 kg
      bmr: 1606,
      bmi: 71.9 / ((174 / 100) ** 2), // ~23.8
      grasso_viscerale: 9,
      acqua_percent: 58.2,
      massa_ossea: 3.1
    });
    console.log(`✅ Misurazione di esempio creata: ID ${measurement.id}\n`);

    console.log('🎉 Database inizializzato con successo!');
    console.log('\n📋 Riepilogo:');
    console.log(`   - Utente default: ID ${defaultUser.id} (${defaultUser.nome} ${defaultUser.cognome})`);
    console.log(`   - Peso: ${measurement.peso}kg`);
    console.log(`   - Body Fat: ${measurement.body_fat_percent}%`);
    console.log(`   - Massa Magra: ${measurement.massa_magra}kg`);
    console.log(`   - BMR: ${measurement.bmr} kcal/giorno`);
    console.log(`   - Obiettivo: ${defaultUser.obiettivo}`);
    console.log(`   - Activity Level: ${defaultUser.activity_level}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante inizializzazione database:', error);
    process.exit(1);
  }
}

// Esegui inizializzazione
initDatabase();
