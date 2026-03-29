const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');

const token = process.env.TELEGRAM_BOT_TOKEN;

let bot = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });

  console.log('🤖 Telegram Push Bot Started');

  bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const verifyToken = match[1];

    if (!verifyToken) return;

    try {
      const user = await User.findOne({ where: { telegram_verify_token: verifyToken } });
      
      if (!user) {
        return bot.sendMessage(chatId, '❌ Помилка: Невірний або застарілий токен підключення.');
      }

      user.telegram_id = chatId.toString();
      user.telegram_verify_token = null; // Clear token to prevent reuse
      await user.save();

      bot.sendMessage(chatId, `✅ <b>Бот успішно підключено!</b>\n\nПривіт, ${user.name}! Тепер ви будете отримувати сповіщення, коли комусь знадобиться ваша допомога поруч (радіус 20 км).\n\n<i>Щоб відключити сповіщення, зайдіть у свій Профіль на сайті.</i>`, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('Bot Error:', e);
      bot.sendMessage(chatId, '❌ Сталася помилка при підключенні.');
    }
  });

  bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/start')) {
      bot.sendMessage(msg.chat.id, 'Я бот для сповіщень платформи AutoHelp. Я не вмію спілкуватися. \n\nЩоб створити заявку або допомогти іншим, перейдіть в наш додаток.');
    }
  });

} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN не знайдено в .env. Бот вимкнений.');
}

// Function to send proximity alerts
const sendProximityAlert = async (telegramId, requestData, distanceKm) => {
  if (!bot) return;
  
  const problemLabels = {
    battery: '🔋 Сів акумулятор',
    fuel: '⛽ Потрібне пальне',
    tire: '🔧 Проблеми з колесом',
    tow: '⛓️ Потрібен евакуатор',
    other: '❓ Інше'
  };

  const typeStr = problemLabels[requestData.type] || requestData.type;
  
  const text = `🚨 <b>Поруч потрібна допомога!</b>

<b>Тип:</b> ${typeStr}
<b>Відстань:</b> ~${distanceKm.toFixed(1)} км
<b>Опис:</b> ${requestData.description || 'Не вказано'}
<b>Винагорода:</b> ${requestData.reward_type === 'free' ? 'Безкоштовно' : requestData.reward_type === 'fixed' ? requestData.reward_amount + ' грн' : 'За домовленістю'}

<a href="${process.env.FRONTEND_URL || 'https://t.me/AutoHelpPlatformBot'}/create">👉 Відкрити додаток та допомогти</a>`;

  try {
    await bot.sendMessage(telegramId, text, { parse_mode: 'HTML', disable_web_page_preview: true });
  } catch (e) {
    console.error(`Failed to send push to ${telegramId}:`, e.message);
  }
};

module.exports = { bot, sendProximityAlert };
