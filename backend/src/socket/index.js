const { Chat, Message } = require('../models/Chat');
const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // Join chat room for a request
    socket.on('join_chat', async ({ request_id, user_id }) => {
      try {
        const room = `request_${request_id}`;
        socket.join(room);
        socket.data.user_id = user_id;
        socket.data.request_id = request_id;

        // Send message history
        const chat = await Chat.findOne({ where: { request_id } });
        if (chat) {
          const messages = await Message.findAll({
            where: { chat_id: chat.id },
            order: [['created_at', 'ASC']],
            limit: 100,
          });
          const withSenders = await Promise.all(messages.map(async (m) => {
            const sender = await User.findByPk(m.sender_id, { attributes: ['id', 'name', 'avatar_url'] });
            const senderData = sender ? { id: sender.id, name: sender.name, avatar_url: sender.avatar_url } : null;
            return { ...m.toJSON(), sender: senderData };
          }));
          socket.emit('message_history', withSenders);
        } else {
          socket.emit('message_history', []);
        }
        console.log(`👥 User ${user_id} joined room ${room}`);
      } catch (err) {
        console.error('join_chat error:', err);
        socket.emit('message_history', []);
      }
    });

    // Send a message
    socket.on('send_message', async ({ request_id, sender_id, content, type = 'text' }) => {
      try {
        const chat = await Chat.findOne({ where: { request_id } });
        if (!chat) return;

        const message = await Message.create({ chat_id: chat.id, sender_id, content, type });
        const sender = await User.findByPk(sender_id, { attributes: ['id', 'name', 'avatar_url'] });
        const senderData = sender ? { id: sender.id, name: sender.name, avatar_url: sender.avatar_url } : null;

        io.to(`request_${request_id}`).emit('new_message', { ...message.toJSON(), sender: senderData });
      } catch (err) {
        console.error('Socket send_message error:', err);
      }
    });

    // Helper arrived
    socket.on('arrived', ({ request_id, user_id }) => {
      io.to(`request_${request_id}`).emit('helper_arrived', { user_id, request_id });
      console.log(`🚗 Helper ${user_id} arrived for request ${request_id}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });
};
