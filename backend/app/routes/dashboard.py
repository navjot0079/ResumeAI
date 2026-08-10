from fastapi import APIRouter, Depends

from app.database import get_database
from app.middleware.auth_middleware import get_current_user

router = APIRouter()


@router.get("")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics for the current user."""
    db = get_database()
    user_id = current_user["id"]

    # Total resumes
    total_resumes = await db.resumes.count_documents({"userId": user_id})

    # Total analyses
    total_analyses = await db.analyses.count_documents({"userId": user_id})

    # Highest ATS score
    highest_score_cursor = db.analyses.find(
        {"userId": user_id}
    ).sort("atsScore", -1).limit(1)
    highest_score_list = await highest_score_cursor.to_list(length=1)
    highest_ats_score = highest_score_list[0]["atsScore"] if highest_score_list else 0

    # Latest analysis
    latest_cursor = db.analyses.find(
        {"userId": user_id}
    ).sort("createdAt", -1).limit(1)
    latest_list = await latest_cursor.to_list(length=1)
    latest_analysis = None
    if latest_list:
        la = latest_list[0]
        latest_analysis = {
            "id": str(la["_id"]),
            "resumeName": la["resumeName"],
            "atsScore": la["atsScore"],
            "createdAt": la["createdAt"].isoformat(),
        }

    # Recent analyses (last 5)
    recent_cursor = db.analyses.find(
        {"userId": user_id}
    ).sort("createdAt", -1).limit(5)
    recent_list = await recent_cursor.to_list(length=5)
    recent_analyses = [
        {
            "id": str(a["_id"]),
            "resumeName": a["resumeName"],
            "atsScore": a["atsScore"],
            "createdAt": a["createdAt"].isoformat(),
        }
        for a in recent_list
    ]

    return {
        "totalResumes": total_resumes,
        "totalAnalyses": total_analyses,
        "highestAtsScore": highest_ats_score,
        "latestAnalysis": latest_analysis,
        "recentAnalyses": recent_analyses,
    }
