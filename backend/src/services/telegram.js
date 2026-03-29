const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');

let bot = null;

function setupTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN не вказано. Сповіщення вимкнені. Щоб увімкнути, додайте токен у .env бекенду.');
    return null;
  }

  const APP_URL = process.env.CLIENT_URL || 'https://autohelp-brown.vercel.app';
  const CHAT_URL = process.env.CHAT_URL || 'https://t.me/autohelp_ua_test';

  bot = new TelegramBot(token, { polling: true });

  console.log('🤖 Telegram Bot запущено');

  // Set persistent bottom Menu button
  bot.setChatMenuButton({
    menu_button: JSON.stringify({
      type: 'web_app',
      text: 'AutoHelp',
      web_app: { url: APP_URL }
    })
  });

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

      bot.sendMessage(chatId, `✅ Вітаю, ${user.name}! Ваш акаунт AutoHelp успішно підв'язано.\nТепер ви зможете отримувати миттєві сповіщення про нові поломки поруч із вами.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Відкрити AutoHelp', web_app: { url: APP_URL } }]
          ]
        }
      });
    } catch (err) {
      console.error('Bot Error:', err);
      bot.sendMessage(chatId, 'Помилка сервера.');
    }
  });

  bot.onText(/\/start$/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Привіт! Я — помічник спільноти **AutoHelp**. 🚗\n\nВідкривайте наш міні-додаток або долучайтеся до нашої Telegram-групи водіїв, щоб завжди бути на зв\'язку!', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Відкрити Додаток', web_app: { url: APP_URL } }],
          [{ text: '💬 Чат Спільноти AutoHelp', url: CHAT_URL }]
        ]
      }
    });
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

  const APP_URL = process.env.CLIENT_URL || 'https://autohelp-brown.vercel.app';
  const url = `${APP_URL}/request/${requestData.id}`;

  const text = `🚨 *Потрібна допомога поруч!*\n\n` +
               `*Що сталося:* ${typeLabel}\n` +
               `*Винагорода:* ${rewardLabel}\n` +
               `${requestData.description ? '*Коментар:* ' + requestData.description + '\n' : ''}`;

  for (const helper of helpers) {
    if (helper.telegram_id) {
      try {
        await bot.sendMessage(helper.telegram_id, text, { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Допомогти (Відкрити заявку)', web_app: { url } }]
            ]
          }
        });
      } catch (e) {
        console.error(`Не вдалося надіслати повідомлення користувачу ${helper.telegram_id}:`, e.message);
      }
    }
  }
}

module.exports = { setupTelegram, notifyHelpers };
