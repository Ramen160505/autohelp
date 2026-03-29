const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');

const token = process.env.TELEGRAM_BOT_TOKEN;

let bot = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });

  console.log('🤖 Telegram Push Bot Started');

  // Handle /start with verify token
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
      user.telegram_verify_token = null;
      await user.save();

      bot.sendMessage(chatId, `✅ <b>Бот успішно підключено!</b>\n\nПривіт, ${user.name}! Тепер ви будете отримувати сповіщення, коли комусь знадобиться ваша допомога поруч (радіус 20 км).\n\n<i>Щоб відключити сповіщення, зайдіть у свій Профіль на сайті.</i>`, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('Bot Error:', e);
      bot.sendMessage(chatId, '❌ Сталася помилка при підключенні.');
    }
  });

  // Handle bare /start (no token) — welcome message
  bot.onText(/^\/start$/, async (msg) => {
    const chatId = msg.chat.id;
    const APK_URL = process.env.APK_URL || '';
    const WEBAPP_URL = process.env.FRONTEND_URL || '';

    const welcomeText = `🚗 <b>Ласкаво просимо до AutoHelp!</b>\n\nАвтоматична платформа допомоги на дорозі. Зламався? Кинь заявку — водії поруч побачать тебе на карті та приїдуть на допомогу!\n\n<b>Що вмію:</b>\n🔋 Прикурити акумулятор\n⛽ Долити пальне\n🔧 Замінити колесо\n⛓️ Відбуксирувати\n🛠️ Дрібний ремонт\n\n👇 <b>Обирай як відкрити:</b>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🌐 Відкрити Web-додаток', web_app: { url: WEBAPP_URL } }],
      ]
    };

    // Add APK button only if URL is set
    if (APK_URL) {
      keyboard.inline_keyboard.push([{ text: '📱 Завантажити Android додаток (.apk)', url: APK_URL }]);
    }

    keyboard.inline_keyboard.push([{ text: '💬 Як це працює?', callback_data: 'how_it_works' }]);

    await bot.sendMessage(chatId, welcomeText, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  // Handle callback queries
  bot.on('callback_query', async (query) => {
    if (query.data === 'how_it_works') {
      const text = `📖 <b>Як працює AutoHelp:</b>\n\n1️⃣ Відкрий додаток та зареєструйся\n2️⃣ Дозволь доступ до геолокації\n3️⃣ Якщо зламався — натисни "Потрібна допомога"\n4️⃣ Водії поблизу отримають сповіщення та побачать тебе на карті\n5️⃣ Хтось відгукнеться та під'їде!\n\n<b>Хочеш допомагати іншим?</b>\n- Підключи Telegram-сповіщення у Профілі\n- Коли комусь буде потрібна допомога поруч — ти миттєво отримаєш повідомлення!`;
      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(query.message.chat.id, text, { parse_mode: 'HTML' });
    }
  });

  // Handle any other messages
  bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/start') && !msg.web_app_data) {
      bot.sendMessage(msg.chat.id, '👋 Привіт! Я бот AutoHelp.\n\nНатисніть /start щоб відкрити головне меню.');
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
