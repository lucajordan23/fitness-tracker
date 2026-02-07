import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Model WorkoutPlan - Piano allenamento
 */
const WorkoutPlan = sequelize.define('workout_plans', {
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

  // === PARAMETRI ALLENAMENTO ===
  frequenza_settimanale: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Giorni/settimana',
    validate: {
      min: 1,
      max: 7
    }
  },
  intensita: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['bassa', 'moderata', 'alta']]
    }
  },
  focus: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['forza', 'ipertrofia', 'endurance', 'misto']]
    }
  },
  volume_serie_totali: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Serie totali/settimana'
  },

  // === SPLITS ===
  split_type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'es: "PPL", "Upper/Lower", "Full Body"'
  },
  giorni_riposo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // === CARDIO ===
  cardio_frequenza: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Sessioni/settimana'
  },
  cardio_tipo: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'es: "LISS", "HIIT", "misto"'
  },
  cardio_durata_min: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // === METADATI ===
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  strategia: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'es: "Mantenimento forza in deficit calorico"'
  },

  // === AUDIT ===
  created_by: {
    type: DataTypes.STRING,
    defaultValue: 'sistema'
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

export default WorkoutPlan;
