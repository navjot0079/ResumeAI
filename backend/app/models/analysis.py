from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class AnalysisRequest(BaseModel):
    resumeId: str
    jobDescription: str


class SectionScore(BaseModel):
    score: int
    feedback: str


class SectionScores(BaseModel):
    summary: SectionScore
    experience: SectionScore
    education: SectionScore
    skills: SectionScore
    projects: SectionScore
    formatting: SectionScore


class BulletAnalysisItem(BaseModel):
    original: str
    issue: str
    improved: str


class ParsedSections(BaseModel):
    contactInfo: Optional[str] = None
    summary: Optional[str] = None
    experience: List[str] = []
    education: List[str] = []
    skills: List[str] = []
    projects: List[str] = []
    certifications: List[str] = []


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
    sectionScores: Optional[SectionScores] = None
    bulletAnalysis: Optional[List[BulletAnalysisItem]] = None
    parsedSections: Optional[ParsedSections] = None
    createdAt: datetime


class AnalysisListItem(BaseModel):
    id: str
    resumeName: str
    atsScore: int
    createdAt: datetime
