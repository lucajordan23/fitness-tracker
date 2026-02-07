import sequelize from '../config/database.js';
import User from './User.js';
import Measurement from './Measurement.js';
import DietPlan from './DietPlan.js';
import WorkoutPlan from './WorkoutPlan.js';

/**
 * Setup associazioni tra models
 */

// User hasMany Measurements
User.hasMany(Measurement, {
  foreignKey: 'user_id',
  as: 'measurements'
});
Measurement.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User hasMany DietPlans
User.hasMany(DietPlan, {
  foreignKey: 'user_id',
  as: 'dietPlans'
});
DietPlan.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User hasMany WorkoutPlans
User.hasMany(WorkoutPlan, {
  foreignKey: 'user_id',
  as: 'workoutPlans'
});
WorkoutPlan.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Export models e sequelize
export {
  sequelize,
  User,
  Measurement,
  DietPlan,
  WorkoutPlan
};

export default {
  sequelize,
  User,
  Measurement,
  DietPlan,
  WorkoutPlan
};
