import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function RoomView() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const [selectedPuzzle, setSelectedPuzzle] = useState(null)

  // Convex queries
  const room = useQuery(api.game.getRoom, { roomId: roomId })
  const userTeams = useQuery(api.teams.getUserTeams, user ? { userId: user.id } : 'skip')

  // Convex mutations
  const submitFlagMutation = useMutation(api.game.submitFlag)

  const team = userTeams?.[0] || null
  const loading = !room || (user && !userTeams)

  useEffect(() => {
    if (room?.puzzles?.length > 0) {
      setSelectedPuzzle(room.puzzles[0])
    }
  }, [room])

  const handleUnlockRoom = async () => {
    // TODO: Implement room unlock mutation in Convex
    alert('Room unlock not yet implemented in Convex migration')
  }

  if (loading) return <div className="loading">Loading...</div>
  if (!room) return <div>Room not found</div>

  const canAccess = !team?.current_room_id || team.current_room_id === roomId

  return (
    <div>
      <div className="container">
        <div className="card">
          <h1>{room.name}</h1>
          <p style={{ color: '#666', marginTop: '8px' }}>{room.description}</p>

          {!canAccess && (
            <div style={{ marginTop: '16px' }}>
              <p>You need to unlock this room first.</p>
              <button className="btn btn-primary" onClick={handleUnlockRoom}>
                Unlock Room ({room.unlock_cost} points)
              </button>
            </div>
          )}
        </div>

        {canAccess && (
          <>
            <div className="grid grid-2">
              <div className="card">
                <h2>Puzzles</h2>
                <div style={{ marginTop: '16px' }}>
                  {room.puzzles?.map((puzzle) => (
                    <div
                      key={puzzle.id}
                      className="card"
                      style={{
                        background: selectedPuzzle?.id === puzzle.id ? '#e7f3ff' : '#f8f9fa',
                        cursor: 'pointer',
                        marginBottom: '8px'
                      }}
                      onClick={() => setSelectedPuzzle(puzzle)}
                    >
                      <h3>{puzzle.title}</h3>
                      <span className="badge badge-success">{puzzle.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPuzzle && (
                <PuzzleView puzzle={selectedPuzzle} team={team} user={user} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PuzzleView({ puzzle, team, user }) {
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Convex mutations
  const submitFlagMutation = useMutation(api.game.submitFlag)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const result = await submitFlagMutation({
        teamId: team.id,
        puzzleId: puzzle.id,
        userId: user.id,
        flagHash: flag // You'll need to hash the flag on the frontend or backend
      })

      if (result.correct) {
        setMessage('Correct! Points awarded.')
      } else {
        setMessage('Incorrect flag. Try again.')
      }
      setFlag('')
    } catch (error) {
      setMessage(error.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyClue = async (clueId) => {
    // TODO: Implement clue purchase mutation in Convex
    alert('Clue purchase not yet implemented in Convex migration')
  }

  return (
    <div className="card">
      <h2>{puzzle.title}</h2>
      <p style={{ margin: '16px 0', whiteSpace: 'pre-wrap' }}>{puzzle.description}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Submit Flag</label>
          <input
            type="text"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="flag{...}"
            required
          />
        </div>
        {message && (
          <div className={message.includes('Correct') ? 'success' : 'error'}>
            {message}
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Flag'}
        </button>
      </form>

      {puzzle.clues?.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3>Clues</h3>
          {puzzle.clues.map((clue) => (
            <div key={clue.id} className="card" style={{ background: '#f8f9fa', marginTop: '8px' }}>
              <p style={{ color: '#666' }}>Clue available for {clue.cost} points</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '8px' }}
                onClick={() => handleBuyClue(clue.id)}
              >
                Buy Clue
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
