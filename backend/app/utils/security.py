from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User

security_bearer = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_streaming_ticket(user_id: str, resource_id: str, expires_minutes: int = 15) -> str:
    """
    Creates a cryptographically signed, short-lived streaming ticket explicitly bound to a specific resource.
    Valid for 15 minutes by default. Cannot be used to access other videos or resources.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {
        "sub": user_id,
        "res_id": resource_id,
        "scope": "media_stream",
        "exp": expire
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_streaming_ticket(ticket: str, expected_resource_id: str) -> Optional[str]:
    """
    Verifies that the ticket is valid, unexpired, and strictly bound to expected_resource_id.
    Returns user_id if valid, None otherwise.
    """
    try:
        payload = jwt.decode(ticket, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("scope") != "media_stream":
            return None
        if payload.get("res_id") != expected_resource_id:
            return None
        return payload.get("sub")
    except JWTError:
        return None

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise credentials_exception
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def authenticate_media_request(
    resource_id: str,
    credentials: Optional[HTTPAuthorizationCredentials],
    ticket: Optional[str],
    db: Session
) -> User:
    """
    Validates either standard Bearer credentials or a short-lived, resource-specific ticket.
    """
    # 1. Bearer token check
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user
        except JWTError:
            pass

    # 2. Resource-specific streaming ticket check
    if ticket:
        user_id = verify_streaming_ticket(ticket, resource_id)
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: valid bearer token or short-lived streaming ticket required",
        headers={"WWW-Authenticate": "Bearer"},
    )
