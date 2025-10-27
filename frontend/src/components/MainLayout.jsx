import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from './Navbar'

function LeaderboardSidebar() {
  const [leaderboard, setLeaderboard] = useState([])
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [leaderboardRes, teamRes] = await Promise.all([
        axios.get('/api/leaderboard'),
        axios.get('/api/teams/my/team').catch(() => ({ data: null }))
      ])
      setLeaderboard(leaderboardRes.data)
      setTeam(teamRes.data)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttack = async (targetTeamId) => {
    if (!confirm('Attack this team? This will cost 50 points.')) return

    try {
      await axios.post('/api/actions', {
        action_type: 'attack',
        target_team_id: targetTeamId
      })
      alert('Attack launched!')
      fetchData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Attack failed')
    }
  }

  const handleDefend = async () => {
    if (!confirm('Activate shield? This will cost 30 points.')) return

    try {
      await axios.post('/api/actions', {
        action_type: 'defend'
      })
      alert('Shield activated!')
      fetchData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to activate shield')
    }
  }

  if (loading) return <div className="sidebar-loading">Loading...</div>

  return (
    <div className="leaderboard-sidebar">
      <div className="sidebar-header">
        <h3>Leaderboard</h3>
        {team && (
          <button className="btn btn-success btn-sm" onClick={handleDefend}>
            Shield (30 pts)
          </button>
        )}
      </div>

      <div className="leaderboard-list">
        {leaderboard.slice(0, 10).map((entry, index) => (
          <div key={entry.team_id} className="leaderboard-item">
            <div className="leaderboard-rank">#{index + 1}</div>
            <div className="leaderboard-info">
              <div className="leaderboard-team">{entry.team_name}</div>
              <div className="leaderboard-score">{entry.points_balance.toFixed(0)} pts</div>
              <div className="leaderboard-status">
                {entry.shield_active && <span className="badge badge-success badge-xs">🛡️</span>}
                {entry.under_attack && <span className="badge badge-danger badge-xs">⚔️</span>}
              </div>
            </div>
            {team && entry.team_id !== team.id && (
              <button
                className="btn btn-danger btn-xs"
                onClick={() => handleAttack(entry.team_id)}
                disabled={entry.shield_active}
                title="Attack team"
              >
                ⚔️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Navbar />
      <div className="main-content">
        {children}
      </div>
      <div className="sidebar">
        <LeaderboardSidebar />
      </div>
    </div>
  )
}