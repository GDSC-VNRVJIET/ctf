import { useNavigate } from 'react-router-dom'
import { GiTargetArrows } from "react-icons/gi";
import { IoRocketOutline } from "react-icons/io5";
import { LuNotebookPen } from "react-icons/lu";
import { FaQuestionCircle } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import { GiTargetPrize } from "react-icons/gi";
import { useAuth } from '../context/AuthContext';

export default function Rules() {
  const navigate = useNavigate()
  const { userId } = useAuth()

  const handleContinue = () => {
    navigate('/dashboard')
  }

  return (
    <div className="rules-container">
      <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem',  }}>CTF Rules & Guidelines</h1>

        <div className="rules-content">
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <GiTargetArrows style={{ fontSize: "2.5rem" }} /> 
              Welcome to the Room-Style CTF
            </h2>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              A hybrid of cybersecurity gameplay and strategy. This event is about teamwork, decision-making, and skill — every move counts.
            </p>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <LuNotebookPen style={{ fontSize: "2.5rem" }} /> 
              Key Concepts & Rules
            </h2>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Rooms:</strong> 5 sequential rooms (Room 1 → Room 5). Each team must clear their current room to unlock the next one.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Teams:</strong> Groups of 3 to 5 members. Team members make purchases and decide strategic actions (Attack, Defend, Invest).</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Starting Points:</strong> Each team begins with 100 points.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Points as Currency:</strong> Use points to buy hints, perks, and tools or perform strategic actions.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Perks & Tools:</strong> One-time use or limited-time items that help in attacks, defenses, or solving challenges.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Clues / Hints:</strong> Each room has hints that can be bought using points (costs vary by difficulty).</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>No Flag Sharing:</strong> Sharing flags between teams is strictly prohibited and monitored.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Organizers:</strong> Admins monitor rooms, actions, and progress; they can push updates or emergency messages.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <FaQuestionCircle style={{ fontSize: "2.5rem" }} /> 
              Room & Challenge Structure
            </h2>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Challenge Questions (High Difficulty):</strong> Each room has a Challenge Question that can be attempted only once by spending points. Solving it yields 2X points (double the investment). If not solved, you gain 0 points.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Room Questions:</strong> Rooms 3 and 4 include a Room Question that, when solved, allows your team to directly move to the next room without gaining or losing any points.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Flag Format:</strong> Flags are case-sensitive. Example: GDGC{'{'}r00m_strat3gy_unl0cked{'}'}</li>
            </ul>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <GiCrossedSwords style={{ fontSize: "2.5rem" }} /> 
              Attack & Defense Rules
            </h2>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '0.5rem' }}>Each team can attack only 3 times during the entire CTF.</li>
              <li style={{ marginBottom: '0.5rem' }}>
                When a team is attacked:
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>They cannot submit any flag for the next 5 minutes.</li>
                  <li style={{ marginBottom: '0.5rem' }}>They automatically receive 10 minutes of immunity after being attacked (during which they can't be attacked again).</li>
                </ul>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <GiTargetPrize style={{ fontSize: "2.5rem" }} /> 
              Scoring & Leaderboard
            </h2>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Real-Time Leaderboard:</strong> Displays rankings based on number of rooms cleared and time.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Same Room Ranking:</strong> If in the same room, ranking will be based on the total score of that team.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Attack Option:</strong> An "Attack" button beside each team enables strategic sabotage.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Score Components:</strong> Points from solved challenges and investments, successful attacks and defenses, and unspent points.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <LuNotebookPen style={{ fontSize: "2.5rem" }} /> 
              Summary
            </h2>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              This is a strategic cybersecurity competition where your team's decision-making, resource management, and technical skills all matter. 
              Work together, manage your points wisely, and think strategically about when to attack or defend. Good luck!
            </p>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            style={{ 
              padding: '12px 32px', 
              fontSize: '18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Start the Heist! <IoRocketOutline style={{ fontSize: "1.5rem" }} />
          </button>
        </div>
      </div>
    </div>
  )
}