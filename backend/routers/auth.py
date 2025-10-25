from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from models import User, AuditLog
from schemas import UserSignup, UserLogin, VerifyEmail, Token, UserResponse
from auth import (
    get_password_hash, verify_password, create_access_token,
    generate_otp, get_current_user
)
import json

router = APIRouter()

@router.post("/signup", response_model=dict)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    otp = generate_otp()
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        otp=otp,
        otp_expiry=datetime.utcnow() + timedelta(minutes=10)
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
    
    # In production, send email with OTP
    # For development, OTP is returned in response
    print(f"\n{'='*60}")
    print(f"🔐 EMAIL VERIFICATION CODE FOR: {user.email}")
    print(f"📧 OTP: {otp}")
    print(f"⏰ Valid for 10 minutes")
    print(f"{'='*60}\n")
    
    return {"message": "User created. Check email for OTP.", "otp": otp}

@router.post("/verify-email", response_model=dict)
def verify_email(verify_data: VerifyEmail, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == verify_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    if user.otp != verify_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.utcnow() > user.otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    user.is_verified = True
    user.otp = None
    user.otp_expiry = None
    db.commit()
    
    return {"message": "Email verified successfully"}

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

@router.post("/resend-otp", response_model=dict)
def resend_otp(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    otp = generate_otp()
    user.otp = otp
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    return {"message": "OTP resent", "otp": otp}
