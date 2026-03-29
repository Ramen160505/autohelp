const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rating = sequelize.define('Rating', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  request_id: { type: DataTypes.UUID, allowNull: false },
  from_user_id: { type: DataTypes.UUID, allowNull: false },
  to_user_id: { type: DataTypes.UUID, allowNull: false },
  score: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT },
}, { tableName: 'ratings', underscored: true });

const Complaint = sequelize.define('Complaint', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reporter_id: { type: DataTypes.UUID, allowNull: false },
  reported_user_id: { type: DataTypes.UUID, allowNull: false },
  request_id: { type: DataTypes.UUID },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'resolved', 'rejected'), defaultValue: 'pending' },
}, { tableName: 'complaints', underscored: true });

module.exports = { Rating, Complaint };
