from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from database import get_db
from models import User, Team, Room, Puzzle, Clue, Perk, AuditLog
from schemas import (
    RoomCreate, PuzzleCreate, ClueCreate, TeamOverride,
    RoomResponse, PuzzleResponse
)
from auth import require_admin, hash_flag

router = APIRouter()

@router.post("/rooms", response_model=RoomResponse)
def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    room = Room(
        name=room_data.name,
        order_index=room_data.order_index,
        description=room_data.description,
        is_challenge=room_data.is_challenge,
        unlock_cost=room_data.unlock_cost,
        challenge_investment=room_data.challenge_investment
    )
    db.add(room)
    
    log = AuditLog(
        user_id=admin.id,
        action="create_room",
        details_json=json.dumps({"room_name": room.name})
    )
    db.add(log)
    db.commit()
    db.refresh(room)
    
    return room

@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: str,
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room.name = room_data.name
    room.order_index = room_data.order_index
    room.description = room_data.description
    room.is_challenge = room_data.is_challenge
    room.unlock_cost = room_data.unlock_cost
    room.challenge_investment = room_data.challenge_investment
    
    log = AuditLog(
        user_id=admin.id,
        action="update_room",
        details_json=json.dumps({"room_id": room_id})
    )
    db.add(log)
    db.commit()
    
    return room

@router.delete("/rooms/{room_id}")
def delete_room(
    room_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db.delete(room)
    
    log = AuditLog(
        user_id=admin.id,
        action="delete_room",
        details_json=json.dumps({"room_id": room_id})
    )
    db.add(log)
    db.commit()
    
    return {"message": "Room deleted"}

@router.post("/puzzles", response_model=PuzzleResponse)
def create_puzzle(
    puzzle_data: PuzzleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    puzzle = Puzzle(
        room_id=puzzle_data.room_id,
        title=puzzle_data.title,
        type=puzzle_data.type,
        description=puzzle_data.description,
        flag_hash=hash_flag(puzzle_data.flag),
        points_reward=puzzle_data.points_reward
    )
    db.add(puzzle)
    
    log = AuditLog(
        user_id=admin.id,
        action="create_puzzle",
        details_json=json.dumps({"puzzle_title": puzzle.title})
    )
    db.add(log)
    db.commit()
    db.refresh(puzzle)
    
    return puzzle

@router.put("/puzzles/{puzzle_id}", response_model=PuzzleResponse)
def update_puzzle(
    puzzle_id: str,
    puzzle_data: PuzzleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    
    puzzle.room_id = puzzle_data.room_id
    puzzle.title = puzzle_data.title
    puzzle.type = puzzle_data.type
    puzzle.description = puzzle_data.description
    puzzle.flag_hash = hash_flag(puzzle_data.flag)
    puzzle.points_reward = puzzle_data.points_reward
    
    log = AuditLog(
        user_id=admin.id,
        action="update_puzzle",
        details_json=json.dumps({"puzzle_id": puzzle_id})
    )
    db.add(log)
    db.commit()
    
    return puzzle

@router.delete("/puzzles/{puzzle_id}")
def delete_puzzle(
    puzzle_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    
    db.delete(puzzle)
    
    log = AuditLog(
        user_id=admin.id,
        action="delete_puzzle",
        details_json=json.dumps({"puzzle_id": puzzle_id})
    )
    db.add(log)
    db.commit()
    
    return {"message": "Puzzle deleted"}

@router.post("/clues", response_model=dict)
def create_clue(
    clue_data: ClueCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    clue = Clue(
        puzzle_id=clue_data.puzzle_id,
        text=clue_data.text,
        cost=clue_data.cost,
        order_index=clue_data.order_index
    )
    db.add(clue)
    
    log = AuditLog(
        user_id=admin.id,
        action="create_clue",
        details_json=json.dumps({"puzzle_id": clue_data.puzzle_id})
    )
    db.add(log)
    db.commit()
    
    return {"message": "Clue created", "id": clue.id}

@router.post("/teams/override-progress", response_model=dict)
def override_team_progress(
    override_data: TeamOverride,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    team = db.query(Team).filter(Team.id == override_data.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    room = db.query(Room).filter(Room.id == override_data.new_room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    team.current_room_id = override_data.new_room_id
    
    log = AuditLog(
        user_id=admin.id,
        action="override_team_progress",
        details_json=json.dumps({
            "team_id": override_data.team_id,
            "new_room_id": override_data.new_room_id,
            "reason": override_data.reason
        })
    )
    db.add(log)
    db.commit()
    
    return {"message": "Team progress overridden"}

@router.get("/logs")
def get_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs

@router.get("/teams")
def get_all_teams(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    teams = db.query(Team).all()
    return teams

@router.post("/teams/{team_id}/refund", response_model=dict)
def refund_points(
    team_id: str,
    amount: float,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team.points_balance += amount
    
    log = AuditLog(
        user_id=admin.id,
        action="refund_points",
        details_json=json.dumps({"team_id": team_id, "amount": amount})
    )
    db.add(log)
    db.commit()
    
    return {"message": f"Refunded {amount} points to {team.name}"}

@router.post("/teams/{team_id}/disable", response_model=dict)
def disable_team(
    team_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team.points_balance = 0
    team.current_room_id = None
    
    log = AuditLog(
        user_id=admin.id,
        action="disable_team",
        details_json=json.dumps({"team_id": team_id})
    )
    db.add(log)
    db.commit()
    
    return {"message": f"Team {team.name} disabled"}
