from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(BigInteger, unique=True)
    username: Mapped[str] = mapped_column(String(100), nullable=True)
    score: Mapped[int] = mapped_column(BigInteger, default=0)
    level: Mapped[int] = mapped_column(default=0)
    currency: Mapped[int] = mapped_column(BigInteger, default=0)
    upgrades: Mapped[list["Upgrade"]] = relationship(
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    owned_skins: Mapped[list["OwnedSkin"]] = relationship(
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    active_skin: Mapped[str] = mapped_column(String(100), nullable=True)
    has_free_chest: Mapped[bool] = mapped_column(default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Upgrade(Base):
    __tablename__ = "upgrades"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    user: Mapped["User"] = relationship(
        back_populates="upgrades",
        lazy="selectin",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    level: Mapped[int] = mapped_column(default=0)

    def to_dict(self):
        return {self.name: self.level}


class OwnedSkin(Base):
    __tablename__ = "owned_skins"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    user: Mapped["User"] = relationship(
        back_populates="owned_skins",
        lazy="selectin",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
