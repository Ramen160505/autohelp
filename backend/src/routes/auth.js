const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const router = express.Router();

// Generate and send SMS code
router.post('/register', async (req, res) => {
  try {
    const { phone, name, car_brand, car_model, has_tow_hook } = req.body;
    if (!phone || !name) return res.status(400).json({ error: 'Телефон та ім\'я обов\'язкові' });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    let user = await User.findOne({ where: { phone } });
    if (user) {
      user.sms_code = code;
      user.sms_code_expires = expires;
      if (name) user.name = name;
      if (car_brand) user.car_brand = car_brand;
      if (car_model) user.car_model = car_model;
      if (has_tow_hook !== undefined) user.has_tow_hook = has_tow_hook;
      await user.save();
    } else {
      user = await User.create({ phone, name, car_brand, car_model, has_tow_hook, sms_code: code, sms_code_expires: expires });
    }

    // MVP: log code to console and send to frontend
    console.log(`\n📱 SMS КОД для ${phone}: ${code}\n`);
    res.json({ message: 'SMS-код надіслано', phone, dev_code: code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Verify SMS code and get token
router.post('/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
    if (user.sms_code !== code) return res.status(400).json({ error: 'Невірний код' });
    if (new Date() > user.sms_code_expires) return res.status(400).json({ error: 'Код прострочено' });

    user.sms_code = null;
    user.sms_code_expires = null;
    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, rating: user.rating, is_admin: user.is_admin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Quick login (re-send code)
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено. Спочатку зареєструйтесь.' });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    user.sms_code = code;
    user.sms_code_expires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`\n📱 SMS КОД для ${phone}: ${code}\n`);
    res.json({ message: 'SMS-код надіслано', phone, dev_code: code });
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
