from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend import models, schemas, crud
from backend.database import engine, get_db
import os
from backend.fact_check import router as fact_router


# Create DB tables 
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Loupe API")

# Allow Vite dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fact_router)

@app.post("/pages/", response_model=schemas.PageRead)
def create_page_endpoint(page: schemas.PageCreate, db: Session = Depends(get_db)):
    return crud.create_page(db, page)

@app.get("/pages/{page_id}", response_model=schemas.PageRead)
def read_page_endpoint(page_id: int, db: Session = Depends(get_db)):
    db_page = crud.get_page(db, page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@app.get("/pages/", response_model=list[schemas.PageRead])
def list_pages_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_pages(db, skip=skip, limit=limit)
