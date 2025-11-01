import { useQuery, useMutation } from 'convex/react'
import toast from 'react-hot-toast'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'

function LeaderboardSidebar() {
  const { userId } = useAuth()

  const leaderboard = useQuery(api.game.getLeaderboard)
  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : "skip")

  // Mutations
  const performAction = useMutation(api.game.performAction)

  const handleAttack = async (targetTeamId) => {
    if (!userId) {
      toast.error('Please log in first')
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
      toast.error('Please log in first')
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

  const loading = leaderboard === undefined || team === undefined
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
        {leaderboard && leaderboard.slice(0, 10).map((entry, index) => (
          <div key={entry.teamId} className="leaderboard-item">
            <div className="leaderboard-rank">#{index + 1}</div>
            <div className="leaderboard-info">
              <div className="leaderboard-team">{entry.teamName}</div>
              <div className="leaderboard-score">{entry.pointsBalance.toFixed(0)} pts</div>
              <div className="leaderboard-status">
                {entry.shieldActive && <span className="badge badge-success badge-xs">🛡️</span>}
                {entry.underAttack && <span className="badge badge-danger badge-xs">⚔️</span>}
              </div>
            </div>
            {team && entry.teamId !== team._id && (
              <button
                className="btn btn-danger btn-xs"
                onClick={() => handleAttack(entry.teamId)}
                disabled={entry.shieldActive}
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