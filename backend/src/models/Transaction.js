const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // to set relationship

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  type: { 
    type: DataTypes.ENUM('topup', 'commission_fee', 'reward'), 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM('pending', 'completed', 'failed'), 
    defaultValue: 'completed' 
  },
  reference: { type: DataTypes.STRING }, // e.g. MonoBank order ID or request ID
}, { tableName: 'transactions', underscored: true });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Transaction;
