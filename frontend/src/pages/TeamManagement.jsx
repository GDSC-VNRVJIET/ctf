import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function TeamManagement() {
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  const fetchTeam = async () => {
    try {
      const response = await axios.get('/api/teams/my/team')
      const teamData = response.data
      setTeam(teamData)

      // Fetch members
      const membersResponse = await axios.get(`/api/teams/${teamData.id}/members`)
      setMembers(membersResponse.data)

      // Fetch join requests if user is captain
      if (teamData.captain_user_id === user.id) {
        const requestsResponse = await axios.get(`/api/teams/${teamData.id}/join-requests`)
        setJoinRequests(requestsResponse.data)
      } else {
        setJoinRequests([])
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setTeam(null)
        setMembers([])
        setJoinRequests([])
      } else {
        alert('Failed to load team data')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const handleAcceptRequest = async (requestId) => {
    if (!confirm('Accept this join request?')) return
    
    try {
      await axios.post(`/api/teams/${team.id}/join-requests/${requestId}/accept`)
      alert('Request accepted!')
      fetchTeam()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to accept request')
    }
  }

  const handleRejectRequest = async (requestId) => {
    if (!confirm('Reject this join request?')) return
    
    try {
      await axios.post(`/api/teams/${team.id}/join-requests/${requestId}/reject`)
      alert('Request rejected!')
      fetchTeam()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to reject request')
    }
  }

  const handleRemoveMember = async (userId, userName) => {
    if (!confirm(`Remove ${userName} from the team?`)) return
    
    try {
      await axios.delete(`/api/teams/${team.id}/members/${userId}`)
      alert('Member removed successfully!')
      fetchTeam()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to remove member')
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone!')) return
    
    try {
      await axios.delete(`/api/teams/${team.id}`)
      alert('Team deleted successfully!')
      window.location.reload()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete team')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
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
              {team.captain_user_id === user.id && (
                <div style={{ marginTop: '16px' }}>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDeleteTeam}
                  >
                    Delete Team
                  </button>
                </div>
              )}
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
                    {team.captain_user_id === user.id && <th>Actions</th>}
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
                      {team.captain_user_id === user.id && (
                        <td>
                          {member.user.id !== user.id && (
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {team.captain_user_id === user.id && joinRequests.length > 0 && (
              <div className="card">
                <h3>Join Requests</h3>
                <table style={{ marginTop: '16px' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Requested</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {joinRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.user.name}</td>
                        <td>{request.user.email}</td>
                        <td>{new Date(request.requested_at).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-success btn-sm" 
                            style={{ marginRight: '8px' }}
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
      // Get team by invite code
      const teamRes = await axios.get(`/api/teams/by-invite/${inviteCode}`)
      const team = teamRes.data

      await axios.post(`/api/teams/${team.id}/join`, { invite_code: inviteCode })
      alert('Join request sent successfully! Wait for captain approval.')
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send join request')
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
