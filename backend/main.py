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

@app.put("/pages/{page_id}", response_model=schemas.PageRead)
def update_page_endpoint(page_id: int, page: schemas.PageCreate, db: Session = Depends(get_db)):
    db_page = crud.update_page(db, page_id, page)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@app.get("/pages/{page_id}", response_model=schemas.PageRead)
def read_page_endpoint(page_id: int, db: Session = Depends(get_db)):
    db_page = crud.get_page(db, page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@app.get("/pages/", response_model=list[schemas.PageRead])
def list_pages_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_pages(db, skip=skip, limit=limit)

@app.delete("/pages/{page_id}")
def delete_page_endpoint(page_id: int, db: Session = Depends(get_db)):
    result = crud.delete_page(db, page_id)
    if not result:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"message": "Page deleted successfully"}

@app.post("/pages/{page_id}/share", response_model=schemas.ShareResponse)
def share_page_endpoint(page_id: int, db: Session = Depends(get_db)):
    """Generate a public share link for a page"""
    page = crud.generate_share_token(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    share_url = f"http://localhost:5173/shared/{page.share_token}"
    return {"share_url": share_url, "share_token": page.share_token}

@app.delete("/pages/{page_id}/share")
def revoke_share_endpoint(page_id: int, db: Session = Depends(get_db)):
    """Revoke public access to a page"""
    page = crud.revoke_share_token(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"message": "Share access revoked"}

@app.get("/public/{share_token}", response_model=schemas.PageRead)
def get_public_page_endpoint(share_token: str, db: Session = Depends(get_db)):
    """Get a publicly shared page (read-only)"""
    page = crud.get_page_by_token(db, share_token)
    if not page:
        raise HTTPException(status_code=404, detail="Shared page not found or no longer public")
    return page
