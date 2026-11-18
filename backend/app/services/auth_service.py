from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserProfileUpdate, PasswordChangeRequest, Token
from app.utils.security import verify_password, get_password_hash, create_access_token

class AuthService:
    @staticmethod
    def register(db: Session, user_in: UserCreate) -> User:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        
        user = User(
            name=user_in.name,
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            preferences={
                "default_sample_fps": 5.0,
                "head_pose_sensitivity": "normal",
                "auto_hud_overlay": True,
                "gaze_calibration_mode": "standard"
            }
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate(db: Session, credentials: UserLogin) -> Token:
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        token = create_access_token(data={"sub": user.id, "email": user.email})
        return Token(
            access_token=token,
            token_type="bearer",
            user=user
        )

    @staticmethod
    def update_profile(db: Session, user: User, profile_in: UserProfileUpdate) -> User:
        if profile_in.name is not None:
            user.name = profile_in.name
        if profile_in.preferences is not None:
            current_prefs = dict(user.preferences or {})
            current_prefs.update(profile_in.preferences)
            user.preferences = current_prefs
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(db: Session, user: User, pw_in: PasswordChangeRequest) -> bool:
        if not verify_password(pw_in.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        if len(pw_in.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters"
            )
        user.password_hash = get_password_hash(pw_in.new_password)
        db.commit()
        return True
