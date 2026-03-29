const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Get Wallet Balance and History
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const history = await Transaction.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({
      balance: user.balance,
      history: history
    });
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Mock Top-Up Endpoint
router.post('/topup', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Некоректна сума' });

    const user = await User.findByPk(req.user.id);
    
    // Simulate payment processing...
    // In production, this would generate a payment URL and wait for a webhook
    
    // Add to balance
    user.balance += parseFloat(amount);
    await user.save();

    // Log transaction
    const tx = await Transaction.create({
      user_id: user.id,
      amount: parseFloat(amount),
      type: 'topup',
      status: 'completed',
      reference: `MOCK_PAY_${Date.now()}`
    });

    res.json({ message: 'Баланс поповнено', balance: user.balance, transaction: tx });
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
