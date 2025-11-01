import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from .models import OwnedSkin, Upgrade, User

logger = logging.getLogger("fastapi")


def upgrades_to_dict(upgrades: list[Upgrade]):
    return [upgrade.to_dict() for upgrade in upgrades]


async def save_upgrades(upgrades_loaded: list, upgrades_db: list[Upgrade]):
    for upgrade in upgrades_loaded:
        name, level = upgrade.values()
        upgrade_exist = [upgrade for upgrade in upgrades_db if upgrade.name == name]
        if upgrade_exist:
            upgrade_exist[0].level = level
        else:
            upgrades_db.append(Upgrade(name=name, level=level))


async def save_progress(sessionmaker: async_sessionmaker[AsyncSession], progress: dict):
    user_id = progress.pop("user_id")
    async with sessionmaker() as session:
        user = await session.scalar(select(User).where(User.user_id == user_id))
        if not user:
            return
        for key, value in progress.items():
            if key == "upgrades":
                upgrades: list[Upgrade] = await user.awaitable_attrs.upgrades
                await save_upgrades(value, upgrades)
                continue
            elif key == "owned_skins":
                skins: list[OwnedSkin] = await user.awaitable_attrs.owned_skins
                skins.extend([OwnedSkin(name=name) for name in value])
                continue
            try:
                setattr(user, key, value)
            except Exception:
                pass
        await session.commit()


async def fetch_leaderboard(sessionmaker: async_sessionmaker[AsyncSession], limit: int):
    async with sessionmaker() as session:
        users = await session.scalars(
            select(User).order_by(User.score.desc()).limit(limit)
        )
        return [
            {
                "user_id": user.user_id,
                "username": user.username,
                "score": user.score,
                "level": user.level,
            }
            for user in users
        ]
