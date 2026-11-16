from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token
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
            password_hash=get_password_hash(user_in.password)
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
