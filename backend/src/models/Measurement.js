import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Model Measurement - Misurazioni dalla bilancia Huawei Scale 3
 * ⭐ CORE MODEL - Dati principali dell'app
 */
const Measurement = sequelize.define('measurements', {
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
  data_misurazione: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  // === DATI DALLA BILANCIA (ESSENZIALI) ===
  peso: {
    type: DataTypes.REAL,
    allowNull: false,
    validate: {
      min: 30,
      max: 300
    }
  },
  body_fat_percent: {
    type: DataTypes.REAL,
    allowNull: true,
    validate: {
      min: 3,
      max: 60
    }
  },
  massa_magra: {
    type: DataTypes.REAL,
    allowNull: true,
    validate: {
      min: 20,
      max: 200
    }
  },
  massa_muscolare: {
    type: DataTypes.REAL,
    allowNull: true
  },
  massa_grassa: {
    type: DataTypes.REAL,
    allowNull: true,
    comment: 'Calcolata da peso * (body_fat_percent / 100)'
  },
  bmi: {
    type: DataTypes.REAL,
    allowNull: true
  },
  bmr: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '⭐ DATO CHIAVE: Metabolismo basale dalla bilancia (kcal/giorno)'
  },

  // === DATI AGGIUNTIVI BILANCIA (OPZIONALI) ===
  grasso_viscerale: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 59
    }
  },
  acqua_percent: {
    type: DataTypes.REAL,
    allowNull: true
  },
  massa_ossea: {
    type: DataTypes.REAL,
    allowNull: true
  },

  // === TRACKING MANUALE (OPZIONALI) ===
  calorie_consumate: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Calorie totali giornaliere (se tracciate)'
  },
  proteine_consumate: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  carboidrati_consumati: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  grassi_consumati: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // === DETTAGLIO PASTI ===
  colazione_kcal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Calorie colazione'
  },
  pranzo_kcal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Calorie pranzo'
  },
  cena_kcal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Calorie cena'
  },
  spuntini_kcal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Calorie spuntini (somma tutti gli spuntini)'
  },

  // === DATI SOGGETTIVI ===
  energia_livello: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  sonno_ore: {
    type: DataTypes.REAL,
    allowNull: true
  },
  stress_livello: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false,
  indexes: [
    {
      fields: ['user_id', 'data_misurazione'],
      unique: true
    },
    {
      fields: ['data_misurazione']
    },
    {
      fields: ['bmr']
    }
  ]
});

export default Measurement;
