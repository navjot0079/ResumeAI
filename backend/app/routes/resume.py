import os
import uuid
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from datetime import datetime, timezone

from app.config import settings
from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.models.resume import ResumeResponse

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a PDF resume file."""
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )

    db = get_database()

    # Check for duplicate uploads (same filename for same user)
    existing = await db.resumes.find_one(
        {"userId": current_user["id"], "fileName": file.filename}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A resume with this filename has already been uploaded. Please rename the file or delete the existing one.",
        )

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)

    # Save to database
    resume_doc = {
        "userId": current_user["id"],
        "fileName": file.filename,
        "filePath": file_path,
        "uploadedAt": datetime.now(timezone.utc),
    }

    result = await db.resumes.insert_one(resume_doc)

    return ResumeResponse(
        id=str(result.inserted_id),
        userId=current_user["id"],
        fileName=file.filename,
        filePath=file_path,
        uploadedAt=resume_doc["uploadedAt"],
    )
