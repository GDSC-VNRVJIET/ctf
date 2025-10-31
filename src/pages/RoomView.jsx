import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'

export default function RoomView() {
  const { roomId } = useParams()
  const { userId } = useAuth()
  const [selectedPuzzle, setSelectedPuzzle] = useState(null)
  const [showIntro, setShowIntro] = useState(true)

  const room = useQuery(api.game.getRoom, userId && roomId ? { userId, roomId } : "skip")
  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : "skip")

  // Mutation for unlocking room
  const unlockRoom = useMutation(api.game.unlockRoom)

  // Select first puzzle when room loads
  useEffect(() => {
    if (room?.puzzles?.length > 0 && !selectedPuzzle) {
      setSelectedPuzzle(room.puzzles[0])
    }
  }, [room, selectedPuzzle])

  // Room intro stories
  const getRoomIntro = (roomName) => {
    const intros = {
      "Lobby": {
        title: "ENTRY POINT",
        description: "You're outside the massive corporate building. The target is within reach. This is where it all begins.",
        story: "Security cameras sweep the perimeter. Guards patrol the entrance. This is your first obstacle. Use your skills wisely."
      },
      "Server Room": {
        title: "THE DIGITAL VAULT",
        description: "You've breached the outer defenses. Now comes the real challenge - the server room.",
        story: "Racks of servers hum with data. Each one holds secrets worth stealing. But the real treasure lies deeper."
      },
      "CEO Office": {
        title: "THE PRIZE",
        description: "The final target. The CEO's office contains the crown jewels of this heist.",
        story: "Private documents, encrypted drives, classified information. Everything is here. But getting out alive is another matter."
      }
    }
    return intros[roomName] || {
      title: "UNKNOWN TERRITORY",
      description: "You've entered an uncharted part of the target building.",
      story: "Proceed with caution. Every step could be your last."
    }
  }

  const handleUnlockRoom = async () => {
    if (!userId) {
      alert('Please log in first')
      return
    }

    try {
      await unlockRoom({ userId, roomId })
      alert('Room unlocked!')
    } catch (error) {
      alert(error?.message || 'Failed to unlock room')
    }
  }

  const loading = room === undefined || team === undefined
  if (loading) return <div className="loading">Loading...</div>
  if (!room) return <div>Room not found</div>

  const canAccess = !team?.currentRoomId || team.currentRoomId === roomId
  const roomIntro = getRoomIntro(room.name)

  if (showIntro && canAccess) {
    return (
      <div className="modal-overlay" onClick={() => setShowIntro(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{roomIntro.title}</h2>
          </div>
          <div className="modal-content">
            <h3 style={{ color: '#8EFF8B', marginBottom: '16px' }}>{room.name}</h3>
            <p style={{ color: '#B388FF', marginBottom: '16px', lineHeight: '1.6' }}>
              {roomIntro.description}
            </p>
            <p style={{ color: '#00E5FF', marginBottom: '20px', lineHeight: '1.6', fontStyle: 'italic' }}>
              {roomIntro.story}
            </p>
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowIntro(false)}>
                Enter Room
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="room-view">
      <div className="container">
        <div className="card room-header">
          <div className="room-info">
            <h1 className="room-title">{room.name}</h1>
            <p className="room-description">{room.description}</p>
          </div>
          <div className="room-actions">
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowIntro(true)}
              style={{ fontSize: '10px', padding: '8px 16px' }}
            >
              Room Brief
            </button>
          </div>
        </div>

        {!canAccess && (
          <div className="card room-locked">
            <h3>Access Required</h3>
            <p>You need to unlock this room first.</p>
            <button className="btn btn-primary" onClick={handleUnlockRoom}>
              Unlock Room ({room.unlockCost} points)
            </button>
          </div>
        )}

        {canAccess && (
          <>
            <div className="card room-progress">
              <div className="progress-info">
                <span className="progress-label">Room Progress:</span>
                <span className="progress-value">
                  {selectedPuzzle ? (room.puzzles.findIndex(p => p._id === selectedPuzzle._id) + 1) : 0} 
                  / {room.puzzles?.length || 0}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${selectedPuzzle ? ((room.puzzles.findIndex(p => p._id === selectedPuzzle._id) + 1) / (room.puzzles?.length || 1)) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="puzzles-layout">
              <div className="card puzzles-sidebar">
                <h3 className="sidebar-title">Room Questions</h3>
                <div className="puzzles-list">
                  {room.puzzles?.map((puzzle, index) => (
                    <div
                      key={puzzle._id}
                      className={`puzzle-item ${selectedPuzzle?._id === puzzle._id ? 'active' : ''}`}
                      onClick={() => setSelectedPuzzle(puzzle)}
                    >
                      <div className="puzzle-header">
                        <span className="room-question-badge">ROOM QUESTION</span>
                        <span className="puzzle-number">#{index + 1}</span>
                      </div>
                      <h4 className="puzzle-title">{puzzle.title}</h4>
                      <div className="puzzle-meta">
                        <span className="points-reward">{puzzle.pointsReward} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="puzzle-content">
                {selectedPuzzle && (
                  <PuzzleView puzzle={selectedPuzzle} userId={userId} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PuzzleView({ puzzle, userId }) {
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [purchasedClues, setPurchasedClues] = useState([])

  // Mutations
  const submitFlag = useMutation(api.game.submitFlag)
  const buyClue = useMutation(api.game.buyClue)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    if (!userId) {
      setMessage('Please log in first')
      setLoading(false)
      return
    }

    try {
      const result = await submitFlag({ userId, puzzleId: puzzle._id, flag })
      setMessage(result.message)
      setFlag('')
    } catch (error) {
      setMessage(error?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyClue = async (clueId) => {
    if (!userId) {
      alert('Please log in first')
      return
    }

    try {
      const result = await buyClue({ userId, clueId })
      alert(result.message || 'Clue purchased!')
      setPurchasedClues([...purchasedClues, clueId])
    } catch (error) {
      alert(error?.message || 'Failed to buy clue')
    }
  }

  return (
    <div className="card puzzle-view">
      <div className="puzzle-header-section">
        <div className="puzzle-title-section">
          <span className="room-question-badge">ROOM QUESTION</span>
          <h2 className="puzzle-title">{puzzle.title}</h2>
        </div>
        <div className="puzzle-reward">
          <span className="points-display">{puzzle.pointsReward} POINTS</span>
        </div>
      </div>
      
      <div className="puzzle-description">
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{puzzle.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flag-submission">
        <div className="form-group">
          <label className="flag-label">FLAG SUBMISSION</label>
          <input
            type="text"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="Enter flag{...}"
            className="flag-input"
            required
          />
        </div>
        {message && (
          <div className={`submission-result ${message.includes('Correct') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        <button type="submit" className="btn btn-primary flag-submit" disabled={loading}>
          {loading ? 'PROCESSING...' : 'SUBMIT FLAG'}
        </button>
      </form>

      {puzzle.clues?.length > 0 && (
        <div className="clues-section">
          <h3 className="clues-title">AVAILABLE CLUES</h3>
          <div className="clues-list">
            {puzzle.clues.map((clue) => {
              const isPurchased = purchasedClues.includes(clue._id)
              return (
                <div key={clue._id} className={`clue-item ${isPurchased ? 'purchased' : 'available'}`}>
                  {isPurchased ? (
                    <div className="clue-content">
                      <p>{clue.text}</p>
                    </div>
                  ) : (
                    <div className="clue-purchase">
                      <p className="clue-cost">CLUE COST: {clue.cost} POINTS</p>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleBuyClue(clue._id)}
                      >
                        PURCHASE CLUE
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
