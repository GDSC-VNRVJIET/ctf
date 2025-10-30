from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from datetime import datetime, timedelta
import json

from schemas import (
    RoomResponse, FlagSubmit, PerkResponse, ActionCreate,
    ActionResponse, LeaderboardEntry
)
from auth import (
    require_verified, hash_flag, validate_flag_format,
    check_submission_rate_limit, verify_team_state, log_security_event
)
from services.convex_client import convex_query, convex_mutation

router = APIRouter()

@router.get("/rooms", response_model=List[RoomResponse])
def get_rooms(
    current_user: dict = Depends(require_verified)
):
    rooms = convex_query("getActiveRooms", {})
    return rooms

@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: str,
    current_user: dict = Depends(require_verified)
):
    # Get room with puzzles and check access
    room = convex_query("getRoomWithAccessCheck", {
        "roomId": room_id,
        "userId": current_user["id"]
    })
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.post("/puzzles/{puzzle_id}/submit", response_model=dict)
async def submit_flag(
    puzzle_id: str,
    flag_data: FlagSubmit,
    current_user: dict = Depends(require_verified),
    request: Request = None
):
    # Submit flag using Convex mutation
    try:
        result = convex_mutation("submitFlag", {
            "puzzleId": puzzle_id,
            "flag": flag_data.flag,
            "userId": current_user["id"],
            "ipAddress": request.client.host if request else None
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Puzzle not found or inactive")
        elif "not unlocked" in str(e).lower():
            raise HTTPException(status_code=403, detail="Room not unlocked yet")
        elif "under attack" in str(e).lower():
            raise HTTPException(status_code=403, detail="Team is under attack. Cannot submit flags.")
        elif "already solved" in str(e).lower():
            raise HTTPException(status_code=400, detail="Puzzle already solved")
        elif "invalid format" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid flag format")
        else:
            raise HTTPException(status_code=500, detail="Failed to submit flag")

@router.post("/clues/{clue_id}/buy", response_model=dict)
async def buy_clue(
    clue_id: str,
    current_user: dict = Depends(require_verified)
):
    # Buy clue using Convex mutation
    try:
        result = convex_mutation("buyClue", {
            "clueId": clue_id,
            "userId": current_user["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Clue not found")
        elif "only captain" in str(e).lower():
            raise HTTPException(status_code=403, detail="Only captain can purchase clues")
        elif "already purchased" in str(e).lower():
            raise HTTPException(status_code=400, detail="Clue already purchased")
        elif "insufficient" in str(e).lower():
            raise HTTPException(status_code=400, detail="Insufficient points")
        else:
            raise HTTPException(status_code=500, detail="Failed to purchase clue")

@router.get("/perks", response_model=List[PerkResponse])
def get_perks(
    current_user: dict = Depends(require_verified)
):
    perks = convex_query("getPerks", {})
    return perks

@router.post("/perks/{perk_id}/buy", response_model=dict)
async def buy_perk(
    perk_id: str,
    current_user: dict = Depends(require_verified)
):
    # Buy perk using Convex mutation
    try:
        result = convex_mutation("buyPerk", {
            "perkId": perk_id,
            "userId": current_user["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Perk not found")
        elif "only captain" in str(e).lower():
            raise HTTPException(status_code=403, detail="Only captain can purchase perks")
        elif "already purchased" in str(e).lower():
            raise HTTPException(status_code=400, detail="Perk already purchased")
        elif "insufficient" in str(e).lower():
            raise HTTPException(status_code=400, detail="Insufficient points")
        else:
            raise HTTPException(status_code=500, detail="Failed to purchase perk")

@router.post("/actions", response_model=ActionResponse)
async def perform_action(
    action_data: ActionCreate,
    current_user: dict = Depends(require_verified)
):
    # Perform action using Convex mutation
    try:
        result = convex_mutation("performAction", {
            "actionType": action_data.action_type,
            "targetTeamId": action_data.target_team_id,
            "investmentAmount": action_data.investment_amount,
            "userId": current_user["id"]
        })
        return result
    except Exception as e:
        if "only captain" in str(e).lower():
            raise HTTPException(status_code=403, detail="Only captain can perform actions")
        elif "target team required" in str(e).lower():
            raise HTTPException(status_code=400, detail="Target team required for attack")
        elif "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Target team not found")
        elif "immunity" in str(e).lower():
            raise HTTPException(status_code=400, detail="Target team has immunity")
        elif "shield" in str(e).lower():
            raise HTTPException(status_code=400, detail="Target team has active shield")
        elif "insufficient" in str(e).lower():
            raise HTTPException(status_code=400, detail="Insufficient points")
        elif "investment amount required" in str(e).lower():
            raise HTTPException(status_code=400, detail="Investment amount required")
        elif "invalid action type" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid action type")
        else:
            raise HTTPException(status_code=500, detail="Failed to perform action")

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    current_user: dict = Depends(require_verified)
):
    leaderboard = convex_query("getLeaderboard", {})
    return leaderboard

@router.post("/rooms/{room_id}/unlock", response_model=dict)
async def unlock_room(
    room_id: str,
    current_user: dict = Depends(require_verified)
):
    # Unlock room using Convex mutation
    try:
        result = convex_mutation("unlockRoom", {
            "roomId": room_id,
            "userId": current_user["id"]
        })
        return result
    except Exception as e:
        if "only captain" in str(e).lower():
            raise HTTPException(status_code=403, detail="Only captain can unlock rooms")
        elif "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Room not found")
        elif "must unlock" in str(e).lower():
            raise HTTPException(status_code=400, detail="Must unlock rooms in order")
        elif "insufficient" in str(e).lower():
            raise HTTPException(status_code=400, detail="Insufficient points")
        else:
            raise HTTPException(status_code=500, detail="Failed to unlock room")

@router.delete("/teams/{team_id}", response_model=dict)
def delete_team_admin(
    team_id: str,
    admin: dict = Depends(require_verified)
):
    # Delete team as admin using Convex mutation
    try:
        result = convex_mutation("deleteTeamAdmin", {
            "teamId": team_id,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Team not found")
        elif "admin required" in str(e).lower():
            raise HTTPException(status_code=403, detail="Admin access required")
        else:
            raise HTTPException(status_code=500, detail="Failed to delete team")
