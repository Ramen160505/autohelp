require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sequelize = require('./config/database');
const User = require('./models/User');
const Request = require('./models/Request');
const { Chat, Message } = require('./models/Chat');
const { Rating, Complaint } = require('./models/Rating');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const requestsRoutes = require('./routes/requests');
const ratingsRoutes = require('./routes/ratings');
const complaintsRoutes = require('./routes/complaints');
const chatsRoutes = require('./routes/chats');
const setupSocket = require('./socket/index');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.set('io', io);

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/chats', chatsRoutes);

// Admin routes (via complaints router)
app.get('/api/admin/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Немає токену' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
    const users = await User.findAll({ attributes: { exclude: ['sms_code', 'sms_code_expires'] }, order: [['created_at', 'DESC']] });
    res.json(users);
  } catch (err) { res.status(401).json({ error: 'Помилка авторизації' }); }
});

app.get('/api/admin/requests', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
    const requests = await Request.findAll({ order: [['created_at', 'DESC']] });
    res.json(requests);
  } catch (err) { res.status(401).json({ error: 'Помилка авторизації' }); }
});

app.get('/api/admin/complaints', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
    const complaints = await Complaint.findAll({ order: [['created_at', 'DESC']] });
    res.json(complaints);
  } catch (err) { res.status(401).json({ error: 'Помилка авторизації' }); }
});

app.put('/api/admin/complaints/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Немає доступу' });
    const c = await Complaint.findByPk(req.params.id);
    if (!c) return res.status(404).json({ error: 'Не знайдено' });
    c.status = req.body.status;
    await c.save();
    res.json(c);
  } catch (err) { res.status(401).json({ error: 'Помилка авторизації' }); }
});

// Setup Socket.io
setupSocket(io);

// Setup Telegram Bot
const { setupTelegram } = require('./services/telegram');
setupTelegram();

// Sync DB and start
const PORT = process.env.PORT || 3001;

async function start() {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AutoHelp сервер запущено на порту ${PORT}`);
  });

  try {
    await sequelize.sync({ alter: true });
    console.log('✅ База даних синхронізована');

    const adminPhone = '+380000000000';
    let admin = await User.findOne({ where: { phone: adminPhone } });
    if (!admin) {
      admin = await User.create({
        phone: adminPhone,
        name: 'Адміністратор',
        is_admin: true,
        is_verified: true,
        sms_code: '0000',
        sms_code_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      console.log('👤 Адмін створений: phone=+380000000000, code=0000');
    }
  } catch (error) {
    console.error('❌ Помилка бази даних:', error);
  }
}

start().catch(console.error);
