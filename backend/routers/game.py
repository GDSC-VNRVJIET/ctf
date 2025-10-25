from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import json

from database import get_db
from models import (
    User, Team, TeamMember, Room, Puzzle, Clue, Perk, Purchase,
    Submission, Action, AuditLog
)
from schemas import (
    RoomResponse, FlagSubmit, PerkResponse, ActionCreate,
    ActionResponse, LeaderboardEntry
)
from auth import require_verified, hash_flag
from websocket_manager import manager

router = APIRouter()

def get_user_team(db: Session, user_id: str) -> Team:
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Not in any team")
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    return team

def is_captain(db: Session, user_id: str, team_id: str) -> bool:
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == user_id,
        TeamMember.team_id == team_id
    ).first()
    return membership and membership.role == "captain"

@router.get("/rooms", response_model=List[RoomResponse])
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    rooms = db.query(Room).filter(Room.is_active == True).order_by(Room.order_index).all()
    return rooms

@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.post("/puzzles/{puzzle_id}/submit", response_model=dict)
async def submit_flag(
    puzzle_id: str,
    flag_data: FlagSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    team = get_user_team(db, current_user.id)
    
    # Check if under attack
    active_attacks = db.query(Action).filter(
        Action.target_team_id == team.id,
        Action.action_type == "attack",
        Action.status == "active",
        Action.ends_at > datetime.utcnow()
    ).first()
    
    if active_attacks:
        raise HTTPException(status_code=403, detail="Team is under attack. Cannot submit flags.")
    
    # Get puzzle
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    
    # Validate flag
    submitted_hash = hash_flag(flag_data.flag)
    is_correct = submitted_hash == puzzle.flag_hash
    
    # Record submission
    submission = Submission(
        team_id=team.id,
        puzzle_id=puzzle_id,
        submitted_flag=submitted_hash,
        is_correct=is_correct
    )
    db.add(submission)
    
    if is_correct:
        # Award points
        team.points_balance += puzzle.points_reward
        
        # Log
        log = AuditLog(
            user_id=current_user.id,
            action="solve_puzzle",
            details_json=json.dumps({
                "team_id": team.id,
                "puzzle_id": puzzle_id,
                "points": puzzle.points_reward
            })
        )
        db.add(log)
        db.commit()
        
        # Broadcast update
        await manager.broadcast_leaderboard(db)
        
        return {"message": "Correct flag!", "points_awarded": puzzle.points_reward}
    else:
        db.commit()
        return {"message": "Incorrect flag", "points_awarded": 0}

@router.post("/clues/{clue_id}/buy", response_model=dict)
async def buy_clue(
    clue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    team = get_user_team(db, current_user.id)
    
    if not is_captain(db, current_user.id, team.id):
        raise HTTPException(status_code=403, detail="Only captain can purchase clues")
    
    clue = db.query(Clue).filter(Clue.id == clue_id).first()
    if not clue:
        raise HTTPException(status_code=404, detail="Clue not found")
    
    # Check if already purchased
    existing = db.query(Purchase).filter(
        Purchase.team_id == team.id,
        Purchase.clue_id == clue_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Clue already purchased")
    
    # Check balance
    if team.points_balance < clue.cost:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # Purchase
    team.points_balance -= clue.cost
    purchase = Purchase(
        team_id=team.id,
        clue_id=clue_id
    )
    db.add(purchase)
    
    # Log
    log = AuditLog(
        user_id=current_user.id,
        action="buy_clue",
        details_json=json.dumps({"team_id": team.id, "clue_id": clue_id, "cost": clue.cost})
    )
    db.add(log)
    db.commit()
    
    await manager.broadcast_to_team(team.id, {
        "type": "clue_purchased",
        "clue": {"id": clue.id, "text": clue.text}
    })
    
    return {"message": "Clue purchased", "clue_text": clue.text}

@router.get("/perks", response_model=List[PerkResponse])
def get_perks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    perks = db.query(Perk).all()
    return perks

@router.post("/perks/{perk_id}/buy", response_model=dict)
async def buy_perk(
    perk_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    team = get_user_team(db, current_user.id)
    
    if not is_captain(db, current_user.id, team.id):
        raise HTTPException(status_code=403, detail="Only captain can purchase perks")
    
    perk = db.query(Perk).filter(Perk.id == perk_id).first()
    if not perk:
        raise HTTPException(status_code=404, detail="Perk not found")
    
    # Check if one-time and already purchased
    if perk.is_one_time:
        existing = db.query(Purchase).filter(
            Purchase.team_id == team.id,
            Purchase.perk_id == perk_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Perk already purchased")
    
    # Check balance
    if team.points_balance < perk.cost:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # Purchase
    team.points_balance -= perk.cost
    purchase = Purchase(
        team_id=team.id,
        perk_id=perk_id
    )
    db.add(purchase)
    
    # Log
    log = AuditLog(
        user_id=current_user.id,
        action="buy_perk",
        details_json=json.dumps({"team_id": team.id, "perk_id": perk_id, "cost": perk.cost})
    )
    db.add(log)
    db.commit()
    
    return {"message": "Perk purchased"}

@router.post("/actions", response_model=ActionResponse)
async def perform_action(
    action_data: ActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    team = get_user_team(db, current_user.id)
    
    if not is_captain(db, current_user.id, team.id):
        raise HTTPException(status_code=403, detail="Only captain can perform actions")
    
    if action_data.action_type == "attack":
        if not action_data.target_team_id:
            raise HTTPException(status_code=400, detail="Target team required for attack")
        
        target_team = db.query(Team).filter(Team.id == action_data.target_team_id).first()
        if not target_team:
            raise HTTPException(status_code=404, detail="Target team not found")
        
        # Check immunity
        if target_team.immunity_until and target_team.immunity_until > datetime.utcnow():
            raise HTTPException(status_code=400, detail="Target team has immunity")
        
        # Check shield
        if target_team.shield_active and target_team.shield_expiry > datetime.utcnow():
            raise HTTPException(status_code=400, detail="Target team has active shield")
        
        cost = 50.0
        if team.points_balance < cost:
            raise HTTPException(status_code=400, detail="Insufficient points")
        
        team.points_balance -= cost
        
        # Create attack
        action = Action(
            team_id=team.id,
            action_type="attack",
            target_team_id=action_data.target_team_id,
            cost=cost,
            ends_at=datetime.utcnow() + timedelta(minutes=5),
            status="active"
        )
        db.add(action)
        
        # Grant immunity to target
        target_team.immunity_until = datetime.utcnow() + timedelta(minutes=3)
        
        # Log
        log = AuditLog(
            user_id=current_user.id,
            action="attack",
            details_json=json.dumps({
                "attacker_team_id": team.id,
                "target_team_id": action_data.target_team_id
            })
        )
        db.add(log)
        db.commit()
        
        await manager.broadcast_to_team(action_data.target_team_id, {
            "type": "under_attack",
            "message": "Your team is under attack!"
        })
        
        return action
    
    elif action_data.action_type == "defend":
        cost = 30.0
        if team.points_balance < cost:
            raise HTTPException(status_code=400, detail="Insufficient points")
        
        team.points_balance -= cost
        team.shield_active = True
        team.shield_expiry = datetime.utcnow() + timedelta(minutes=10)
        
        action = Action(
            team_id=team.id,
            action_type="defend",
            cost=cost,
            ends_at=team.shield_expiry,
            status="active"
        )
        db.add(action)
        
        # Log
        log = AuditLog(
            user_id=current_user.id,
            action="defend",
            details_json=json.dumps({"team_id": team.id})
        )
        db.add(log)
        db.commit()
        
        return action
    
    elif action_data.action_type == "invest":
        if not action_data.investment_amount:
            raise HTTPException(status_code=400, detail="Investment amount required")
        
        if team.points_balance < action_data.investment_amount:
            raise HTTPException(status_code=400, detail="Insufficient points")
        
        team.points_balance -= action_data.investment_amount
        
        action = Action(
            team_id=team.id,
            action_type="invest",
            cost=action_data.investment_amount,
            result_json=json.dumps({"invested": action_data.investment_amount}),
            status="pending"
        )
        db.add(action)
        
        # Log
        log = AuditLog(
            user_id=current_user.id,
            action="invest",
            details_json=json.dumps({
                "team_id": team.id,
                "amount": action_data.investment_amount
            })
        )
        db.add(log)
        db.commit()
        
        return action
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action type")

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    teams = db.query(Team).all()
    
    leaderboard = []
    for team in teams:
        # Calculate score
        solved_puzzles = db.query(Submission).filter(
            Submission.team_id == team.id,
            Submission.is_correct == True
        ).count()
        
        room_index = 0
        if team.current_room_id:
            room = db.query(Room).filter(Room.id == team.current_room_id).first()
            if room:
                room_index = room.order_index
        
        # Check if under attack
        under_attack = db.query(Action).filter(
            Action.target_team_id == team.id,
            Action.action_type == "attack",
            Action.status == "active",
            Action.ends_at > datetime.utcnow()
        ).first() is not None
        
        score = team.points_balance + (solved_puzzles * 100) + (room_index * 500)
        
        leaderboard.append(LeaderboardEntry(
            team_id=team.id,
            team_name=team.name,
            score=score,
            room_index=room_index,
            points_balance=team.points_balance,
            shield_active=team.shield_active and team.shield_expiry > datetime.utcnow() if team.shield_expiry else False,
            under_attack=under_attack
        ))
    
    leaderboard.sort(key=lambda x: x.score, reverse=True)
    return leaderboard

@router.post("/rooms/{room_id}/unlock", response_model=dict)
async def unlock_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    team = get_user_team(db, current_user.id)
    
    if not is_captain(db, current_user.id, team.id):
        raise HTTPException(status_code=403, detail="Only captain can unlock rooms")
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if can unlock (must be next room)
    if team.current_room_id:
        current_room = db.query(Room).filter(Room.id == team.current_room_id).first()
        if room.order_index != current_room.order_index + 1:
            raise HTTPException(status_code=400, detail="Must unlock rooms in order")
    else:
        if room.order_index != 1:
            raise HTTPException(status_code=400, detail="Must start with Room 1")
    
    # Check cost
    if team.points_balance < room.unlock_cost:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    team.points_balance -= room.unlock_cost
    team.current_room_id = room_id
    
    # Log
    log = AuditLog(
        user_id=current_user.id,
        action="unlock_room",
        details_json=json.dumps({"team_id": team.id, "room_id": room_id})
    )
    db.add(log)
    db.commit()
    
    await manager.broadcast_leaderboard(db)
    
    return {"message": f"Unlocked {room.name}"}
