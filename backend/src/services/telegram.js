const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');

let bot = null;

function setupTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN не вказано. Сповіщення вимкнені. Щоб увімкнути, додайте токен у .env бекенду.');
    return null;
  }

  bot = new TelegramBot(token, { polling: true });

  console.log('🤖 Telegram Bot запущено');

  bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];

    try {
      const user = await User.findOne({ where: { telegram_verify_token: resp } });
      if (!user) {
        return bot.sendMessage(chatId, '❌ Невірний або застарілий токен підключення.');
      }

      user.telegram_id = chatId.toString();
      user.telegram_verify_token = null; // consume token
      await user.save();

      bot.sendMessage(chatId, `✅ Вітаю, ${user.name}! Ваш акаунт AutoHelp успішно підв'язано.\nТепер ви зможете отримувати миттєві сповіщення про нові поломки поруч із вами.`);
    } catch (err) {
      console.error('Bot Error:', err);
      bot.sendMessage(chatId, 'Помилка сервера.');
    }
  });

  bot.onText(/\/start$/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Привіт! Щоб підключити сповіщення, перейдіть у свій профіль веб-додатка AutoHelp та натисніть кнопку "Підключити Telegram".');
  });

  return bot;
}

// Функція для відправки нотифікацій масиву користувачів
async function notifyHelpers(helpers, requestData) {
  if (!bot) return;

  const typeConfig = {
    battery: '🔋 Акумулятор',
    fuel: '⛽ Пальне',
    tire: '🔧 Колесо',
    tow: '🚗 Буксир',
    other: '❓ Інше',
  };

  const typeLabel = typeConfig[requestData.type] || typeConfig.other;
  const rewardLabel = requestData.reward_type === 'free' ? 'Безкоштовно' : requestData.reward_type === 'fixed' ? `${requestData.reward_amount} грн` : 'За домовленістю';

  // В реальному житті тут буде хост продакшену
  const url = `http://localhost:5173/request/${requestData.id}`;

  const text = `🚨 *Потрібна допомога поруч!*\n\n` +
               `*Що сталося:* ${typeLabel}\n` +
               `*Винагорода:* ${rewardLabel}\n` +
               `${requestData.description ? '*Коментар:* ' + requestData.description + '\n' : ''}\n` +
               `[Відкрити заявку в додатку](${url})`;

  for (const helper of helpers) {
    if (helper.telegram_id) {
      try {
        await bot.sendMessage(helper.telegram_id, text, { parse_mode: 'Markdown', disable_web_page_preview: true });
      } catch (e) {
        console.error(`Не вдалося надіслати повідомлення користувачу ${helper.telegram_id}:`, e.message);
      }
    }
  }
}

module.exports = { setupTelegram, notifyHelpers };
