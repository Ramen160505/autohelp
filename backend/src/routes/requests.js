const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const Request = require('../models/Request');
const User = require('../models/User');
const { Chat } = require('../models/Chat');

const router = express.Router();

// Haversine distance in km
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Create request
router.post('/', auth, async (req, res) => {
  try {
    const { type, latitude, longitude, description, reward_type, reward_amount, radius_km, photo_url } = req.body;
    if (!type || !latitude || !longitude) return res.status(400).json({ error: 'Тип та місцезнаходження обов\'язкові' });
    const request = await Request.create({
      user_id: req.user.id, type, latitude, longitude,
      description, reward_type: reward_type || 'negotiable',
      reward_amount, radius_km: radius_km || 10, photo_url
    });
    // Create chat for this request
    await Chat.create({ request_id: request.id });

    // Emit new_request via socket (attached to app)
    const io = req.app.get('io');
    if (io) io.emit('new_request', { ...request.toJSON(), user: { name: req.user.name, rating: req.user.rating } });

    res.status(201).json(request);

    // Notify nearby helpers via Telegram asynchronously
    try {
      const { notifyHelpers } = require('../services/telegram');
      const allUsers = await User.findAll({ where: { is_admin: false, id: { [require('sequelize').Op.ne]: req.user.id } } });
      const nearbyHelpers = allUsers.filter(u => {
        if (!u.telegram_id || !u.last_lat || !u.last_lng) return false;
        // Check if helper is within the request's radius
        return distance(latitude, longitude, u.last_lat, u.last_lng) <= (radius_km || 10);
      });
      if (nearbyHelpers.length > 0) notifyHelpers(nearbyHelpers, request);
    } catch (notifyErr) {
      console.error('Error notifying helpers:', notifyErr);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Get nearby requests
router.get('/', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 10, type, reward_type } = req.query;
    const where = { status: 'active' };
    if (type) where.type = type;
    if (reward_type) where.reward_type = reward_type;

    const requests = await Request.findAll({ where, order: [['created_at', 'DESC']] });

    // Filter by distance if coords provided
    let filtered = requests;
    if (lat && lng) {
      filtered = requests.filter(r => distance(parseFloat(lat), parseFloat(lng), r.latitude, r.longitude) <= parseFloat(radius));
    }

    // Attach user info
    const withUsers = await Promise.all(filtered.map(async r => {
      const user = await User.findByPk(r.user_id, { attributes: ['id','name','rating','car_brand','car_model','avatar_url'] });
      return { ...r.toJSON(), user };
    }));

    res.json(withUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// My requests
router.get('/my', auth, async (req, res) => {
  try {
    const asRequester = await Request.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']] });
    const asHelper = await Request.findAll({ where: { helper_id: req.user.id }, order: [['created_at', 'DESC']] });
    res.json({ as_requester: asRequester, as_helper: asHelper });
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Get single request
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Не знайдено' });
    const user = await User.findByPk(request.user_id, { attributes: ['id','name','rating','car_brand','car_model','avatar_url'] });
    let helper = null;
    if (request.helper_id) helper = await User.findByPk(request.helper_id, { attributes: ['id','name','rating','car_brand','car_model','avatar_url'] });
    const chat = await Chat.findOne({ where: { request_id: request.id } });
    res.json({ ...request.toJSON(), user, helper, chat_id: chat?.id });
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Take request (helper responds)
router.put('/:id/take', auth, async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Не знайдено' });
    if (request.status !== 'active') return res.status(400).json({ error: 'Заявка вже взята або завершена' });
    if (request.user_id === req.user.id) return res.status(400).json({ error: 'Не можна брати власну заявку' });

    request.status = 'taken';
    request.helper_id = req.user.id;
    await request.save();

    const io = req.app.get('io');
    if (io) io.emit('request_taken', { request_id: request.id, helper_id: req.user.id, helper_name: req.user.name });

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Complete request
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Не знайдено' });
    if (!['taken'].includes(request.status)) return res.status(400).json({ error: 'Неможливо завершити' });

    request.status = 'completed';
    request.completed_at = new Date();
    await request.save();

    // Update helper's help_count
    if (request.helper_id) {
      const helper = await User.findByPk(request.helper_id);
      if (helper) { helper.help_count += 1; await helper.save(); }
    }

    const io = req.app.get('io');
    if (io) io.to(`request_${request.id}`).emit('completed', { request_id: request.id });

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Cancel request
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Не знайдено' });
    if (request.user_id !== req.user.id && !req.user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
    request.status = 'cancelled';
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
