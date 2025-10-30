from fastapi import APIRouter, Depends, HTTPException
from typing import List
import json

from schemas import (
    RoomCreate, PuzzleCreate, ClueCreate, TeamOverride,
    RoomResponse, PuzzleResponse
)
from auth import require_admin, hash_flag
from services.convex_client import convex_query, convex_mutation

router = APIRouter()

@router.post("/rooms", response_model=RoomResponse)
def create_room(
    room_data: RoomCreate,
    admin: dict = Depends(require_admin)
):
    # Create room using Convex mutation
    try:
        result = convex_mutation("createRoom", {
            "name": room_data.name,
            "orderIndex": room_data.order_index,
            "description": room_data.description,
            "isChallenge": room_data.is_challenge,
            "unlockCost": room_data.unlock_cost,
            "challengeInvestment": room_data.challenge_investment,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create room")

@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: str,
    room_data: RoomCreate,
    admin: dict = Depends(require_admin)
):
    # Update room using Convex mutation
    try:
        result = convex_mutation("updateRoom", {
            "roomId": room_id,
            "name": room_data.name,
            "orderIndex": room_data.order_index,
            "description": room_data.description,
            "isChallenge": room_data.is_challenge,
            "unlockCost": room_data.unlock_cost,
            "challengeInvestment": room_data.challenge_investment,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Room not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to update room")

@router.delete("/rooms/{room_id}")
def delete_room(
    room_id: str,
    admin: dict = Depends(require_admin)
):
    # Delete room using Convex mutation
    try:
        result = convex_mutation("deleteRoom", {
            "roomId": room_id,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Room not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to delete room")

@router.post("/puzzles", response_model=PuzzleResponse)
def create_puzzle(
    puzzle_data: PuzzleCreate,
    admin: dict = Depends(require_admin)
):
    # Create puzzle using Convex mutation
    try:
        result = convex_mutation("createPuzzle", {
            "roomId": puzzle_data.room_id,
            "title": puzzle_data.title,
            "type": puzzle_data.type,
            "description": puzzle_data.description,
            "flag": puzzle_data.flag,
            "pointsReward": puzzle_data.points_reward,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create puzzle")

@router.put("/puzzles/{puzzle_id}", response_model=PuzzleResponse)
def update_puzzle(
    puzzle_id: str,
    puzzle_data: PuzzleCreate,
    admin: dict = Depends(require_admin)
):
    # Update puzzle using Convex mutation
    try:
        result = convex_mutation("updatePuzzle", {
            "puzzleId": puzzle_id,
            "roomId": puzzle_data.room_id,
            "title": puzzle_data.title,
            "type": puzzle_data.type,
            "description": puzzle_data.description,
            "flag": puzzle_data.flag,
            "pointsReward": puzzle_data.points_reward,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Puzzle not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to update puzzle")

@router.delete("/puzzles/{puzzle_id}")
def delete_puzzle(
    puzzle_id: str,
    admin: dict = Depends(require_admin)
):
    # Delete puzzle using Convex mutation
    try:
        result = convex_mutation("deletePuzzle", {
            "puzzleId": puzzle_id,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Puzzle not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to delete puzzle")

@router.post("/clues", response_model=dict)
def create_clue(
    clue_data: ClueCreate,
    admin: dict = Depends(require_admin)
):
    # Create clue using Convex mutation
    try:
        result = convex_mutation("createClue", {
            "puzzleId": clue_data.puzzle_id,
            "text": clue_data.text,
            "cost": clue_data.cost,
            "orderIndex": clue_data.order_index,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create clue")

@router.post("/teams/override-progress", response_model=dict)
def override_team_progress(
    override_data: TeamOverride,
    admin: dict = Depends(require_admin)
):
    # Override team progress using Convex mutation
    try:
        result = convex_mutation("overrideTeamProgress", {
            "teamId": override_data.team_id,
            "newRoomId": override_data.new_room_id,
            "reason": override_data.reason,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Team or room not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to override team progress")

@router.get("/logs")
def get_logs(
    limit: int = 100,
    admin: dict = Depends(require_admin)
):
    logs = convex_query("getAuditLogs", {"limit": limit})
    return logs

@router.get("/teams")
def get_all_teams(
    admin: dict = Depends(require_admin)
):
    teams = convex_query("getAllTeams", {})
    return teams

@router.post("/teams/{team_id}/refund", response_model=dict)
def refund_points(
    team_id: str,
    amount: float,
    admin: dict = Depends(require_admin)
):
    # Refund points using Convex mutation
    try:
        result = convex_mutation("refundPoints", {
            "teamId": team_id,
            "amount": amount,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Team not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to refund points")

@router.post("/teams/{team_id}/disable", response_model=dict)
def disable_team(
    team_id: str,
    admin: dict = Depends(require_admin)
):
    # Disable team using Convex mutation
    try:
        result = convex_mutation("disableTeam", {
            "teamId": team_id,
            "adminId": admin["id"]
        })
        return result
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Team not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to disable team")

@router.delete("/teams/{team_id}", response_model=dict)
def delete_team_admin(
    team_id: str,
    admin: dict = Depends(require_admin)
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
