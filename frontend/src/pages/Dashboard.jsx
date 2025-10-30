import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Convex queries
  const userTeams = useQuery(api.teams.getUserTeams, user ? { userId: user.id } : 'skip')
  const rooms = useQuery(api.game.getRooms)

  // Convex mutations
  const leaveTeamMutation = useMutation(api.teams.leaveTeam)

  const team = userTeams?.[0] || null
  const loading = !rooms || (user && !userTeams)

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return

    try {
      await leaveTeamMutation({
        teamId: team.id,
        userId: user.id
      })
      alert('Left team successfully!')
      window.location.reload()
    } catch (error) {
      alert(error.message || 'Failed to leave team')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="container">
        <h1 style={{ color: 'white', marginBottom: '24px' }}>Dashboard</h1>

        {!team ? (
          <div className="card">
            <h2>Welcome, {user.name}!</h2>
            <p style={{ margin: '16px 0' }}>You're not part of a team yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/team')}>
              Create or Join a Team
            </button>
          </div>
        ) : (
          <>
            <div className="card">
              <h2>{team.name}</h2>
              <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
                <div>
                  <strong>Points:</strong> {team.points_balance.toFixed(2)}
                </div>
                <div>
                  <strong>Current Room:</strong> {team.current_room_id ? 'In Progress' : 'Not Started'}
                </div>
                {team.shield_active && (
                  <span className="badge badge-success">Shield Active</span>
                )}
              </div>
              <div style={{ marginTop: '16px' }}>
                <Link to="/team" className="btn btn-secondary" style={{ marginRight: '8px' }}>
                  Team Details
                </Link>
                <Link to="/shop" className="btn btn-primary" style={{ marginRight: '8px' }}>
                  Shop
                </Link>
                <Link to="/leaderboard" className="btn btn-primary" style={{ marginRight: '8px' }}>
                  Leaderboard
                </Link>
                {team.captain_user_id !== user.id && (
                  <button 
                    className="btn btn-warning" 
                    onClick={handleLeaveTeam}
                  >
                    Leave Team
                  </button>
                )}
              </div>
            </div>

            <div className="card">
              <h2>Rooms</h2>
              <div className="grid grid-2" style={{ marginTop: '16px' }}>
                {rooms.map((room) => (
                  <div key={room.id} className="card" style={{ background: '#f8f9fa' }}>
                    <h3>{room.name}</h3>
                    <p style={{ margin: '8px 0', color: '#666' }}>{room.description}</p>
                    <div style={{ marginTop: '12px' }}>
                      <span className="badge badge-info">
                        {room.puzzles?.length || 0} Puzzles
                      </span>
                      {room.unlock_cost > 0 && (
                        <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                          Cost: {room.unlock_cost} pts
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: '12px', width: '100%' }}
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      Enter Room
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
