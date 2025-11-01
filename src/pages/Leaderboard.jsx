import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import toast from 'react-hot-toast'
import { api } from '../../convex/_generated/api'

export default function Leaderboard() {
  const { userId } = useAuth()

  const leaderboard = useQuery(api.game.getLeaderboard)
  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : "skip")

  // Mutations
  const performAction = useMutation(api.game.performAction)

  const loading = leaderboard === undefined

  const handleAttack = async (targetTeamId) => {
    if (!userId) {
      toast.error('You must be logged in')
      return
    }

    if (!confirm('Attack this team? This will cost 50 points.')) return

    try {
      await performAction({
        userId,
        actionType: 'attack',
        targetTeamId
      })
      toast.success('Attack launched!')
    } catch (error) {
      const errorMessage = error?.data || error?.message || 'Attack failed'
      toast.error(errorMessage)
    }
  }

  const handleDefend = async () => {
    if (!userId) {
      toast.error('You must be logged in')
      return
    }

    if (!confirm('Activate shield? This will cost 30 points.')) return

    try {
      await performAction({
        userId,
        actionType: 'defend'
      })
      toast.success('Shield activated!')
    } catch (error) {
      const errorMessage = error?.data || error?.message || 'Failed to activate shield'
      toast.error(errorMessage)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ marginRight: '32px' }}>Full Leaderboard</h1>
            {team && (
              <button className="btn btn-success" onClick={handleDefend} style={{ marginLeft: '32px', padding: '8px 20px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ marginRight: '10px' }}>Shield</span>
                <span style={{ marginLeft: '10px' }}>(30 pts)</span>
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
