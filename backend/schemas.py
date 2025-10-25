from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyEmail(BaseModel):
    email: EmailStr
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_verified: bool

    class Config:
        from_attributes = True

# Team Schemas
class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: int = 4

class TeamJoin(BaseModel):
    invite_code: str

class TeamResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    captain_user_id: str
    capacity: int
    points_balance: float
    current_room_id: Optional[str]
    invite_code: str
    shield_active: bool

    class Config:
        from_attributes = True

class TeamMemberResponse(BaseModel):
    id: str
    user_id: str
    role: str
    joined_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

# Room & Puzzle Schemas
class ClueResponse(BaseModel):
    id: str
    text: str
    cost: float
    is_one_time: bool
    order_index: int

    class Config:
        from_attributes = True

class PuzzleResponse(BaseModel):
    id: str
    title: str
    type: str
    description: str
    points_reward: float
    clues: List[ClueResponse] = []

    class Config:
        from_attributes = True

class RoomResponse(BaseModel):
    id: str
    name: str
    order_index: int
    description: str
    is_challenge: bool
    unlock_cost: float
    puzzles: List[PuzzleResponse] = []

    class Config:
        from_attributes = True

class FlagSubmit(BaseModel):
    flag: str

# Purchase Schemas
class PerkResponse(BaseModel):
    id: str
    name: str
    description: str
    cost: float
    is_one_time: bool
    perk_type: str

    class Config:
        from_attributes = True

class PurchaseResponse(BaseModel):
    id: str
    team_id: str
    perk_id: Optional[str]
    clue_id: Optional[str]
    purchased_at: datetime
    used_at: Optional[datetime]

    class Config:
        from_attributes = True

# Action Schemas
class ActionCreate(BaseModel):
    action_type: str  # attack, defend, invest
    target_team_id: Optional[str] = None
    investment_amount: Optional[float] = None

class ActionResponse(BaseModel):
    id: str
    action_type: str
    cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Leaderboard Schema
class LeaderboardEntry(BaseModel):
    team_id: str
    team_name: str
    score: float
    room_index: int
    points_balance: float
    shield_active: bool
    under_attack: bool = False

# Admin Schemas
class RoomCreate(BaseModel):
    name: str
    order_index: int
    description: str
    is_challenge: bool = False
    unlock_cost: float = 0
    challenge_investment: Optional[float] = None

class PuzzleCreate(BaseModel):
    room_id: str
    title: str
    type: str = "static_flag"
    description: str
    flag: str
    points_reward: float = 100.0

class ClueCreate(BaseModel):
    puzzle_id: str
    text: str
    cost: float
    order_index: int = 0

class TeamOverride(BaseModel):
    team_id: str
    new_room_id: str
    reason: str
