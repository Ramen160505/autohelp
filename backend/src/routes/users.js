const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.post('/telegram-link', auth, async (req, res) => {
  try {
    const user = req.user;
    if (user.telegram_id) {
      return res.status(400).json({ error: 'Telegram вже підключено.' });
    }
    
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
    user.telegram_verify_token = token;
    await user.save();
    
    res.json({ token, bot_username: process.env.TELEGRAM_BOT_USERNAME || 'the_auto_help_bot' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.delete('/telegram-link', auth, async (req, res) => {
  try {
    req.user.telegram_id = null;
    req.user.telegram_verify_token = null;
    await req.user.save();
    res.json({ message: 'Telegram відключено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

router.put('/me', auth, async (req, res) => {
  try {
    const { name, car_brand, car_model, car_color, car_plate, has_tow_hook, services_offered, avatar_url, last_lat, last_lng } = req.body;
    const user = req.user;
    if (name) user.name = name;
    if (car_brand !== undefined) user.car_brand = car_brand;
    if (car_model !== undefined) user.car_model = car_model;
    if (car_color !== undefined) user.car_color = car_color;
    if (car_plate !== undefined) user.car_plate = car_plate;
    if (has_tow_hook !== undefined) user.has_tow_hook = has_tow_hook;
    if (services_offered !== undefined) user.services_offered = services_offered;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (last_lat !== undefined) user.last_lat = last_lat;
    if (last_lng !== undefined) user.last_lng = last_lng;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const topUsers = await User.findAll({
      order: [
        ['help_count', 'DESC'],
        ['rating', 'DESC']
      ],
      limit: 10,
      attributes: ['id', 'name', 'avatar_url', 'rating', 'help_count', 'car_brand', 'car_model']
    });
    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ error: 'Помилка завантаження рейтингу' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['sms_code', 'sms_code_expires'] },
    });
    if (!user) return res.status(404).json({ error: 'Не знайдено' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
