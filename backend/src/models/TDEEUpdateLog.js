import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Model TDEEUpdateLog - Log interno per debug aggiornamenti TDEE
 * Traccia ogni tentativo di aggiornamento (riuscito o fallito)
 */
const TDEEUpdateLog = sequelize.define('tdee_update_logs', {
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
  diet_plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'diet_plans',
      key: 'id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  // Valori TDEE
  tdee_adaptive_previous: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'TDEE adattivo prima dell\'aggiornamento (null se prima attivazione)'
  },
  tdee_real_calculated: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'TDEE reale calcolato da reverseTDEE'
  },
  tdee_adaptive_new: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'TDEE adattivo dopo smoothing (null se non aggiornato)'
  },

  // Metriche calcolo
  delta_peso_kg: {
    type: DataTypes.REAL,
    allowNull: true,
    comment: 'Delta peso (kg) nella finestra temporale'
  },
  delta_giorni: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Giorni della finestra di calcolo'
  },
  measurements_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Numero misurazioni con calorie usate'
  },
  change_percent: {
    type: DataTypes.REAL,
    allowNull: true,
    comment: 'Percentuale cambio TDEE'
  },

  // Esito
  updated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Se true, piano è stato aggiornato'
  },
  failure_reason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Motivo interruzione aggiornamento'
  },

  // Metadata
  alpha_smoothing: {
    type: DataTypes.REAL,
    allowNull: true,
    comment: 'Coefficiente smoothing usato'
  }
}, {
  timestamps: false,
  indexes: [
    {
      fields: ['user_id', 'timestamp']
    },
    {
      fields: ['diet_plan_id']
    },
    {
      fields: ['updated']
    }
  ]
});

export default TDEEUpdateLog;
