from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class AnalysisRequest(BaseModel):
    resumeId: str
    jobDescription: str


class AnalysisResponse(BaseModel):
    id: str
    userId: str
    resumeId: str
    resumeName: str
    resumeText: Optional[str] = None
    jobDescription: str
    atsScore: int
    matchingSkills: List[str]
    missingSkills: List[str]
    missingKeywords: List[str]
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    resumeSummary: str
    createdAt: datetime


class AnalysisListItem(BaseModel):
    id: str
    resumeName: str
    atsScore: int
    createdAt: datetime
