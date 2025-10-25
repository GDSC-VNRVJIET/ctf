from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import secrets
import json

from database import get_db
from models import User, Team, TeamMember, AuditLog
from schemas import TeamCreate, TeamJoin, TeamResponse, TeamMemberResponse
from auth import require_verified

router = APIRouter()

def generate_invite_code():
    return secrets.token_urlsafe(8)

@router.post("", response_model=TeamResponse)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Check if user already in a team
    existing_membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    if existing_membership:
        raise HTTPException(status_code=400, detail="Already in a team")
    
    # Check team name uniqueness
    existing_team = db.query(Team).filter(Team.name == team_data.name).first()
    if existing_team:
        raise HTTPException(status_code=400, detail="Team name already taken")
    
    # Create team
    team = Team(
        name=team_data.name,
        description=team_data.description,
        captain_user_id=current_user.id,
        capacity=team_data.capacity,
        invite_code=generate_invite_code()
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Add creator as captain
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role="captain"
    )
    db.add(member)
    
    # Update user role
    current_user.role = "team_captain"
    
    # Log
    log = AuditLog(
        user_id=current_user.id,
        action="create_team",
        details_json=json.dumps({"team_id": team.id, "team_name": team.name})
    )
    db.add(log)
    db.commit()
    
    return team

@router.post("/{team_id}/join", response_model=dict)
def join_team(
    team_id: str,
    join_data: TeamJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Check if user already in a team
    existing_membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    if existing_membership:
        raise HTTPException(status_code=400, detail="Already in a team")
    
    # Get team
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Verify invite code
    if team.invite_code != join_data.invite_code:
        raise HTTPException(status_code=400, detail="Invalid invite code")
    
    # Check capacity
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
    if member_count >= team.capacity:
        raise HTTPException(status_code=400, detail="Team is full")
    
    # Add member
    member = TeamMember(
        team_id=team_id,
        user_id=current_user.id,
        role="member"
    )
    db.add(member)
    
    # Log
    log = AuditLog(
        user_id=current_user.id,
        action="join_team",
        details_json=json.dumps({"team_id": team_id, "team_name": team.name})
    )
    db.add(log)
    db.commit()
    
    return {"message": "Joined team successfully"}

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
def get_team_members(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    return members

@router.delete("/{team_id}/leave", response_model=dict)
def leave_team(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this team")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    
    # If captain, transfer or disband
    if membership.role == "captain":
        other_members = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id != current_user.id
        ).all()
        
        if other_members:
            # Transfer to first member
            other_members[0].role = "captain"
            team.captain_user_id = other_members[0].user_id
        else:
            # Disband team
            db.delete(team)
    
    db.delete(membership)
    db.commit()
    
    return {"message": "Left team successfully"}

@router.get("/my/team", response_model=TeamResponse)
def get_my_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Not in any team")
    
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    return team
