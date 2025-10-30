import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'

export default function RoomView() {
  const { roomId } = useParams()
  const { userId } = useAuth()
  const [selectedPuzzle, setSelectedPuzzle] = useState(null)

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
                Unlock Room ({room.unlockCost} points)
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
                      key={puzzle._id}
                      className="card"
                      style={{
                        background: selectedPuzzle?._id === puzzle._id ? '#e7f3ff' : '#f8f9fa',
                        cursor: 'pointer',
                        marginBottom: '8px'
                      }}
                      onClick={() => setSelectedPuzzle(puzzle)}
                    >
                      <h3>{puzzle.title}</h3>
                      <span className="badge badge-success">{puzzle.pointsReward} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPuzzle && (
                <PuzzleView puzzle={selectedPuzzle} userId={userId} />
              )}
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
          {puzzle.clues.map((clue) => {
            const isPurchased = purchasedClues.includes(clue._id)
            return (
              <div key={clue._id} className="card" style={{ background: '#f8f9fa', marginTop: '8px' }}>
                {isPurchased ? (
                  <p>{clue.text}</p>
                ) : (
                  <>
                    <p style={{ color: '#666' }}>Clue available for {clue.cost} points</p>
                    <button
                      className="btn btn-secondary"
                      style={{ marginTop: '8px' }}
                      onClick={() => handleBuyClue(clue._id)}
                    >
                      Buy Clue
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
