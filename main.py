from fastapi import FastAPI, Form, Request, File, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
from starlette.status import HTTP_303_SEE_OTHER
from datetime import datetime
import os

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

Base = declarative_base()
DATABASE_URL = "sqlite:///./games.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

# Make sure uploads folder exists
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    barcode = Column(String, unique=True, index=True)
    category = Column(String, index=True)
    status = Column(String, default="Wishlist")
    date_added = Column(DateTime(timezone=True), server_default=func.now())
    cover_image = Column(String, nullable=True)  # ✅ New field

Base.metadata.create_all(bind=engine)

@app.get("/", response_class=HTMLResponse)
def read_form(request: Request, page: int = 1):
    page_size = 10
    offset = (page - 1) * page_size

    total_games = session.query(Game).count()
    total_pages = (total_games + page_size - 1) // page_size

    games = session.query(Game).offset(offset).limit(page_size).all()
    categories = {}
    for game in games:
        if game.category not in categories:
            categories[game.category] = []
        categories[game.category].append(game)

    success = request.query_params.get("success")
    error = request.query_params.get("error")

    return templates.TemplateResponse("index.html", {
        "request": request,
        "categories": categories,
        "success": success,
        "error": error,
        "current_page": page,
        "total_pages": total_pages
    })

@app.post("/add")
async def add_game(
    name: str = Form(...),
    barcode: str = Form(...),
    category: str = Form(...),
    status: str = Form(...),
    cover_image: UploadFile = File(None)
):
    existing = session.query(Game).filter(Game.barcode == barcode).first()
    if existing:
        return RedirectResponse("/?error=You already own this game!", status_code=HTTP_303_SEE_OTHER)

    cover_image_path = None
    if cover_image:
        file_location = f"{UPLOAD_FOLDER}/{cover_image.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(await cover_image.read())
        cover_image_path = file_location

    game = Game(
        name=name,
        barcode=barcode,
        category=category,
        status=status,
        cover_image=cover_image_path,
        date_added=datetime.now()
    )
    session.add(game)
    session.commit()

    return RedirectResponse("/?success=1", status_code=HTTP_303_SEE_OTHER)

@app.get("/games")
def get_games():
    return session.query(Game).all()

@app.get("/delete/{game_id}")
def delete_game(game_id: int):
    game = session.query(Game).filter(Game.id == game_id).first()
    if game:
        session.delete(game)
        session.commit()
    return RedirectResponse("/", status_code=HTTP_303_SEE_OTHER)

@app.get("/edit/{game_id}", response_class=HTMLResponse)
def edit_game_form(request: Request, game_id: int):
    game = session.query(Game).filter(Game.id == game_id).first()
    return templates.TemplateResponse("edit.html", {"request": request, "game": game})

@app.post("/edit/{game_id}")
def update_game(
    game_id: int,
    name: str = Form(...),
    barcode: str = Form(...),
    category: str = Form(...),
    status: str = Form(...)
):
    game = session.query(Game).filter(Game.id == game_id).first()
    if game:
        game.name = name
        game.barcode = barcode
        game.category = category
        game.status = status
        session.commit()
    return RedirectResponse("/", status_code=HTTP_303_SEE_OTHER)

@app.exception_handler(404)
def not_found(request: Request, exc):
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
