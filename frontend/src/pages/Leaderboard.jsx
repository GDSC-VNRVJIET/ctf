import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function Leaderboard() {
  const { user } = useAuth()

  // Convex queries
  const leaderboard = useQuery(api.game.getLeaderboard)
  const userTeams = useQuery(api.teams.getUserTeams, user ? { userId: user.id } : 'skip')

  // Convex mutations
  const performActionMutation = useMutation(api.game.performAction)

  const team = userTeams?.[0] || null
  const loading = !leaderboard || (user && !userTeams)

  const handleAttack = async (targetTeamId) => {
    if (!confirm('Attack this team? This will cost 50 points.')) return

    try {
      await performActionMutation({
        teamId: team.id,
        actionType: 'attack',
        targetTeamId: targetTeamId,
        duration: 300 // 5 minutes
      })
      alert('Attack launched!')
    } catch (error) {
      alert(error.message || 'Attack failed')
    }
  }

  const handleDefend = async () => {
    if (!confirm('Activate shield? This will cost 30 points.')) return

    try {
      await performActionMutation({
        teamId: team.id,
        actionType: 'defend',
        duration: 600 // 10 minutes
      })
      alert('Shield activated!')
    } catch (error) {
      alert(error.message || 'Failed to activate shield')
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
