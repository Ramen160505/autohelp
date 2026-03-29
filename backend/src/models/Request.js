const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Request = sequelize.define('Request', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('battery', 'fuel', 'tire', 'tow', 'other'), allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  radius_km: { type: DataTypes.INTEGER, defaultValue: 10 },
  description: { type: DataTypes.TEXT },
  reward_type: { type: DataTypes.ENUM('free', 'fixed', 'negotiable'), defaultValue: 'negotiable' },
  reward_amount: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('active', 'taken', 'completed', 'cancelled'), defaultValue: 'active' },
  helper_id: { type: DataTypes.UUID },
  completed_at: { type: DataTypes.DATE },
}, { tableName: 'requests', underscored: true });

module.exports = Request;
