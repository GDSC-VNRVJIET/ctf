from fastapi import APIRouter, HTTPException, status, Depends
from schemas import UserSignup, UserLogin, Token, UserResponse
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from services.convex_client import convex_query, convex_mutation

router = APIRouter()

@router.post("/signup", response_model=dict)
def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = convex_query("auth:getUserByEmail", {"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    # Create user in Convex
    user = convex_mutation("createUser", {
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "name": user_data.name
    })
    access_token = create_access_token(data={"sub": user["id"]})
    return {"message": "User created successfully", "access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(login_data: UserLogin):
    user = convex_query("getUserByEmail", {"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    # get_current_user should use Convex to fetch user by ID
    return current_user
