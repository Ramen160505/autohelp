const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  request_id: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'chats', underscored: true });

const Message = sequelize.define('Message', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  chat_id: { type: DataTypes.UUID, allowNull: false },
  sender_id: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('text', 'image', 'voice'), defaultValue: 'text' },
  content: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'messages', underscored: true });

module.exports = { Chat, Message };
