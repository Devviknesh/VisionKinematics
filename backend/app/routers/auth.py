from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    UserProfileUpdate, 
    PasswordChangeRequest, 
    Token
)
from app.services.auth_service import AuthService
from app.utils.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    return AuthService.register(db, user_in)

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    return AuthService.authenticate(db, credentials)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the authenticated user's name and analysis preferences.
    """
    return AuthService.update_profile(db, current_user, profile_in)

@router.put("/password")
def change_password(
    pw_in: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Securely changes the user's password after verifying the current password.
    """
    AuthService.change_password(db, current_user, pw_in)
    return {"message": "Password updated successfully"}
