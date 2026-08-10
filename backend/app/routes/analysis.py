from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from typing import List

from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.models.analysis import AnalysisRequest, AnalysisResponse, AnalysisListItem
from app.services.resume_service import extract_text_from_pdf
from app.services.ai_service import analyze_resume

router = APIRouter()


@router.post("", response_model=AnalysisResponse)
async def create_analysis(
    request: AnalysisRequest,
    current_user: dict = Depends(get_current_user),
):
    """Run AI analysis on a resume against a job description."""
    db = get_database()

    # Fetch resume
    resume = await db.resumes.find_one(
        {"_id": ObjectId(request.resumeId), "userId": current_user["id"]}
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    # Extract text from PDF
    try:
        resume_text = extract_text_from_pdf(resume["filePath"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Run AI analysis
    try:
        ai_result = await analyze_resume(resume_text, request.jobDescription)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    # Save analysis to database
    analysis_doc = {
        "userId": current_user["id"],
        "resumeId": request.resumeId,
        "resumeName": resume["fileName"],
        "resumeText": resume_text,
        "jobDescription": request.jobDescription,
        "atsScore": ai_result["atsScore"],
        "matchingSkills": ai_result["matchingSkills"],
        "missingSkills": ai_result["missingSkills"],
        "missingKeywords": ai_result["missingKeywords"],
        "strengths": ai_result["strengths"],
        "weaknesses": ai_result["weaknesses"],
        "suggestions": ai_result["suggestions"],
        "resumeSummary": ai_result["resumeSummary"],
        "createdAt": datetime.now(timezone.utc),
    }

    result = await db.analyses.insert_one(analysis_doc)

    return AnalysisResponse(
        id=str(result.inserted_id),
        **{k: v for k, v in analysis_doc.items() if k != "_id"},
    )


@router.get("/history", response_model=List[AnalysisListItem])
async def get_analysis_history(
    current_user: dict = Depends(get_current_user),
):
    """Get all analyses for the current user."""
    db = get_database()

    analyses = await db.analyses.find(
        {"userId": current_user["id"]}
    ).sort("createdAt", -1).to_list(length=100)

    return [
        AnalysisListItem(
            id=str(a["_id"]),
            resumeName=a["resumeName"],
            atsScore=a["atsScore"],
            createdAt=a["createdAt"],
        )
        for a in analyses
    ]


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific analysis by ID."""
    db = get_database()

    try:
        analysis = await db.analyses.find_one(
            {"_id": ObjectId(analysis_id), "userId": current_user["id"]}
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid analysis ID",
        )

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    return AnalysisResponse(
        id=str(analysis["_id"]),
        userId=analysis["userId"],
        resumeId=analysis["resumeId"],
        resumeName=analysis["resumeName"],
        resumeText=analysis.get("resumeText"),
        jobDescription=analysis["jobDescription"],
        atsScore=analysis["atsScore"],
        matchingSkills=analysis["matchingSkills"],
        missingSkills=analysis["missingSkills"],
        missingKeywords=analysis["missingKeywords"],
        strengths=analysis["strengths"],
        weaknesses=analysis["weaknesses"],
        suggestions=analysis["suggestions"],
        resumeSummary=analysis["resumeSummary"],
        createdAt=analysis["createdAt"],
    )


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete an analysis."""
    db = get_database()

    try:
        result = await db.analyses.delete_one(
            {"_id": ObjectId(analysis_id), "userId": current_user["id"]}
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid analysis ID",
        )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    return {"message": "Analysis deleted successfully"}
