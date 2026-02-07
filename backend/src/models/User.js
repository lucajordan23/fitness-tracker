import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Model User - Dati utente
 */
const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cognome: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sesso: {
    type: DataTypes.STRING(1),
    allowNull: true,
    validate: {
      isIn: [['M', 'F']]
    }
  },
  data_nascita: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  altezza_cm: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 100,
      max: 250
    }
  },
  activity_level: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'moderato',
    validate: {
      isIn: [['sedentario', 'leggero', 'moderato', 'attivo']]
    }
  },
  workouts_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 7
    },
    comment: 'Numero allenamenti a settimana (0-7) per calcolo TDEE preciso'
  },
  obiettivo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'ricomposizione',
    validate: {
      isIn: [['cutting', 'bulking', 'ricomposizione', 'mantenimento']]
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default User;
