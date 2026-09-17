from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from datetime import datetime, timezone
from bson import ObjectId
from jose import JWTError
from typing import Optional

from app.database import get_database
from app.config import settings
from app.limiter import limiter
from app.models.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter()

COOKIE_PATH = "/api/auth"


def set_refresh_cookie(response: Response, refresh_token: str):
    """Set the refresh token in an HttpOnly, secure cookie."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path=COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response):
    """Remove the refresh token cookie upon logout."""
    response.delete_cookie(
        key="refresh_token",
        path=COOKIE_PATH,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


@router.post("/signup", response_model=TokenResponse)
async def signup(request: Request, response: Response, user_data: UserCreate):
    """Register a new user and set HttpOnly refresh token cookie."""
    db = get_database()

    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "createdAt": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate tokens
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user_id,
            name=user_data.name,
            email=user_data.email,
            createdAt=user_doc["createdAt"],
        ),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, response: Response, user_data: UserLogin):
    """Authenticate user with rate limiting (5/min) and set HttpOnly refresh cookie."""
    db = get_database()

    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            createdAt=user["createdAt"],
        ),
    )


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        createdAt=current_user["createdAt"],
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    token_data: Optional[RefreshTokenRequest] = None,
):
    """Refresh the access token using HttpOnly cookie (fallback to body if provided)."""
    # 1. Look for refresh token in HttpOnly cookie
    token = request.cookies.get("refresh_token")

    # 2. Fallback to request body if cookie not present
    if not token and token_data and token_data.refresh_token:
        token = token_data.refresh_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    try:
        payload = decode_refresh_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    new_access_token = create_access_token(user_id)
    new_refresh_token = create_refresh_token(user_id)

    set_refresh_cookie(response, new_refresh_token)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            createdAt=user["createdAt"],
        ),
    )


@router.post("/logout")
async def logout(response: Response):
    """Clear the HttpOnly refresh token cookie on logout."""
    clear_refresh_cookie(response)
    return {"message": "Logged out successfully"}

