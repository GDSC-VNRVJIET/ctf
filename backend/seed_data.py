"""
Seed script to populate the database with initial data
Run this after starting the server for the first time
"""
from database import SessionLocal, engine, Base
from models import Room, Puzzle, Clue, Perk, User
from auth import get_password_hash, hash_flag

def seed_database():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create admin user
        admin = User(
            email="admin@ctf.com",
            password_hash=get_password_hash("admin123"),
            name="Admin User",
            role="admin",
            is_verified=True
        )
        db.add(admin)
        
        # Create 5 rooms
        rooms_data = [
            {
                "name": "Room 1: Welcome",
                "order_index": 1,
                "description": "Welcome to the CTF! Start your journey here.",
                "unlock_cost": 0,
                "is_challenge": False
            },
            {
                "name": "Room 2: Cryptography",
                "order_index": 2,
                "description": "Decode the secrets hidden in encrypted messages.",
                "unlock_cost": 100,
                "is_challenge": False
            },
            {
                "name": "Room 3: Web Exploitation",
                "order_index": 3,
                "description": "Find vulnerabilities in web applications.",
                "unlock_cost": 200,
                "is_challenge": False
            },
            {
                "name": "Room 4: Reverse Engineering",
                "order_index": 4,
                "description": "Analyze and understand compiled code.",
                "unlock_cost": 300,
                "is_challenge": False
            },
            {
                "name": "Room 5: Final Challenge",
                "order_index": 5,
                "description": "The ultimate test of your skills!",
                "unlock_cost": 500,
                "is_challenge": True,
                "challenge_investment": 200,
                "challenge_reward_multiplier": 2.0
            }
        ]
        
        rooms = []
        for room_data in rooms_data:
            room = Room(**room_data)
            db.add(room)
            rooms.append(room)
        
        db.flush()  # Get IDs for rooms
        
        # Create puzzles for each room
        puzzles_data = [
            # Room 1 puzzles
            {
                "room_id": rooms[0].id,
                "title": "Basic Flag",
                "description": "Welcome! Your first flag is: flag{welcome_to_ctf}",
                "flag": "flag{welcome_to_ctf}",
                "points_reward": 50
            },
            {
                "room_id": rooms[0].id,
                "title": "Simple Math",
                "description": "What is 2 + 2? Submit as flag{answer}",
                "flag": "flag{4}",
                "points_reward": 50
            },
            # Room 2 puzzles
            {
                "room_id": rooms[1].id,
                "title": "Caesar Cipher",
                "description": "Decode this: synt{plcgb_vf_sha}\nHint: ROT13",
                "flag": "flag{crypto_is_fun}",
                "points_reward": 100
            },
            {
                "room_id": rooms[1].id,
                "title": "Base64",
                "description": "Decode: ZmxhZ3tiYXNlNjRfZGVjb2RlZH0=",
                "flag": "flag{base64_decoded}",
                "points_reward": 100
            },
            # Room 3 puzzles
            {
                "room_id": rooms[2].id,
                "title": "SQL Injection",
                "description": "Find the flag in the database. Username: admin' OR '1'='1",
                "flag": "flag{sql_injection_master}",
                "points_reward": 150
            },
            {
                "room_id": rooms[2].id,
                "title": "XSS Challenge",
                "description": "Execute JavaScript to reveal the flag.",
                "flag": "flag{xss_detected}",
                "points_reward": 150
            },
            # Room 4 puzzles
            {
                "room_id": rooms[3].id,
                "title": "Binary Analysis",
                "description": "Reverse engineer the binary to find the flag.",
                "flag": "flag{reverse_engineering_pro}",
                "points_reward": 200
            },
            {
                "room_id": rooms[3].id,
                "title": "Assembly Code",
                "description": "Analyze the assembly code and find the hidden flag.",
                "flag": "flag{assembly_decoded}",
                "points_reward": 200
            },
            # Room 5 puzzles
            {
                "room_id": rooms[4].id,
                "title": "Final Boss",
                "description": "Combine all your skills to solve this ultimate challenge!",
                "flag": "flag{ctf_champion_2024}",
                "points_reward": 500
            }
        ]
        
        puzzles = []
        for puzzle_data in puzzles_data:
            flag = puzzle_data.pop("flag")
            puzzle = Puzzle(
                **puzzle_data,
                flag_hash=hash_flag(flag)
            )
            db.add(puzzle)
            puzzles.append(puzzle)
        
        db.flush()  # Get IDs for puzzles
        
        # Create clues
        clues_data = [
            # Room 1 clues
            {"puzzle_id": puzzles[0].id, "text": "The flag is right in front of you!", "cost": 5, "order_index": 0},
            {"puzzle_id": puzzles[1].id, "text": "It's basic arithmetic.", "cost": 5, "order_index": 0},
            
            # Room 2 clues
            {"puzzle_id": puzzles[2].id, "text": "ROT13 is a simple letter substitution cipher.", "cost": 20, "order_index": 0},
            {"puzzle_id": puzzles[2].id, "text": "Try using an online ROT13 decoder.", "cost": 30, "order_index": 1},
            {"puzzle_id": puzzles[3].id, "text": "Base64 is a common encoding scheme.", "cost": 20, "order_index": 0},
            
            # Room 3 clues
            {"puzzle_id": puzzles[4].id, "text": "SQL injection bypasses authentication.", "cost": 40, "order_index": 0},
            {"puzzle_id": puzzles[4].id, "text": "The flag is in the users table.", "cost": 50, "order_index": 1},
            {"puzzle_id": puzzles[5].id, "text": "XSS stands for Cross-Site Scripting.", "cost": 40, "order_index": 0},
            
            # Room 4 clues
            {"puzzle_id": puzzles[6].id, "text": "Use a disassembler like Ghidra or IDA.", "cost": 60, "order_index": 0},
            {"puzzle_id": puzzles[6].id, "text": "Look for string comparisons in the code.", "cost": 80, "order_index": 1},
            {"puzzle_id": puzzles[7].id, "text": "Assembly instructions can be decoded step by step.", "cost": 60, "order_index": 0},
            
            # Room 5 clues
            {"puzzle_id": puzzles[8].id, "text": "This challenge requires all previous techniques.", "cost": 100, "order_index": 0},
            {"puzzle_id": puzzles[8].id, "text": "Start with cryptography, then web exploitation.", "cost": 150, "order_index": 1},
            {"puzzle_id": puzzles[8].id, "text": "The final step involves reverse engineering.", "cost": 200, "order_index": 2}
        ]
        
        for clue_data in clues_data:
            clue = Clue(**clue_data)
            db.add(clue)
        
        # Create perks
        perks_data = [
            {
                "name": "Extra Time",
                "description": "Get 5 extra minutes for puzzle solving",
                "cost": 50,
                "perk_type": "tool",
                "effect_json": '{"type": "time_extension", "duration": 300}',
                "is_one_time": True
            },
            {
                "name": "Hint Reveal",
                "description": "Reveal one random clue for free",
                "cost": 75,
                "perk_type": "tool",
                "effect_json": '{"type": "free_clue"}',
                "is_one_time": True
            },
            {
                "name": "Shield",
                "description": "Protect your team from attacks for 10 minutes",
                "cost": 30,
                "perk_type": "defense",
                "effect_json": '{"type": "shield", "duration": 600}',
                "is_one_time": False
            },
            {
                "name": "Attack Boost",
                "description": "Your next attack lasts 10 minutes instead of 5",
                "cost": 80,
                "perk_type": "attack",
                "effect_json": '{"type": "attack_boost", "multiplier": 2}',
                "is_one_time": True
            },
            {
                "name": "Point Multiplier",
                "description": "Next puzzle solved gives 2x points",
                "cost": 100,
                "perk_type": "tool",
                "effect_json": '{"type": "point_multiplier", "multiplier": 2}',
                "is_one_time": True
            },
            {
                "name": "Trace Blocker",
                "description": "Hide your team from the leaderboard for 5 minutes",
                "cost": 60,
                "perk_type": "defense",
                "effect_json": '{"type": "stealth", "duration": 300}',
                "is_one_time": True
            }
        ]
        
        for perk_data in perks_data:
            perk = Perk(**perk_data)
            db.add(perk)
        
        db.commit()
        print("✅ Database seeded successfully!")
        print("\nAdmin credentials:")
        print("Email: admin@ctf.com")
        print("Password: admin123")
        print("\nCreated:")
        print("- 5 Rooms")
        print("- 9 Puzzles")
        print("- 14 Clues")
        print("- 6 Perks")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
