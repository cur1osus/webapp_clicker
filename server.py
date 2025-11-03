from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from bot.db.base import engine, init_db, sessionmaker
from bot.db.func import fetch_leaderboard, save_progress, upgrades_to_dict
from bot.db.models import Base, User  # noqa

BASE_DIR = Path(__file__).parent
CLICKER_TEMPLATE_PATH = BASE_DIR / "templates" / "clicker.html"
STATIC_DIR = BASE_DIR / "static"
DB_VERSION = 1


async def on_startup() -> None:
    await init_db(engine)


app = FastAPI(on_startup=[on_startup])
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def load_clicker_markup() -> str:
    """Read the clicker template from disk."""
    return CLICKER_TEMPLATE_PATH.read_text(encoding="utf-8")


@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    return HTMLResponse(load_clicker_markup())


@app.get("/api/database")
async def check_database(
    db_version: int | None = Query(default=None, ge=0),
) -> Response:
    if not db_version:
        return Response(status_code=400)
    if db_version != DB_VERSION:
        return Response(status_code=400)

    return Response(status_code=200)


@app.get("/api/clicker")
async def load_clicker_result(
    user_id: int | None = Query(default=None, ge=0),
    username: str | None = Query(default=None),
) -> Response:
    if not user_id:
        return Response(status_code=204)

    async with sessionmaker() as session:
        user = await session.scalar(select(User).where(User.user_id == user_id))

        if not user:
            user = User(user_id=user_id, username=username)
            session.add(user)
            await session.commit()

        upgrades = await user.awaitable_attrs.upgrades
        owned_skins = await user.awaitable_attrs.owned_skins
        _ = [skin.name for skin in owned_skins]

    progress: Dict[str, Any] = {
        "score": user.score,
        "level": user.level,
        "currency": user.currency,
        "upgrades": upgrades_to_dict(upgrades),
        "owned_skins": _,
        "active_skin": user.active_skin,
        "has_free_chest": user.has_free_chest,
        "db_version": DB_VERSION,
    }
    return JSONResponse(progress)


@app.post("/api/clicker")
async def save_clicker_result(request: Request) -> Response:
    try:
        progress = await request.json()
    except Exception as exc:  # noqa
        raise HTTPException(status_code=400, detail="Unable to parse JSON")

    if not isinstance(progress, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    user_id = progress.get("user_id", None)

    if not user_id:
        raise HTTPException(status_code=400, detail="Valid user id required")

    await save_progress(sessionmaker, progress)
    return Response(status_code=204)


@app.get("/api/leaderboard")
async def load_leaderboard(
    limit: int = Query(default=20, ge=1, le=50),
) -> JSONResponse:
    items = await fetch_leaderboard(sessionmaker, limit=limit)
    return JSONResponse({"items": items})
