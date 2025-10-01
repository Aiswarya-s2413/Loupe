from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from backend.database import Base

class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    content = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
