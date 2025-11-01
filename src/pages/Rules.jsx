import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import toast from 'react-hot-toast'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'

export default function Rules() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [flagInput, setFlagInput] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const team = useQuery(api.teams.getUserTeam, userId ? { userId } : "skip")
  const submitFlag = useMutation(api.game.submitRulesFlag)

  useEffect(() => {
    if (team?.rulesFlagSubmitted) {
      setHasSubmitted(true)
    }
  }, [team])

  const handleFlagSubmit = async (e) => {
    e.preventDefault()
    if (!flagInput.trim()) return

    try {
      const result = await submitFlag({
        teamId: team._id,
        flag: flagInput.trim()
      })

      if (result.success) {
        toast.success(`Correct! +${result.points} points awarded to your team!`)
        setHasSubmitted(true)
      } else {
        toast.error('Incorrect flag. Try again!')
      }
    } catch (error) {
      const errorMessage = error?.message?.split('\n')[0] || 'Failed to submit flag';
      toast.error(errorMessage)
    }
  }

  const handleContinue = () => {
    navigate('/dashboard')
  }

  return (
    <div className="rules-container">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1>CTF Rules & Guidelines</h1>

        <div className="rules-content" style={{ marginTop: '24px' }}>
          <h2>🎯 Objective</h2>
          <p>
            You are the crew hired to rob AURUM Bank. The plan is surgical: gather intel, penetrate the perimeter,
            disable security, breach the vault, then extract and vanish. Each room is one phase of the operation.
          </p>

          <h2>🏦 Room Structure</h2>
          <ul>
            <li><strong>Rooms 1-3:</strong> 10 questions each (9 normal + 1 Room Question)</li>
            <li><strong>Rooms 4-5:</strong> 6 questions each (5 normal + 1 Room Question)</li>
            <li><strong>Room Questions:</strong> Very hard challenges that skip to the next room on solve</li>
          </ul>

          <h2>⚖️ Rules</h2>
          <ul>
            <li>Work in teams of 1-4 players</li>
            <li>Points awarded for solving challenges</li>
            <li>Room questions provide bonus progression</li>
            <li>Follow ethical hacking guidelines</li>
            <li>No sharing solutions between teams</li>
          </ul>

          <h2>🏆 Special Challenge</h2>
          <p>
            There's a hidden flag somewhere in these rules. The first team member to submit it gets <strong>100 bonus points</strong>!
            Only one submission per team counts.
          </p>

          {!hasSubmitted && (
            <form onSubmit={handleFlagSubmit} style={{ marginTop: '24px' }}>
              <div className="form-group">
                <label>Hidden Flag Submission</label>
                <input
                  type="text"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  placeholder="Enter the hidden flag..."
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Submit Flag
              </button>
            </form>
          )}

          {hasSubmitted && (
            <div className="success-message" style={{ marginTop: '24px', padding: '12px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
              ✅ You've already submitted the hidden flag for your team!
            </div>
          )}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            Start the Heist! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}