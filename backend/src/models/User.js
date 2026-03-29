const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  phone: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  avatar_url: { type: DataTypes.STRING },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  help_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  car_brand: { type: DataTypes.STRING },
  car_model: { type: DataTypes.STRING },
  car_color: { type: DataTypes.STRING },
  car_plate: { type: DataTypes.STRING },
  has_tow_hook: { type: DataTypes.BOOLEAN, defaultValue: false },
  services_offered: { type: DataTypes.TEXT, defaultValue: '[]',
    get() { try { return JSON.parse(this.getDataValue('services_offered')); } catch { return []; } },
    set(val) { this.setDataValue('services_offered', JSON.stringify(val)); }
  },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  sms_code: { type: DataTypes.STRING },
  sms_code_expires: { type: DataTypes.DATE },
  telegram_id: { type: DataTypes.STRING, unique: true },
  telegram_verify_token: { type: DataTypes.STRING },
  last_lat: { type: DataTypes.FLOAT },
  last_lng: { type: DataTypes.FLOAT },
  is_business: { type: DataTypes.BOOLEAN, defaultValue: false },
  business_name: { type: DataTypes.STRING },
}, { tableName: 'users', underscored: true });

module.exports = User;
