from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="player")  # player, team_captain, admin, organiser
    is_verified = Column(Boolean, default=False)
    otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    team_memberships = relationship("TeamMember", back_populates="user")

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    captain_user_id = Column(String, ForeignKey("users.id"))
    capacity = Column(Integer, default=4)
    points_balance = Column(Float, default=1000.0)
    current_room_id = Column(String, ForeignKey("rooms.id"), nullable=True)
    shield_active = Column(Boolean, default=False)
    shield_expiry = Column(DateTime, nullable=True)
    invite_code = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    immunity_until = Column(DateTime, nullable=True)
    
    members = relationship("TeamMember", back_populates="team")
    purchases = relationship("Purchase", back_populates="team")
    actions = relationship("Action", foreign_keys="Action.team_id", back_populates="team")
    submissions = relationship("Submission", back_populates="team")

class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"))
    user_id = Column(String, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)
    role = Column(String, default="member")  # captain, member
    
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    is_challenge = Column(Boolean, default=False)
    unlock_cost = Column(Float, default=0)
    challenge_investment = Column(Float, nullable=True)
    challenge_reward_multiplier = Column(Float, default=2.0)
    
    puzzles = relationship("Puzzle", back_populates="room")

class Puzzle(Base):
    __tablename__ = "puzzles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    room_id = Column(String, ForeignKey("rooms.id"))
    title = Column(String, nullable=False)
    type = Column(String, default="static_flag")  # static_flag, interactive, question
    description = Column(Text)
    flag_hash = Column(String, nullable=False)
    points_reward = Column(Float, default=100.0)
    is_active = Column(Boolean, default=True)
    
    room = relationship("Room", back_populates="puzzles")
    clues = relationship("Clue", back_populates="puzzle")
    submissions = relationship("Submission", back_populates="puzzle")

class Clue(Base):
    __tablename__ = "clues"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    puzzle_id = Column(String, ForeignKey("puzzles.id"))
    text = Column(Text, nullable=False)
    cost = Column(Float, nullable=False)
    is_one_time = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    
    puzzle = relationship("Puzzle", back_populates="clues")

class Perk(Base):
    __tablename__ = "perks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)
    cost = Column(Float, nullable=False)
    effect_json = Column(Text)  # JSON string with effect details
    is_one_time = Column(Boolean, default=True)
    perk_type = Column(String, default="tool")  # tool, defense, attack
    
    purchases = relationship("Purchase", back_populates="perk")

class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"))
    perk_id = Column(String, ForeignKey("perks.id"), nullable=True)
    clue_id = Column(String, ForeignKey("clues.id"), nullable=True)
    purchased_at = Column(DateTime, default=datetime.utcnow)
    used_at = Column(DateTime, nullable=True)
    purchase_metadata = Column(Text, nullable=True)
    
    team = relationship("Team", back_populates="purchases")
    perk = relationship("Perk", back_populates="purchases")

class Action(Base):
    __tablename__ = "actions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"))
    action_type = Column(String, nullable=False)  # attack, defend, invest
    target_team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    cost = Column(Float, nullable=False)
    result_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    ends_at = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active, expired, blocked
    
    team = relationship("Team", foreign_keys=[team_id], back_populates="actions")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"))
    puzzle_id = Column(String, ForeignKey("puzzles.id"))
    submitted_flag = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    submission_time = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)
    
    team = relationship("Team", back_populates="submissions")
    puzzle = relationship("Puzzle", back_populates="submissions")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LeaderboardSnapshot(Base):
    __tablename__ = "leaderboard_snapshots"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"))
    score = Column(Float, nullable=False)
    room_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
