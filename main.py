from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from starlette.status import HTTP_303_SEE_OTHER

# Initialize app
app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Database setup
Base = declarative_base()
DATABASE_URL = "sqlite:///./games.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

# Game model
class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    barcode = Column(String, unique=True, index=True)
    category = Column(String, index=True)

Base.metadata.create_all(bind=engine)

# Home page - show form and game library
@app.get("/", response_class=HTMLResponse)
def read_form(request: Request):
    games = session.query(Game).all()
    categories = {}
    for game in games:
        if game.category not in categories:
            categories[game.category] = []
        categories[game.category].append(game)
    return templates.TemplateResponse("index.html", {"request": request, "categories": categories})

# Add new game with smart duplicate check
@app.post("/add")
def add_game(request: Request, name: str = Form(...), barcode: str = Form(...), category: str = Form(...)):
    existing = session.query(Game).filter(Game.barcode == barcode).first()
    if existing:
        return RedirectResponse(url=f"/?error=You already own this game!", status_code=HTTP_303_SEE_OTHER)
    
    game = Game(name=name, barcode=barcode, category=category)
    session.add(game)
    session.commit()
    return RedirectResponse(url="/", status_code=HTTP_303_SEE_OTHER)

# List all games (raw JSON)
@app.get("/games")
def get_games():
    return session.query(Game).all()

# Delete a game
@app.get("/delete/{game_id}")
def delete_game(game_id: int):
    game = session.query(Game).filter(Game.id == game_id).first()
    if game:
        session.delete(game)
        session.commit()
    return RedirectResponse("/", status_code=HTTP_303_SEE_OTHER)

# Show edit form
@app.get("/edit/{game_id}", response_class=HTMLResponse)
def edit_game_form(request: Request, game_id: int):
    game = session.query(Game).filter(Game.id == game_id).first()
    return templates.TemplateResponse("edit.html", {"request": request, "game": game})

# Save updated game
@app.post("/edit/{game_id}")
def update_game(game_id: int, name: str = Form(...), barcode: str = Form(...), category: str = Form(...)):
    game = session.query(Game).filter(Game.id == game_id).first()
    if game:
        game.name = name
        game.barcode = barcode
        game.category = category
        session.commit()
    return RedirectResponse("/", status_code=HTTP_303_SEE_OTHER)
