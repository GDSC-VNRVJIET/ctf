import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [teamRes, roomsRes] = await Promise.all([
        axios.get('/api/teams/my/team').catch(() => ({ data: null })),
        axios.get('/api/rooms')
      ])
      setTeam(teamRes.data)
      setRooms(roomsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <Navbar />
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
                <Link to="/leaderboard" className="btn btn-primary">
                  Leaderboard
                </Link>
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
