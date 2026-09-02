from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    primary_language: str = "Python"


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    primary_language: str
    created_at: datetime
    updated_at: datetime
