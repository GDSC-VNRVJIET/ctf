import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

export default function RoomView() {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const [team, setTeam] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPuzzle, setSelectedPuzzle] = useState(null)

  useEffect(() => {
    fetchData()
  }, [roomId])

  const fetchData = async () => {
    try {
      const [roomRes, teamRes] = await Promise.all([
        axios.get(`/api/rooms/${roomId}`),
        axios.get('/api/teams/my/team')
      ])
      setRoom(roomRes.data)
      setTeam(teamRes.data)
      if (roomRes.data.puzzles?.length > 0) {
        setSelectedPuzzle(roomRes.data.puzzles[0])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockRoom = async () => {
    try {
      await axios.post(`/api/rooms/${roomId}/unlock`)
      alert('Room unlocked!')
      fetchData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to unlock room')
    }
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
                      <span className="badge badge-success">{puzzle.points_reward} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPuzzle && (
                <PuzzleView puzzle={selectedPuzzle} team={team} onSuccess={fetchData} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PuzzleView({ puzzle, team, onSuccess }) {
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [purchasedClues, setPurchasedClues] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const response = await axios.post(`/api/puzzles/${puzzle.id}/submit`, { flag })
      setMessage(response.data.message)
      if (response.data.points_awarded > 0) {
        onSuccess()
      }
      setFlag('')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyClue = async (clueId) => {
    try {
      const response = await axios.post(`/api/clues/${clueId}/buy`)
      alert(response.data.message)
      setPurchasedClues([...purchasedClues, clueId])
      onSuccess()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to buy clue')
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
            const isPurchased = purchasedClues.includes(clue.id)
            return (
              <div key={clue.id} className="card" style={{ background: '#f8f9fa', marginTop: '8px' }}>
                {isPurchased ? (
                  <p>{clue.text}</p>
                ) : (
                  <>
                    <p style={{ color: '#666' }}>Clue available for {clue.cost} points</p>
                    <button
                      className="btn btn-secondary"
                      style={{ marginTop: '8px' }}
                      onClick={() => handleBuyClue(clue.id)}
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
