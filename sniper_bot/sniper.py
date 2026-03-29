import os
import re
import asyncio
import random
import json
from telethon import TelegramClient, events, functions, types
from telethon.tl.functions.contacts import SearchRequest
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.messages import ImportChatInviteRequest
from telethon.errors import FloodWaitError, ChatWriteForbiddenError, UserAlreadyParticipantError, InviteHashExpiredError
from dotenv import load_dotenv

load_dotenv()

API_ID = int(os.getenv('API_ID'))
API_HASH = os.getenv('API_HASH')

# Файл для зберігання чатів, в які ми вже вступили
JOINED_CHATS_FILE = 'joined_chats.json'

# Ключові слова для ПОШУКУ груп — ВСЕ що пов'язано з авто в Україні
SEARCH_QUERIES = [
    # === ЗАГАЛЬНІ АВТО ===
    'водії Україна', 'водії України', 'автомобілісти', 'автомобілісти України',
    'авто Україна', 'авто допомога', 'автодопомога', 'дорожня допомога',
    'евакуатор', 'евакуатор Україна', 'автоклуб', 'автоклуб Україна',
    'водій', 'водії чат', 'автолюбитель',

    # === МІСТА УКРАЇНИ ===
    'авто Київ', 'водії Київ', 'автомобілісти Київ',
    'авто Львів', 'водії Львів', 'автомобілісти Львів',
    'авто Одеса', 'водії Одеса', 'автомобілісти Одеса',
    'авто Харків', 'водії Харків', 'автомобілісти Харків',
    'авто Дніпро', 'водії Дніпро', 'автомобілісти Дніпро',
    'авто Запоріжжя', 'водії Запоріжжя',
    'авто Вінниця', 'водії Вінниця',
    'авто Полтава', 'водії Полтава',
    'авто Хмельницький', 'водії Хмельницький',
    'авто Тернопіль', 'водії Тернопіль',
    'авто Івано-Франківськ', 'водії Франківськ',
    'авто Чернівці', 'водії Чернівці',
    'авто Рівне', 'водії Рівне',
    'авто Луцьк', 'водії Луцьк',
    'авто Житомир', 'водії Житомир',
    'авто Суми', 'водії Суми',
    'авто Чернігів', 'водії Чернігів',
    'авто Черкаси', 'водії Черкаси',
    'авто Кропивницький', 'водії Кропивницький',
    'авто Миколаїв', 'водії Миколаїв',
    'авто Херсон', 'водії Херсон',
    'авто Ужгород', 'водії Ужгород', 'авто Закарпаття',
    'авто Мукачево', 'водії Мукачево',

    # === ПОПУТНИКИ / ПОДОРОЖІ / BLABLACAR ===
    'BlaBlaCar', 'BlaBlaCar Україна', 'блаблакар',
    'попутка', 'попутка Україна', 'попутчик', 'попутчики',
    'подорож авто', 'поїздки авто', 'підвезти',
    'попутка Київ', 'попутка Львів', 'попутка Одеса',
    'попутка Харків', 'попутка Дніпро',
    'їду з Києва', 'їду в Київ', 'їду з Львова',
    'підвезу', 'шукаю попутку',

    # === ДАЛЕКОБІЙНИКИ / ВАНТАЖНІ ===
    'далекобійники', 'далекобійники Україна', 'дальнобійники',
    'дальнобой', 'вантажівки', 'вантажні перевезення',
    'фури', 'фура Україна', 'тягач', 'причеп',
    'перевезення вантажів', 'логістика авто',
    'водії фур', 'далекобій чат',

    # === СТО / РЕМОНТ / ЗАПЧАСТИНИ ===
    'ремонт авто', 'ремонт авто Україна',
    'сто', 'СТО Україна', 'автосервіс', 'автосервіс Україна',
    'сто Київ', 'сто Львів', 'сто Одеса', 'сто Харків', 'сто Дніпро',
    'запчастини', 'запчастини авто', 'автозапчастини',
    'розбірка авто', 'авторозбірка',
    'шиномонтаж', 'шини', 'диски', 'колеса',
    'кузовний ремонт', 'фарбування авто', 'полірування',
    'діагностика авто', 'чіп тюнінг',
    'масло авто', 'заміна масла',
    'ходова', 'підвіска', 'гальма',
    'електрик авто', 'автоелектрик',
    'кондиціонер авто', 'заправка кондиціонера',

    # === МАРКИ АВТО (КЛУБИ) ===
    'BMW Україна', 'BMW клуб', 'бмв Україна',
    'Volkswagen Україна', 'VW клуб', 'фольксваген',
    'Toyota Україна', 'тойота клуб',
    'Opel клуб', 'опель Україна',
    'Renault клуб', 'рено Україна',
    'Skoda клуб', 'шкода Україна',
    'Audi клуб', 'ауді Україна',
    'Mercedes клуб', 'мерседес Україна',
    'Honda клуб', 'хонда Україна',
    'Hyundai клуб', 'хюндай Україна',
    'Kia клуб', 'кіа Україна',
    'Nissan клуб', 'ніссан Україна',
    'Mazda клуб', 'мазда Україна',
    'Ford клуб', 'форд Україна',
    'Chevrolet клуб', 'шевроле Україна',
    'Mitsubishi клуб', 'міцубісі Україна',
    'Peugeot клуб', 'пежо Україна',
    'Citroen клуб', 'сітроен Україна',
    'Daewoo клуб', 'деу ланос',
    'ВАЗ клуб', 'жигулі', 'лада Україна',
    'ЗАЗ клуб', 'запорожець', 'таврія',
    'Subaru клуб', 'субару Україна',
    'Fiat клуб', 'фіат Україна',
    'Volvo клуб', 'вольво Україна',
    'Land Rover клуб', 'позашляховик',
    'Jeep клуб', 'джип Україна',
    'Tesla Україна', 'електромобіль Україна', 'електроавто',

    # === ТАКСІ ===
    'таксі', 'таксі Україна', 'таксисти', 'таксисти Україна',
    'Bolt водії', 'Uber водії', 'Uklon водії',
    'таксі Київ', 'таксі Львів', 'таксі Одеса',

    # === КУПІВЛЯ / ПРОДАЖ АВТО ===
    'продаж авто', 'купити авто', 'авто продаж Україна',
    'авто ринок', 'автобазар', 'авто базар',
    'б/у авто', 'авто з Європи', 'пригон авто',
    'розмитнення авто', 'євробляхи', 'євробляхи Україна',

    # === АВТОШКОЛИ / ПДР ===
    'автошкола', 'автошкола Україна', 'пдр', 'правила дорожнього руху',
    'водійські права', 'права Україна',

    # === СТРАХУВАННЯ / ДТП ===
    'страхування авто', 'ОСАГО', 'КАСКО', 'автоцивілка',
    'дтп', 'дтп Україна', 'аварія',

    # === МОТО (БОНУС — теж можуть зламатися) ===
    'мотоцикл Україна', 'мото клуб', 'байкери Україна',
]

# Збільшуємо ліміт для великої бази
MAX_JOINS_PER_SESSION = 25

# Тригер-слова для відповіді на повідомлення
TRIGGER_KEYWORDS = [
    r'заглох', r'сів акум', r'акумулятор', r'прикурити',
    r'пробив колесо', r'запаска', r'дотягнути', r'буксир',
    r'трос', r'евакуатор', r'дтп', r'бензин',
    r'пальне закінчилось', r'поламався', r'зламався',
    r'не заводиться', r'потрібна допомога', r'хто може допомогти',
    r'підвезти', r'застряг', r'колесо спустило',
]
trigger_pattern = re.compile(f"({'|'.join(TRIGGER_KEYWORDS)})", re.IGNORECASE)

# Варіанти відповідей (щоб не виглядало як спам з однаковим текстом)
REPLY_VARIANTS = [
    "Привіт! Бачу у вас проблема з авто 🚗\n\nСпробуйте кинути заявку в @SniperAutoHelpBot — це безкоштовний сервіс, де водії поруч бачать вашу точку на карті і можуть швидко під'їхати допомогти!",
    "О, знайома ситуація! Нещодавно мені допомогли через @SniperAutoHelpBot — там водії з околиці відгукуються за хвилини. Рекомендую спробувати 👍",
    "Якщо ще потрібна допомога — зайдіть у @SniperAutoHelpBot, там є карта і водії поруч бачать поломки і можуть приїхати. Безкоштовно або за каву ☕",
]

# Ліміти безпеки (щоб Telegram не забанив)
JOIN_DELAY_MIN = 30              # Мінімальна пауза між приєднаннями (секунди)
JOIN_DELAY_MAX = 90              # Максимальна пауза
REPLY_COOLDOWN = 120             # Мін. пауза між відповідями (секунди)
SEARCH_DELAY = 10                # Пауза між пошуковими запитами

# --- Утиліти ---

def load_joined_chats():
    if os.path.exists(JOINED_CHATS_FILE):
        with open(JOINED_CHATS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_joined_chats(chats):
    with open(JOINED_CHATS_FILE, 'w') as f:
        json.dump(chats, f, indent=2)

# --- Головна логіка ---

client = TelegramClient('userbot_session', API_ID, API_HASH)

last_reply_time = 0

@client.on(events.NewMessage(incoming=True))
async def sniper_handler(event):
    global last_reply_time

    # Тільки групові чати
    if event.is_private:
        return

    text = event.raw_text
    if not text or len(text) < 5:
        return

    # Шукаємо тригер-слова
    if trigger_pattern.search(text.lower()):
        # Перевіряємо кулдаун
        now = asyncio.get_event_loop().time()
        if now - last_reply_time < REPLY_COOLDOWN:
            return

        try:
            chat = await event.get_chat()
            sender = await event.get_sender()
            sender_name = getattr(sender, 'first_name', 'Водій') if sender else 'Водій'
            chat_title = getattr(chat, 'title', 'Невідомий чат')

            print(f"\n🎯 ЦІЛЬ! Чат: {chat_title} | Юзер: {sender_name}")
            print(f"   Текст: {text[:80]}...")

            # Людська затримка перед відповіддю
            delay = random.uniform(8, 25)
            print(f"   ⏳ Чекаю {delay:.0f} сек...")
            await asyncio.sleep(delay)

            # Вибираємо випадкову відповідь
            reply_text = random.choice(REPLY_VARIANTS)

            await event.reply(reply_text)
            last_reply_time = now
            print(f"   ✅ Відповідь надіслана!")

        except ChatWriteForbiddenError:
            print(f"   ⚠️ Не можу писати в цьому чаті (тільки для читання)")
        except FloodWaitError as e:
            print(f"   🛑 FloodWait! Чекаю {e.seconds} секунд...")
            await asyncio.sleep(e.seconds)
        except Exception as e:
            print(f"   ❌ Помилка: {e}")


async def auto_search_and_join():
    """Автоматичний пошук та приєднання до авто-чатів."""
    joined = load_joined_chats()
    new_joins = 0

    print("\n🔍 Починаю автоматичний пошук авто-чатів України...")

    for query in SEARCH_QUERIES:
        if new_joins >= MAX_JOINS_PER_SESSION:
            print(f"\n⚠️ Досягнуто ліміт ({MAX_JOINS_PER_SESSION} груп за сесію). Зупиняюсь.")
            break

        try:
            print(f"\n🔎 Шукаю: '{query}'...")
            result = await client(SearchRequest(q=query, limit=20))

            for chat in result.chats:
                chat_id = str(chat.id)

                if chat_id in joined:
                    continue

                # Пропускаємо занадто маленькі групи
                members = getattr(chat, 'participants_count', 0) or 0
                if members < 30:
                    continue

                title = getattr(chat, 'title', '')
                print(f"   📌 Знайдено: {title} ({members} учасників)")

                try:
                    await client(JoinChannelRequest(chat))
                    joined.append(chat_id)
                    new_joins += 1
                    print(f"   ✅ Приєднався! (Усього нових: {new_joins})")
                    save_joined_chats(joined)

                    # Пауза між приєднаннями
                    delay = random.uniform(JOIN_DELAY_MIN, JOIN_DELAY_MAX)
                    print(f"   ⏳ Пауза {delay:.0f} сек...")
                    await asyncio.sleep(delay)

                except UserAlreadyParticipantError:
                    joined.append(chat_id)
                    save_joined_chats(joined)
                    print(f"   ℹ️ Вже в цій групі")
                except FloodWaitError as e:
                    print(f"   🛑 FloodWait! Пауза {e.seconds} сек...")
                    await asyncio.sleep(e.seconds)
                except Exception as e:
                    print(f"   ⚠️ Не вдалось: {e}")

            await asyncio.sleep(SEARCH_DELAY)

        except FloodWaitError as e:
            print(f"   🛑 FloodWait при пошуку! Пауза {e.seconds} сек...")
            await asyncio.sleep(e.seconds)
        except Exception as e:
            print(f"   ❌ Помилка пошуку: {e}")

    print(f"\n✅ Пошук завершено! Приєднався до {new_joins} нових груп.")
    print(f"   Загалом відстежується {len(joined)} чатів.\n")


async def main():
    print("=" * 50)
    print("🎯 AutoHelp СНАЙПЕР v2.0")
    print("=" * 50)

    await client.start()
    me = await client.get_me()
    print(f"\n👤 Авторизовано як: {me.first_name} (@{me.username or 'без юзернейму'})")

    # Фаза 1: Автоматичний пошук та приєднання до груп
    await auto_search_and_join()

    # Фаза 2: Сканування повідомлень у реальному часі
    print("🔫 Снайпер активний! Моніторю ВСІ чати на ключові слова...")
    print(f"   Тригери: {', '.join(TRIGGER_KEYWORDS)}")
    print(f"   Кулдаун між відповідями: {REPLY_COOLDOWN} сек")
    print("   Натисніть Ctrl+C для зупинки.\n")

    await client.run_until_disconnected()


if __name__ == '__main__':
    if not API_ID or not API_HASH:
        print("❌ У файлі .env не вказані API_ID та API_HASH!")
        print("Отримайте їх на https://my.telegram.org/")
        exit(1)

    client.loop.run_until_complete(main())
