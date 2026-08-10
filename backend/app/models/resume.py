from pydantic import BaseModel
from datetime import datetime


class ResumeResponse(BaseModel):
    id: str
    userId: str
    fileName: str
    filePath: str
    uploadedAt: datetime
