const express = require('express');
const auth = require('../middleware/auth');
const { Chat, Message } = require('../models/Chat');
const User = require('../models/User');

const router = express.Router();

// Get chat messages
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Чат не знайдено' });

    const messages = await Message.findAll({
      where: { chat_id: chat.id },
      order: [['created_at', 'ASC']],
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
