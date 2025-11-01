import asyncio
import os
from typing import Final

from aiogram import Bot, Dispatcher, F, Router
from aiogram.types import (
    MenuButtonWebApp,
    Message,
    ReplyKeyboardRemove,
    WebAppInfo,
)
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from bot.db.base import sessionmaker
from bot.jobs import update_bonus_chest

from .scheduler import default_scheduler as scheduler

load_dotenv()

TOKEN: Final[str] = os.getenv("BOT_TOKEN", "")
WEBAPP_URL: Final[str] = os.getenv("WEBAPP_URL", "")


async def startup(sessionmaker: async_sessionmaker[AsyncSession]) -> None:
    print("Startup")
    asyncio.create_task(start_scheduler(sessionmaker=sessionmaker))


async def start_scheduler(sessionmaker: async_sessionmaker[AsyncSession]) -> None:
    scheduler.every().day.at("08:00:00").do(
        update_bonus_chest, sessionmaker=sessionmaker
    )
    while True:
        await scheduler.run_pending()
        await asyncio.sleep(1)


async def handle_start(message: Message) -> None:
    await message.answer(
        text="Привет дружише!",
        reply_markup=ReplyKeyboardRemove(),
    )


# получаем результат игры
async def on_webapp_data(message: Message):
    if not message.web_app_data:
        await message.answer("Ошибка: данные игры не получены")
        return
    await message.answer(f"Ты набрал очков: {message.web_app_data.data}")


def build_dispatcher() -> Dispatcher:
    router = Router(name="webapp")
    router.message.register(handle_start, F.text == "/start")
    router.message.register(on_webapp_data, F.web_app_data)

    dispatcher = Dispatcher(sessionmaker=sessionmaker)
    dispatcher.include_router(router)
    dispatcher.startup.register(startup)
    return dispatcher


async def main() -> None:
    bot = Bot(token=TOKEN)
    dispatcher = build_dispatcher()
    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="Open WebApp", web_app=WebAppInfo(url=WEBAPP_URL)
        )
    )
    await dispatcher.start_polling(bot)


if __name__ == "__main__":
    print("Starting bot...")
    asyncio.run(main())
