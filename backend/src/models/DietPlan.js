import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Model DietPlan - Piano dieta generato/personalizzato
 */
const DietPlan = sequelize.define('diet_plans', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // === TARGET CALORICO ===
  bmr_base: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'BMR dalla bilancia al momento della creazione del piano'
  },
  tdee_stimato: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'TDEE calcolato = BMR × Activity Factor'
  },
  tdee_reale: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'TDEE reverse-engineered dai dati (se disponibile dopo 2+ settimane)'
  },
  workouts_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 7
    },
    comment: 'Numero allenamenti/settimana usato per calcolo TDEE'
  },
  workout_calories_per_session: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Calorie bruciate per allenamento (da smartwatch, opzionale)'
  },
  calorie_target: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Calorie giornaliere target'
  },
  deficit_surplus: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'kcal/giorno: negativo = deficit, positivo = surplus'
  },
  deficit_percent: {
    type: DataTypes.REAL,
    allowNull: true,
    comment: '% deficit/surplus rispetto a TDEE'
  },

  // === MACRONUTRIENTI (grammi/giorno) ===
  proteine_g: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  carboidrati_g: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  grassi_g: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // === METADATI ===
  obiettivo: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['cutting', 'bulking', 'ricomposizione', 'mantenimento']]
    }
  },
  strategia: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrizione strategia es: "Deficit moderato 20%, focus preservazione muscolo"'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // === AUDIT ===
  created_by: {
    type: DataTypes.STRING,
    defaultValue: 'sistema',
    comment: '"utente" o "sistema" (auto-generato)'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  indexes: [
    {
      fields: ['user_id', 'is_active', 'start_date']
    }
  ]
});

export default DietPlan;
