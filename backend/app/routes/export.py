from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import Response
from bson import ObjectId

from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.services.export_service import generate_report_pdf

router = APIRouter()


@router.get("/{analysis_id}")
async def export_analysis_report(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Generate and download a PDF improvement report for an analysis."""
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

    # Convert ObjectId to string for the service
    analysis["id"] = str(analysis["_id"])

    try:
        pdf_bytes = generate_report_pdf(analysis)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )

    # Build a safe filename from the resume name
    resume_name = analysis.get("resumeName", "analysis")
    safe_name = resume_name.rsplit(".", 1)[0]  # remove extension
    filename = f"{safe_name}_report.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
