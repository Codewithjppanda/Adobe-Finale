from pydantic import BaseModel
from typing import List


class OutlineItem(BaseModel):
    level: str
    text: str
    page: int


class OutlineResponse(BaseModel):
    docId: str
    title: str
    outline: List[OutlineItem]


