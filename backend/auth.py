from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import secrets
import hashlib
import re
from sqlalchemy import and_
import json

from database import get_db
from models import User, Submission, Team, AuditLog

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    # bcrypt has a 72-byte limit, truncate if necessary
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password = password_bytes[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)

def hash_flag(flag: str) -> str:
    import secrets as crypto_secrets
    
    # Add random salt to prevent rainbow table attacks
    salt = crypto_secrets.token_hex(16)
    return hashlib.sha256(f"{flag}{SECRET_KEY}{salt}".encode()).hexdigest()

def validate_flag_format(flag: str) -> bool:
    """Validate flag format to prevent injection attacks"""
    if not flag:
        return False
    
    # CTF flags typically follow format: CTF{...} or similar
    # Allow alphanumeric, underscores, hyphens, braces only
    pattern = r'^[A-Za-z0-9_\-{}\[\]@:.]+$'
    
    # Check length (prevent extremely long flags that could cause DoS)
    if len(flag) > 500:
        return False
    
    # Check for suspicious patterns
    if re.search(r'[\'";<>&|]', flag):
        return False
    
    return re.match(pattern, flag) is not None

def check_submission_rate_limit(db: Session, team_id: str, puzzle_id: str, limit: int = 10, window_minutes: int = 5):
    """Rate limit flag submissions per team per puzzle"""
    cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
    
    recent_submissions = db.query(Submission).filter(
        and_(
            Submission.team_id == team_id,
            Submission.puzzle_id == puzzle_id,
            Submission.submission_time >= cutoff
        )
    ).count()
    
    if recent_submissions >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Too many flag submissions. Please wait before trying again."
        )

def verify_team_state(team: Team) -> None:
    """Verify team is in valid state for game participation"""
    if team.points_balance < 0:
        raise HTTPException(status_code=403, detail="Team in invalid state")
    
    if team.immunity_until and team.immunity_until > datetime.utcnow():
        # Team has immunity, but check if it's legitimate
        pass

def log_security_event(db: Session, user_id: str, action: str, details: dict, ip_address: Optional[str] = None):
    """Log security-relevant events"""
    log = AuditLog(
        user_id=user_id,
        action=action,
        details_json=json.dumps({
            **details,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow().isoformat()
        })
    )
    db.add(log)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def require_verified(user: User = Depends(get_current_user)) -> User:
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ["admin", "organiser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
