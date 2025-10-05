from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime

class PageBase(BaseModel):
    title: Optional[str] = None
    content: Any  # Plate content: list/dict

class PageCreate(PageBase):
    pass

class PageRead(PageBase):
    id: int
    created_at: datetime
    share_token: Optional[str] = None
    is_public: bool = False

    class Config:
        orm_mode = True

class ShareResponse(BaseModel):
    share_url: str
    share_token: str
