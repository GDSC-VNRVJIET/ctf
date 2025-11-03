import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import toast from 'react-hot-toast'
import { api } from '../../convex/_generated/api'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const { user, userId } = useAuth()
  const navigate = useNavigate()
  const [shieldTimeRemaining, setShieldTimeRemaining] = useState('')

  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : "skip")
  const rooms = useQuery(api.game.getRooms, userId ? { userId } : "skip")
  console.log(team, rooms)

  const leaveTeam = useMutation(api.teams.leaveTeam)

  const loading = team === undefined || rooms === undefined

  // Shield timer effect
  useEffect(() => {
    if (!team?.shieldActive || !team?.shieldExpiry) {
      setShieldTimeRemaining('')
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const remaining = team.shieldExpiry - now
      
      if (remaining <= 0) {
        setShieldTimeRemaining('Expired')
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setShieldTimeRemaining(`${minutes}m ${seconds.toString().padStart(2, '0')}s`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [team?.shieldActive, team?.shieldExpiry])

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return

    try {
      await leaveTeam({ userId })
      toast.success('Left team successfully!')
      window.location.reload()
    } catch (error) {
      toast.error(error?.message || 'Failed to leave team')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  // Determine current room index (start at 0 if not started)
  const currentRoomIndex = rooms && team?.currentRoomId 
    ? rooms.findIndex(r => r._id === team.currentRoomId) 
    : -1

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
              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', alignItems: 'center' }}>
                <div>
                  <strong>Points:</strong> {team.pointsBalance.toFixed(2)}
                </div>
                <div>
                  <strong>Current Room:</strong> {team.currentRoomId ? 'In Progress' : 'Not Started (Room 1 Available)'}
                </div>
                {team.shieldActive && shieldTimeRemaining && (
                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '2px solid #0ff',
                    borderRadius: '8px',
                    color: '#0ff',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🛡️ Shield: {shieldTimeRemaining}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '16px' }}>
                <Link to="/team" className="btn btn-secondary" style={{ marginRight: '8px' }}>
                  Team Details
                </Link>
                <Link to="/shop" className="btn btn-primary" style={{ marginRight: '8px' }}>
                  Shop
                </Link>
                {team.captainUserId !== user.id && (
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
              <h2>Mission Rooms</h2>
              <div style={{ marginTop: '24px' }}>
                {rooms.map((room, index) => {
                  // Room 0 is always unlocked at start; others depend on progression
                  const isUnlocked = index === 0 || currentRoomIndex >= index;
                  const isNext = index === currentRoomIndex + 1 || (currentRoomIndex === -1 && index === 1);
                  const isAccessible = isUnlocked; // Only unlocked rooms are clickable
                  console.log(room, isUnlocked, isNext, isAccessible);
                  
                  return (
                    <div
                      key={room._id}
                      style={{
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                      }}
                    >
                      {/* Room Icon/Number */}
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '32px',
                          fontWeight: 'bold',
                          backgroundColor: isUnlocked ? '#0ff' : isNext ? '#ff00ff' : '#333',
                          color: isUnlocked ? '#000' : isNext ? '#000' : '#666',
                          border: `3px solid ${isUnlocked ? '#0ff' : isNext ? '#ff00ff' : '#666'}`,
                          textShadow: isUnlocked || isNext ? '0 0 10px rgba(0,255,255,0.5)' : 'none'
                        }}
                      >
                        {index + 1}
                      </div>

                      {/* Room Info */}
                      <div
                        style={{
                          flex: 1,
                          cursor:'pointer',
                          opacity: 1
                        }}
                        onClick={() => navigate(`/room/${room._id}`)}
                      >
                        <div
                          style={{
                            padding: '16px',
                            borderLeft: '4px solid #0ff',
                            background: 'rgba(0,255,255,0.05)'
                          }}
                        >
                          <>
                            <h3 style={{ margin: '0 0 8px 0', color: '#0ff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>
                              ✓ {room.name}
                            </h3>
                            <p style={{ margin: '4px 0', color: '#fff' }}>
                              {room.description}
                            </p>
                          </>
                          {/* {isUnlocked ? (
                            <>
                              <h3 style={{ margin: '0 0 8px 0', color: '#0ff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>
                                ✓ {room.name}
                              </h3>
                              <p style={{ margin: '4px 0', color: '#fff' }}>
                                {room.description}
                              </p>
                            </>
                          ) : isNext ? (
                            <>
                              <h3 style={{ margin: '0 0 8px 0', color: '#ff00ff', textShadow: '0 0 10px rgba(255,0,255,0.5)' }}>
                                → {room.name}
                              </h3>
                              <div style={{ margin: '4px 0' }}>
                                {team.pointsBalance >= room.unlockCost ? (
                                  <div style={{ 
                                    padding: '8px', 
                                    backgroundColor: 'rgba(46, 204, 113, 0.2)', 
                                    border: '1px solid #2ecc71',
                                    borderRadius: '4px',
                                    marginBottom: '8px'
                                  }}>
                                    <p style={{ color: '#2ecc71', margin: 0 }}>
                                      🎉 Ready to unlock! ({team.pointsBalance}/{room.unlockCost} points)
                                    </p>
                                  </div>
                                ) : (
                                  <div style={{ 
                                    padding: '8px', 
                                    backgroundColor: 'rgba(231, 76, 60, 0.1)', 
                                    border: '1px solid #e74c3c',
                                    borderRadius: '4px',
                                    marginBottom: '8px'
                                  }}>
                                    <p style={{ color: '#e74c3c', margin: 0 }}>
                                      Need {(room.unlockCost - team.pointsBalance).toFixed(0)} more points ({team.pointsBalance}/{room.unlockCost} points)
                                    </p>
                                  </div>
                                )}
                                <p style={{ color: '#aaa' }}>
                                  Unlock Cost: <span style={{ color: '#ffff00', fontWeight: 'bold' }}>{room.unlockCost} pts</span>
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 style={{ margin: '0 0 8px 0', color: '#888' }}>
                                ??? MYSTERY ROOM ???
                              </h3>
                              <p style={{ margin: '4px 0', color: '#666' }}>
                                Explore other rooms first...
                              </p>
                            </>
                          )} */}
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          backgroundColor: isUnlocked ? 'rgba(0,255,0,0.2)' : isNext ? 'rgba(255,0,255,0.2)' : 'rgba(100,100,100,0.2)',
                          border: `2px solid ${isUnlocked ? '#0f0' : isNext ? '#f0f' : '#666'}`,
                          color: isUnlocked ? '#0f0' : isNext ? '#f0f' : '#666',
                          animation: isNext && team.pointsBalance >= room.unlockCost ? 'pulse 2s infinite' : 'none'
                        }}
                      >
                        {isUnlocked ? '✓' : isNext && team.pointsBalance >= room.unlockCost ? '✨' : isNext ? '→' : '?'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
