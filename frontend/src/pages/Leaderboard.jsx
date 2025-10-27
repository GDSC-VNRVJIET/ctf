import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
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
      console.error('Failed to fetch data:', error)
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

  if (loading) return <div className="loading">Loading...</div>

  const isCaptain = team?.captain_user_id

  return (
    <div>
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Full Leaderboard</h1>
            {team && (
              <button className="btn btn-success" onClick={handleDefend}>
                Activate Shield (30 pts)
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Score</th>
                <th>Room</th>
                <th>Points</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={entry.team_id}>
                  <td><strong>#{index + 1}</strong></td>
                  <td>{entry.team_name}</td>
                  <td><strong>{entry.points_balance.toFixed(2)}</strong></td>
                  <td>Room {entry.room_index || 0}</td>
                  <td>{entry.points_balance.toFixed(2)}</td>
                  <td>
                    {entry.shield_active && (
                      <span className="badge badge-success">Shield</span>
                    )}
                    {entry.under_attack && (
                      <span className="badge badge-danger" style={{ marginLeft: '4px' }}>
                        Under Attack
                      </span>
                    )}
                  </td>
                  <td>
                    {team && entry.team_id !== team.id && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleAttack(entry.team_id)}
                        disabled={entry.shield_active}
                      >
                        Attack
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
