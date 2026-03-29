const express = require('express');
const auth = require('../middleware/auth');
const { Complaint } = require('../models/Rating');
const User = require('../models/User');
const Request = require('../models/Request');

const router = express.Router();

// File complaint
router.post('/', auth, async (req, res) => {
  try {
    const { reported_user_id, request_id, reason } = req.body;
    if (!reported_user_id || !reason) return res.status(400).json({ error: 'Поля обов\'язкові' });
    const complaint = await Complaint.create({ reporter_id: req.user.id, reported_user_id, request_id, reason });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Admin: get all complaints
router.get('/', auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
  const complaints = await Complaint.findAll({ order: [['created_at', 'DESC']] });
  res.json(complaints);
});

// Admin: resolve/reject complaint
router.put('/:id', auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Не знайдено' });
  complaint.status = req.body.status;
  await complaint.save();
  res.json(complaint);
});

// Admin: all users
router.get('/admin/users', auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
  const users = await User.findAll({ attributes: { exclude: ['sms_code', 'sms_code_expires'] }, order: [['created_at', 'DESC']] });
  res.json(users);
});

// Admin: all requests
router.get('/admin/requests', auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
  const requests = await Request.findAll({ order: [['created_at', 'DESC']] });
  res.json(requests);
});

module.exports = router;
