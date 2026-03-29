const express = require('express');
const auth = require('../middleware/auth');
const { Rating, Complaint } = require('../models/Rating');
const User = require('../models/User');
const Request = require('../models/Request');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { request_id, to_user_id, score, comment } = req.body;
    if (!request_id || !to_user_id || !score) return res.status(400).json({ error: 'Всі поля обов\'язкові' });
    if (score < 1 || score > 5) return res.status(400).json({ error: 'Оцінка від 1 до 5' });

    const existing = await Rating.findOne({ where: { request_id, from_user_id: req.user.id } });
    if (existing) return res.status(400).json({ error: 'Ви вже оцінили цю допомогу' });

    const rating = await Rating.create({ request_id, from_user_id: req.user.id, to_user_id, score, comment });

    // Recalculate user rating
    const allRatings = await Rating.findAll({ where: { to_user_id } });
    const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
    const targetUser = await User.findByPk(to_user_id);
    if (targetUser) { targetUser.rating = Math.round(avg * 10) / 10; await targetUser.save(); }

    res.status(201).json(rating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
