import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path al database SQLite
const dbPath = process.env.DB_PATH || join(__dirname, '../../database/fitness.db');

// Configurazione Sequelize con SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});

/**
 * Test connessione database
 */
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

/**
 * Sincronizza models con database
 * @param {boolean} force - Se true, droppa e ricrea tutte le tabelle (ATTENZIONE: cancella dati!)
 */
export async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Database synchronized${force ? ' (tables recreated)' : ''}.`);
    return true;
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    return false;
  }
}

export default sequelize;
