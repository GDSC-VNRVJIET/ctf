import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Rules() {
  const navigate = useNavigate()
  const { userId } = useAuth()

  const handleContinue = () => {
    navigate('/dashboard')
  }

  return (
    <div className="rules-container">
      <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1>CTF Rules & Guidelines</h1>

        <div className="rules-content" style={{ marginTop: '24px' }}>
          <h2>🎯 Welcome to the Room-Style CTF</h2>
          <p style={{ marginBottom: '16px' }}>
            A hybrid of cybersecurity gameplay and strategy. This event is about teamwork, decision-making, and skill — every move counts.
          </p>

          <h2>📋 Key Concepts & Rules</h2>
          <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
            <li><strong>Rooms:</strong> 5 sequential rooms (Room 1 → Room 5). Each team must clear their current room to unlock the next one.</li>
            <li><strong>Teams:</strong> Groups of 3 to 5 members. Team members make purchases and decide strategic actions (Attack, Defend, Invest).</li>
            <li><strong>Starting Points:</strong> Each team begins with 100 points.</li>
            <li><strong>Points as Currency:</strong> Use points to buy hints, perks, and tools or perform strategic actions.</li>
            <li><strong>Perks & Tools:</strong> One-time use or limited-time items that help in attacks, defenses, or solving challenges.</li>
            <li><strong>Clues / Hints:</strong> Each room has hints that can be bought using points (costs vary by difficulty).</li>
            <li><strong>No Flag Sharing:</strong> Sharing flags between teams is strictly prohibited and monitored.</li>
            <li><strong>Organizers:</strong> Admins monitor rooms, actions, and progress; they can push updates or emergency messages.</li>
          </ul>

          <h2>� Room & Challenge Structure</h2>
          <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
            <li><strong>Challenge Questions (High Difficulty):</strong> Each room has a Challenge Question that can be attempted only once by spending points. Solving it yields 2X points (double the investment). If not solved, you gain 0 points.</li>
            <li><strong>Room Questions:</strong> Rooms 3 and 4 include a Room Question that, when solved, allows your team to directly move to the next room without gaining or losing any points.</li>
            <li><strong>Flag Format:</strong> Flags are case-sensitive. Example: GDGC{'{'}r00m_strat3gy_unl0cked{'}'}</li>
          </ul>

          <h2>⚔️ Attack & Defense Rules</h2>
          <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
            <li>Each team can attack only 3 times during the entire CTF.</li>
            <li>When a team is attacked:
              <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                <li>They cannot submit any flag for the next 5 minutes.</li>
                <li>They automatically receive 10 minutes of immunity after being attacked (during which they can't be attacked again).</li>
              </ul>
            </li>
          </ul>

          <h2>🏆 Scoring & Leaderboard</h2>
          <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
            <li><strong>Real-Time Leaderboard:</strong> Displays rankings based on number of rooms cleared and time.</li>
            <li><strong>Same Room Ranking:</strong> If in the same room, ranking will be based on the total score of that team.</li>
            <li><strong>Attack Option:</strong> An "Attack" button beside each team enables strategic sabotage.</li>
            <li><strong>Score Components:</strong> Points from solved challenges and investments, successful attacks and defenses, and unspent points.</li>
          </ul>

          <h2>📜 Summary</h2>
          <p style={{ marginBottom: '16px' }}>
            This is a strategic cybersecurity competition where your team's decision-making, resource management, and technical skills all matter. 
            Work together, manage your points wisely, and think strategically about when to attack or defend. Good luck!
          </p>
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            Start the Heist! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}