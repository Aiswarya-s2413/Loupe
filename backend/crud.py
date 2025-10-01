from sqlalchemy.orm import Session
from backend import models, schemas

def create_page(db: Session, page: schemas.PageCreate):
    db_page = models.Page(title=page.title, content=page.content)
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def get_page(db: Session, page_id: int):
    return db.query(models.Page).filter(models.Page.id == page_id).first()

def list_pages(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Page).offset(skip).limit(limit).all()
