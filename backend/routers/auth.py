from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from models import User, AuditLog
from schemas import UserSignup, UserLogin, Token, UserResponse
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user
)
import json

router = APIRouter()

@router.post("/signup", response_model=dict)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user (auto-verified, no OTP required)
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log
    log = AuditLog(
        user_id=user.id,
        action="signup",
        details_json=json.dumps({"email": user.email})
    )
    db.add(log)
    db.commit()
    
    # Auto-login after signup
    access_token = create_access_token(data={"sub": user.id})
    
    return {"message": "User created successfully", "access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.id})
    
    # Log
    log = AuditLog(
        user_id=user.id,
        action="login",
        details_json=json.dumps({"email": user.email})
    )
    db.add(log)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
