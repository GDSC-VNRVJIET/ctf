import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function Leaderboard() {
  const { userId } = useAuth()

  // Real-time queries - automatically refresh!
  const leaderboard = useQuery(api.game.getLeaderboard)
  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : "skip")

  // Mutations
  const performAction = useMutation(api.game.performAction)

  const loading = leaderboard === undefined

  const handleAttack = async (targetTeamId) => {
    if (!userId) {
      alert('You must be logged in')
      return
    }

    if (!confirm('Attack this team? This will cost 50 points.')) return

    try {
      await performAction({
        userId,
        actionType: 'attack',
        targetTeamId
      })
      alert('Attack launched!')
    } catch (error) {
      alert(error?.message || 'Attack failed')
    }
  }

  const handleDefend = async () => {
    if (!userId) {
      alert('You must be logged in')
      return
    }

    if (!confirm('Activate shield? This will cost 30 points.')) return

    try {
      await performAction({
        userId,
        actionType: 'defend'
      })
      alert('Shield activated!')
    } catch (error) {
      alert(error?.message || 'Failed to activate shield')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

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
                <tr key={entry.teamId}>
                  <td><strong>#{index + 1}</strong></td>
                  <td>{entry.teamName}</td>
                  <td><strong>{entry.pointsBalance.toFixed(2)}</strong></td>
                  <td>Room {entry.roomIndex || 0}</td>
                  <td>{entry.pointsBalance.toFixed(2)}</td>
                  <td>
                    {entry.shieldActive && (
                      <span className="badge badge-success">Shield</span>
                    )}
                    {entry.underAttack && (
                      <span className="badge badge-danger" style={{ marginLeft: '4px' }}>
                        Under Attack
                      </span>
                    )}
                  </td>
                  <td>
                    {team && entry.teamId !== team._id && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleAttack(entry.teamId)}
                        disabled={entry.shieldActive}
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
