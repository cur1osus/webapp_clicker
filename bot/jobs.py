from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from bot.db.models import User


async def update_bonus_chest(sessionmaker: async_sessionmaker[AsyncSession]) -> None:
    async with sessionmaker() as session:
        await session.execute(
            update(User)
            .where(User.has_free_chest.is_(False))
            .values(has_free_chest=True)
        )
        await session.commit()
