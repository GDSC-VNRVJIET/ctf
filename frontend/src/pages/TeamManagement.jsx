import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import Navbar from '../components/Navbar'

export default function TeamManagement() {
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      const teamRes = await axios.get('/api/teams/my/team')
      setTeam(teamRes.data)
      const membersRes = await axios.get(`/api/teams/${teamRes.data.id}/members`)
      setMembers(membersRes.data)
    } catch (error) {
      console.log('No team found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1 style={{ color: 'white', marginBottom: '24px' }}>Team Management</h1>

        {!team ? (
          <div className="card">
            <h2>You're not in a team</h2>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Team
              </button>
              <button className="btn btn-secondary" onClick={() => setShowJoinModal(true)}>
                Join Team
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <h2>{team.name}</h2>
              {team.description && <p style={{ color: '#666', marginTop: '8px' }}>{team.description}</p>}
              <div style={{ marginTop: '16px' }}>
                <div><strong>Points Balance:</strong> {team.points_balance.toFixed(2)}</div>
                <div><strong>Capacity:</strong> {members.length}/{team.capacity}</div>
                <div><strong>Invite Code:</strong> <code>{team.invite_code}</code></div>
              </div>
            </div>

            <div className="card">
              <h3>Team Members</h3>
              <table style={{ marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.user.name}</td>
                      <td>{member.user.email}</td>
                      <td>
                        <span className={`badge ${member.role === 'captain' ? 'badge-success' : 'badge-info'}`}>
                          {member.role}
                        </span>
                      </td>
                      <td>{new Date(member.joined_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showCreateModal && <CreateTeamModal onClose={() => setShowCreateModal(false)} onSuccess={fetchTeam} />}
        {showJoinModal && <JoinTeamModal onClose={() => setShowJoinModal(false)} onSuccess={fetchTeam} />}
      </div>
    </div>
  )
}

function CreateTeamModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState(4)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post('/api/teams', { name, description, capacity })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Team</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              min={1}
              max={10}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  )
}

function JoinTeamModal({ onClose, onSuccess }) {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // First get team by invite code (we need to search)
      const teamsRes = await axios.get('/api/admin/teams')
      const team = teamsRes.data.find(t => t.invite_code === inviteCode)
      
      if (!team) {
        setError('Invalid invite code')
        setLoading(false)
        return
      }

      await axios.post(`/api/teams/${team.id}/join`, { invite_code: inviteCode })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to join team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Join Team</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Invite Code</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              placeholder="Enter team invite code"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Joining...' : 'Join Team'}
          </button>
        </form>
      </div>
    </div>
  )
}
