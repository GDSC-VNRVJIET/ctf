from typing import Dict, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.team_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
    
    async def connect_team(self, websocket: WebSocket, team_id: str):
        if team_id not in self.team_connections:
            self.team_connections[team_id] = []
        self.team_connections[team_id].append(websocket)
    
    def disconnect_team(self, websocket: WebSocket, team_id: str):
        if team_id in self.team_connections:
            self.team_connections[team_id].remove(websocket)
            if not self.team_connections[team_id]:
                del self.team_connections[team_id]
    
    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                await connection.send_json(message)
    
    async def broadcast(self, message: dict):
        for connections in self.active_connections.values():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_team(self, team_id: str, message: dict):
        if team_id in self.team_connections:
            for connection in self.team_connections[team_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_leaderboard(self, db: Session):
        from models import Team, Submission, Room, Action
        from datetime import datetime
        
        teams = db.query(Team).all()
        leaderboard = []
        
        for team in teams:
            solved_puzzles = db.query(Submission).filter(
                Submission.team_id == team.id,
                Submission.is_correct == True
            ).count()
            
            room_index = 0
            if team.current_room_id:
                room = db.query(Room).filter(Room.id == team.current_room_id).first()
                if room:
                    room_index = room.order_index
            
            under_attack = db.query(Action).filter(
                Action.target_team_id == team.id,
                Action.action_type == "attack",
                Action.status == "active",
                Action.ends_at > datetime.utcnow()
            ).first() is not None
            
            score = team.points_balance + (solved_puzzles * 100) + (room_index * 500)
            
            leaderboard.append({
                "team_id": team.id,
                "team_name": team.name,
                "score": score,
                "room_index": room_index,
                "points_balance": team.points_balance,
                "shield_active": team.shield_active and team.shield_expiry > datetime.utcnow() if team.shield_expiry else False,
                "under_attack": under_attack
            })
        
        leaderboard.sort(key=lambda x: x["points_balance"], reverse=True)
        
        await self.broadcast({
            "type": "leaderboard_update",
            "data": leaderboard
        })

manager = ConnectionManager()
