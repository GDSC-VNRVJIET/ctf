from fastapi import APIRouter, HTTPException, Depends
from typing import List
from schemas import TeamCreate, TeamJoin, TeamResponse, TeamMemberResponse, TeamJoinRequestResponse
from auth import require_verified
from services.convex_client import convex_query, convex_mutation

router = APIRouter()

@router.post("", response_model=TeamResponse)
def create_team(team_data: TeamCreate, current_user: dict = Depends(require_verified)):
    # Check if user already in a team
    membership = convex_query("getUserTeam", {"user_id": current_user["id"]})
    if membership:
        raise HTTPException(status_code=400, detail="Already in a team")
    # Check team name uniqueness
    existing_team = convex_query("getTeamByName", {"name": team_data.name})
    if existing_team:
        raise HTTPException(status_code=400, detail="Team name already taken")
    # Create team
    team = convex_mutation("createTeam", {
        "name": team_data.name,
        "description": team_data.description,
        "captain_user_id": current_user["id"],
        "capacity": team_data.capacity
    })
    # Add creator as captain
    convex_mutation("addTeamMember", {
        "team_id": team["id"],
        "user_id": current_user["id"],
        "role": "captain"
    })
    # Log event
    convex_mutation("logActivity", {
        "user_id": current_user["id"],
        "action": "create_team",
        "details": {"team_id": team["id"], "team_name": team["name"]}
    })
    return team

@router.post("/{team_id}/join", response_model=dict)
def request_join_team(team_id: str, join_data: TeamJoin, current_user: dict = Depends(require_verified)):
    # Check if user already in a team
    membership = convex_query("getUserTeam", {"user_id": current_user["id"]})
    if membership:
        raise HTTPException(status_code=400, detail="Already in a team")
    # Get team
    team = convex_query("getTeamById", {"team_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    # Verify invite code
    if team["invite_code"] != join_data.invite_code:
        convex_mutation("logActivity", {
            "user_id": current_user["id"],
            "action": "failed_join_attempt",
            "details": {"team_id": team_id, "reason": "invalid_invite_code"}
        })
        raise HTTPException(status_code=400, detail="Invalid invite code")
    # Check capacity
    if len(team["members"]) >= team["capacity"]:
        raise HTTPException(status_code=400, detail="Team is full")
    # Add join request
    convex_mutation("addJoinRequest", {
        "team_id": team_id,
        "user_id": current_user["id"]
    })
    return {"message": "Join request submitted"}

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: str,
    current_user: dict = Depends(require_verified)
):
    # Check if user is member of this team
    membership = convex_query("getTeamMembership", {
        "user_id": current_user["id"],
        "team_id": team_id
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view this team")
    
    team = convex_query("getTeamById", {"team_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.get("/{team_id}/members", response_model=list[TeamMemberResponse])
def get_team_members(
    team_id: str,
    current_user: dict = Depends(require_verified)
):
    # Check if user is member of this team
    membership = convex_query("getTeamMembership", {
        "user_id": current_user["id"],
        "team_id": team_id
    })
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view this team's members")
    
    members = convex_query("getTeamMembers", {"team_id": team_id})
    return members

@router.delete("/{team_id}/leave", response_model=dict)
def leave_team(
    team_id: str,
    current_user: dict = Depends(require_verified)
):
    membership = convex_query("getTeamMembership", {
        "team_id": team_id,
        "user_id": current_user["id"]
    })
    
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this team")
    
    team = convex_query("getTeamById", {"team_id": team_id})
    
    # If captain, transfer or disband
    if membership["role"] == "captain":
        other_members = convex_query("getOtherTeamMembers", {
            "team_id": team_id,
            "exclude_user_id": current_user["id"]
        })
        
        if other_members:
            # Transfer to first member
            convex_mutation("updateTeamCaptain", {
                "team_id": team_id,
                "new_captain_id": other_members[0]["user_id"]
            })
        else:
            # Disband team
            convex_mutation("deleteTeam", {"team_id": team_id})
    
    convex_mutation("removeTeamMember", {
        "team_id": team_id,
        "user_id": current_user["id"]
    })
    
    return {"message": "Left team successfully"}

@router.get("/my/team", response_model=TeamResponse)
def get_my_team(
    current_user: dict = Depends(require_verified)
):
    membership = convex_query("getUserTeam", {"user_id": current_user["id"]})
    
    if not membership:
        raise HTTPException(status_code=404, detail="Not in any team")
    
    team = convex_query("getTeamById", {"team_id": membership["team_id"]})
    return team

@router.get("/{team_id}/join-requests", response_model=List[TeamJoinRequestResponse])
def get_team_join_requests(
    team_id: str,
    current_user: dict = Depends(require_verified)
):
    # Check if user is captain
    membership = convex_query("getTeamMembership", {
        "team_id": team_id,
        "user_id": current_user["id"]
    })
    if not membership or membership["role"] != "captain":
        raise HTTPException(status_code=403, detail="Team captain access required")
    
    requests = convex_query("getTeamJoinRequests", {
        "team_id": team_id,
        "status": "pending"
    })
    
    # Log access
    convex_mutation("logActivity", {
        "user_id": current_user["id"],
        "action": "view_join_requests",
        "details": {
            "team_id": team_id,
            "request_count": len(requests)
        }
    })
    
    return requests

@router.post("/{team_id}/join-requests/{request_id}/accept", response_model=dict)
def accept_join_request(
    team_id: str,
    request_id: str,
    current_user: dict = Depends(require_verified)
):
    # Check if current user is captain
    membership = convex_query("getTeamMembership", {"teamId": team_id, "userId": current_user["id"]})
    if not membership or membership["role"] != "captain":
        raise HTTPException(status_code=403, detail="Only team captain can accept join requests")
    
    # Accept the join request using Convex mutation
    try:
        result = convex_mutation("acceptJoinRequest", {
            "teamId": team_id,
            "requestId": request_id,
            "captainId": current_user["id"]
        })
        return {"message": "Join request accepted"}
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Request not found")
        elif "full" in str(e).lower():
            raise HTTPException(status_code=400, detail="Team is full")
        elif "already in team" in str(e).lower():
            raise HTTPException(status_code=400, detail="User already in a team")
        else:
            raise HTTPException(status_code=500, detail="Failed to accept join request")

@router.post("/{team_id}/join-requests/{request_id}/reject", response_model=dict)
def reject_join_request(
    team_id: str,
    request_id: str,
    current_user: dict = Depends(require_verified)
):
    # Check if current user is captain
    membership = convex_query("getTeamMembership", {"teamId": team_id, "userId": current_user["id"]})
    if not membership or membership["role"] != "captain":
        raise HTTPException(status_code=403, detail="Only team captain can reject join requests")
    
    # Reject the join request using Convex mutation
    try:
        result = convex_mutation("rejectJoinRequest", {
            "teamId": team_id,
            "requestId": request_id,
            "captainId": current_user["id"]
        })
        return {"message": "Join request rejected"}
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Request not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to reject join request")

@router.get("/by-invite/{invite_code}", response_model=TeamResponse)
def get_team_by_invite_code(
    invite_code: str,
    current_user: dict = Depends(require_verified)
):
    team = convex_query("getTeamByInviteCode", {"inviteCode": invite_code})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/leave", response_model=dict)
def leave_team(
    current_user: dict = Depends(require_verified)
):
    # Leave team using Convex mutation
    try:
        result = convex_mutation("leaveTeam", {
            "userId": current_user["id"]
        })
        return {"message": "Left team successfully"}
    except Exception as e:
        if "not in any team" in str(e).lower():
            raise HTTPException(status_code=400, detail="Not in any team")
        elif "captain cannot leave" in str(e).lower():
            raise HTTPException(status_code=400, detail="Captain cannot leave team. Use delete team instead.")
        else:
            raise HTTPException(status_code=500, detail="Failed to leave team")

@router.delete("/{team_id}", response_model=dict)
def delete_team(
    team_id: str,
    current_user: dict = Depends(require_verified)
):
    # Check if current user is captain
    membership = convex_query("getTeamMembership", {"teamId": team_id, "userId": current_user["id"]})
    if not membership or membership["role"] != "captain":
        raise HTTPException(status_code=403, detail="Only team captain can delete team")
    
    # Delete team using Convex mutation
    try:
        result = convex_mutation("deleteTeam", {
            "teamId": team_id,
            "captainId": current_user["id"]
        })
        return {"message": "Team deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete team")

@router.delete("/{team_id}/members/{user_id}", response_model=dict)
def remove_team_member(
    team_id: str,
    user_id: str,
    current_user: dict = Depends(require_verified)
):
    # Cannot remove yourself
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from team")
    
    # Check if current user is captain
    membership = convex_query("getTeamMembership", {"teamId": team_id, "userId": current_user["id"]})
    if not membership or membership["role"] != "captain":
        raise HTTPException(status_code=403, detail="Only team captain can remove members")
    
    # Remove team member using Convex mutation
    try:
        result = convex_mutation("removeTeamMember", {
            "teamId": team_id,
            "memberId": user_id,
            "captainId": current_user["id"]
        })
        return {"message": "Member removed successfully"}
    except Exception as e:
        if "not a member" in str(e).lower():
            raise HTTPException(status_code=404, detail="User is not a member of this team")
        else:
            raise HTTPException(status_code=500, detail="Failed to remove team member")
