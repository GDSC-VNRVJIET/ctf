from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List, Optional
import secrets
import json
from datetime import datetime, timedelta
import ipaddress
from sqlalchemy import func, and_, or_

from database import get_db
from models import Team, TeamMember, User, AuditLog, TeamJoinRequest
from schemas import TeamCreate, TeamJoin, TeamResponse, TeamMemberResponse, TeamJoinRequestResponse
from auth import require_verified
from sqlalchemy import func, and_, or_
from fastapi import Request

router = APIRouter()

def generate_invite_code():
    return secrets.token_urlsafe(8)

def check_rate_limit(db: Session, user_id: str, action: str, limit: int, window_minutes: int):
    """Check if user has exceeded rate limit for an action"""
    cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
    
    recent_actions = db.query(AuditLog).filter(
        and_(
            AuditLog.user_id == user_id,
            AuditLog.action == action,
            AuditLog.created_at >= cutoff
        )
    ).count()
    
    if recent_actions >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {action}. Try again later."
        )

def require_team_captain(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
) -> tuple[Team, TeamMember]:
    """Require user to be captain of the specified team"""
    # Check membership and role consistency
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == team_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    # Get team and verify captain status
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Double-check captain status (defense in depth)
    if team.captain_user_id != current_user.id and membership.role != "captain":
        raise HTTPException(status_code=403, detail="Team captain access required")
    
    return team, membership

def require_team_member(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
) -> tuple[Team, TeamMember]:
    """Require user to be a member of the specified team"""
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == team_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    return team, membership

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

@router.post("", response_model=TeamResponse)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Rate limiting for team creation
    check_rate_limit(db, current_user.id, "create_team", limit=3, window_minutes=60)
    
    # Check if user already in a team
    existing_membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    if existing_membership:
        raise HTTPException(status_code=400, detail="Already in a team")
    
    # Check team name uniqueness (case-insensitive)
    existing_team = db.query(Team).filter(
        func.lower(Team.name) == func.lower(team_data.name)
    ).first()
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
    
    # Log security event
    log_security_event(
        db, 
        current_user.id, 
        "create_team", 
        {
            "team_id": team.id,
            "team_name": team.name,
            "capacity": team.capacity
        }
    )
    db.commit()
    
    return team

@router.post("/{team_id}/join", response_model=dict)
def request_join_team(
    team_id: str,
    join_data: TeamJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified),
    fastapi_request = None  # FastAPI request object for IP tracking
):
    # Rate limiting for join requests
    check_rate_limit(db, current_user.id, "request_join_team", limit=5, window_minutes=30)
    
    # Check if user already in a team
    existing_membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    if existing_membership:
        raise HTTPException(status_code=400, detail="Already in a team")
    
    # Get team (no membership required for joining)
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Verify invite code
    if team.invite_code != join_data.invite_code:
        # Log failed attempt
        log_security_event(
            db,
            current_user.id,
            "failed_join_attempt",
            {
                "team_id": team_id,
                "reason": "invalid_invite_code"
            },
            ip_address=fastapi_request.client.host if fastapi_request else None
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid invite code")
    
    # Check capacity
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
    if member_count >= team.capacity:
        raise HTTPException(status_code=400, detail="Team is full")
    
    # Check if user already has a pending request for this team
    existing_request = db.query(TeamJoinRequest).filter(
        TeamJoinRequest.user_id == current_user.id,
        TeamJoinRequest.team_id == team_id,
        TeamJoinRequest.status == "pending"
    ).first()
    if existing_request:
        raise HTTPException(status_code=400, detail="Join request already pending")
    
    # Create join request
    request = TeamJoinRequest(
        team_id=team_id,
        user_id=current_user.id
    )
    db.add(request)
    
    # Log security event
    log_security_event(
        db,
        current_user.id,
        "request_join_team",
        {
            "team_id": team_id,
            "team_name": team.name,
            "user_ip": fastapi_request.client.host if fastapi_request else None
        }
    )
    db.commit()
    
    return {"message": "Join request sent successfully"}

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Check if user is member of this team
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == team_id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view this team")
    
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
    # Check if user is member of this team
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == team_id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view this team's members")
    
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

@router.get("/{team_id}/join-requests", response_model=List[TeamJoinRequestResponse])
def get_team_join_requests(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Use helper function for consistent authorization
    team, _ = require_team_captain(team_id, db, current_user)
    
    requests = db.query(TeamJoinRequest).filter(
        TeamJoinRequest.team_id == team_id,
        TeamJoinRequest.status == "pending"
    ).options(joinedload(TeamJoinRequest.user), joinedload(TeamJoinRequest.team)).all()
    
    # Log access
    log_security_event(
        db,
        current_user.id,
        "view_join_requests",
        {
            "team_id": team_id,
            "request_count": len(requests)
        }
    )
    db.commit()
    
    return requests

@router.post("/{team_id}/join-requests/{request_id}/accept", response_model=dict)
def accept_join_request(
    team_id: str,
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Use helper function for consistent authorization
    team, membership = require_team_captain(team_id, db, current_user)
    
    # Get request with atomic locking to prevent race conditions
    request = db.query(TeamJoinRequest).filter(
        TeamJoinRequest.id == request_id,
        TeamJoinRequest.team_id == team_id,
        TeamJoinRequest.status == "pending"
    ).with_for_update(read=True).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Double-check team capacity (race condition prevention)
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
    if member_count >= team.capacity:
        request.status = "rejected"
        request.responded_at = datetime.utcnow()
        log_security_event(
            db,
            current_user.id,
            "auto_reject_join_request",
            {
                "team_id": team_id,
                "request_id": request_id,
                "reason": "team_full"
            }
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Team is full")
    
    # Check if user is already in a team (another race condition check)
    existing_membership = db.query(TeamMember).filter(
        TeamMember.user_id == request.user_id
    ).first()
    if existing_membership:
        request.status = "rejected"
        request.responded_at = datetime.utcnow()
        log_security_event(
            db,
            current_user.id,
            "auto_reject_join_request",
            {
                "team_id": team_id,
                "request_id": request_id,
                "user_id": request.user_id,
                "reason": "user_already_in_team"
            }
        )
        db.commit()
        raise HTTPException(status_code=400, detail="User already in a team")
    
    # Add member
    member = TeamMember(
        team_id=team_id,
        user_id=request.user_id,
        role="member"
    )
    db.add(member)
    
    # Update request
    request.status = "accepted"
    request.responded_at = datetime.utcnow()
    
    # Log security event
    log_security_event(
        db,
        current_user.id,
        "accept_join_request",
        {
            "team_id": team_id,
            "team_name": team.name,
            "user_id": request.user_id,
            "request_id": request_id,
            "total_members": member_count + 1
        }
    )
    db.commit()
    
    return {"message": "Join request accepted"}

@router.post("/{team_id}/join-requests/{request_id}/reject", response_model=dict)
def reject_join_request(
    team_id: str,
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Use helper function for consistent authorization
    team, membership = require_team_captain(team_id, db, current_user)
    
    # Get request
    request = db.query(TeamJoinRequest).filter(
        TeamJoinRequest.id == request_id,
        TeamJoinRequest.team_id == team_id,
        TeamJoinRequest.status == "pending"
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update request
    request.status = "rejected"
    request.responded_at = datetime.utcnow()
    
    # Log security event
    log_security_event(
        db,
        current_user.id,
        "reject_join_request",
        {
            "team_id": team_id,
            "user_id": request.user_id,
            "request_id": request_id
        }
    )
    db.commit()
    
    return {"message": "Join request rejected"}

@router.get("/by-invite/{invite_code}", response_model=TeamResponse)
def get_team_by_invite_code(
    invite_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    team = db.query(Team).filter(Team.invite_code == invite_code).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/leave", response_model=dict)
def leave_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Rate limiting for team leaving
    check_rate_limit(db, current_user.id, "leave_team", limit=3, window_minutes=60)
    
    # Find user's team membership
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=400, detail="Not in any team")
    
    # Check if user is captain
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.captain_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Captain cannot leave team. Use delete team instead.")
    
    # Remove membership
    db.delete(membership)
    
    # Log security event
    log_security_event(
        db,
        current_user.id,
        "leave_team",
        {
            "team_id": team.id,
            "team_name": team.name
        }
    )
    db.commit()
    
    return {"message": "Left team successfully"}

@router.delete("/{team_id}", response_model=dict)
def delete_team(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Rate limiting for team deletion
    check_rate_limit(db, current_user.id, "delete_team", limit=2, window_minutes=120)
    
    # Use helper function for consistent authorization
    team, membership = require_team_captain(team_id, db, current_user)
    
    # Get final member count for audit log
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
    pending_requests = db.query(TeamJoinRequest).filter(
        TeamJoinRequest.team_id == team_id,
        TeamJoinRequest.status == "pending"
    ).count()
    
    # Delete all team members
    db.query(TeamMember).filter(TeamMember.team_id == team_id).delete()
    
    # Delete all join requests
    db.query(TeamJoinRequest).filter(TeamJoinRequest.team_id == team_id).delete()
    
    # Delete team
    db.delete(team)
    
    # Log security event
    log_security_event(
        db,
        current_user.id,
        "delete_team",
        {
            "team_id": team_id,
            "team_name": team.name,
            "deleted_members": member_count,
            "deleted_pending_requests": pending_requests
        }
    )
    db.commit()
    
    return {"message": "Team deleted successfully"}

@router.delete("/{team_id}/members/{user_id}", response_model=dict)
def remove_team_member(
    team_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified)
):
    # Only captain can remove members
    team, membership = require_team_captain(team_id, db, current_user)
    
    # Cannot remove yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from team")
    
    # Get target membership
    target_membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    
    if not target_membership:
        raise HTTPException(status_code=404, detail="User is not a member of this team")
    
    # Remove membership
    db.delete(target_membership)
    
    # Log security event
    log_security_event(
        db,
        current_user.id,
        "remove_team_member",
        {
            "team_id": team_id,
            "removed_user_id": user_id
        }
    )
    
    db.commit()
    
    return {"message": "Member removed successfully"}
