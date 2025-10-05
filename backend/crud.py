from sqlalchemy.orm import Session
from backend import models, schemas
import secrets

def create_page(db: Session, page: schemas.PageCreate):
    db_page = models.Page(title=page.title, content=page.content)
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def get_page(db: Session, page_id: int):
    return db.query(models.Page).filter(models.Page.id == page_id).first()

def get_page_by_token(db: Session, share_token: str):
    return db.query(models.Page).filter(
        models.Page.share_token == share_token,
        models.Page.is_public == True
    ).first()

def generate_share_token(db: Session, page_id: int):
    """Generate a unique share token for a page and make it public"""
    page = get_page(db, page_id)
    if not page:
        return None
    
    # Generate unique token
    token = secrets.token_urlsafe(16)
    
    # Ensure uniqueness
    while db.query(models.Page).filter(models.Page.share_token == token).first():
        token = secrets.token_urlsafe(16)
    
    page.share_token = token
    page.is_public = True
    db.commit()
    db.refresh(page)
    return page

def revoke_share_token(db: Session, page_id: int):
    """Revoke public access to a page"""
    page = get_page(db, page_id)
    if not page:
        return None
    
    page.is_public = False
    db.commit()
    db.refresh(page)
    return page

def update_page(db: Session, page_id: int, page_update: schemas.PageCreate):
    db_page = get_page(db, page_id)
    if not db_page:
        return None
    db_page.title = page_update.title
    db_page.content = page_update.content
    db.commit()
    db.refresh(db_page)
    return db_page

def list_pages(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Page).offset(skip).limit(limit).all()

def delete_page(db: Session, page_id: int):
    db_page = get_page(db, page_id)
    if not db_page:
        return None
    db.delete(db_page)
    db.commit()
    return True
