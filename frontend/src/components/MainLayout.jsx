import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import Navbar from './Navbar'

function LeaderboardSidebar() {
  const { user } = useAuth()

  // Convex queries
  const leaderboard = useQuery(api.game.getLeaderboard)
  const userTeams = useQuery(api.teams.getUserTeams, user ? { userId: user.id } : 'skip')

  // Convex mutations
  const performActionMutation = useMutation(api.game.performAction)

  const team = userTeams?.[0] || null
  const loading = !leaderboard || (user && !userTeams)

  const handleAttack = async (targetTeamId) => {
    if (!confirm('Attack this team? This will cost 100 points.')) return
    if (!team) return

    try {
      await performActionMutation({
        teamId: team.id,
        actionType: 'attack',
        targetTeamId: targetTeamId
      })
      alert('Attack launched!')
    } catch (error) {
      alert(error.message || 'Attack failed')
    }
  }

  const handleDefend = async () => {
    if (!confirm('Activate shield? This will cost 100 points.')) return
    if (!team) return

    try {
      await performActionMutation({
        teamId: team.id,
        actionType: 'defend',
        duration: 3600 // 1 hour
      })
      alert('Shield activated!')
    } catch (error) {
      alert(error.message || 'Failed to activate shield')
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