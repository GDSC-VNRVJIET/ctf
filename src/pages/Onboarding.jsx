import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import toast from 'react-hot-toast'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/errorHandler'

export default function Onboarding() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [mode, setMode] = useState('select') // 'select', 'create', 'join'
  const [formData, setFormData] = useState({
    teamName: '',
    teamCapacity: 5,
    inviteCode: '',
    selectedTeamId: null
  })

  const createTeam = useMutation(api.teams.createTeam)
  const requestJoinTeam = useMutation(api.teams.requestJoinTeam)
  const teams = useQuery(api.teams.getAvailableTeams)

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    try {
      await createTeam({
        name: formData.teamName,
        userId,
        capacity: parseInt(formData.teamCapacity)
      });
      toast.success('Team created successfully!');
      navigate('/rules');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create team'));
    }
  }

  const handleJoinTeam = async (e) => {
    e.preventDefault()
    if (!formData.selectedTeamId || !formData.inviteCode) {
      toast.error('Please select a team and enter the invite code')
      return
    }
    try {
      await requestJoinTeam({
        userId,
        teamId: formData.selectedTeamId,
        inviteCode: formData.inviteCode
      });
      toast.success('Successfully requested to join team!');
      navigate('/rules');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to join team'));
    }
  }

  return (
    <div className="onboarding-container">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1>Welcome to Convergence CTF</h1>
        <p>Choose how you'd like to participate:</p>

        {mode === 'select' && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setMode('create')}
              style={{ flex: 1 }}
            >
              Create New Team
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setMode('join')}
              style={{ flex: 1 }}
            >
              Join Existing Team
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateTeam} style={{ marginTop: '24px' }}>
            <div className="form-group">
              <label>Team Name</label>
              <input
                type="text"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                placeholder="Enter your team name"
                required
              />
            </div>
            <div className="form-group">
              <label>Team Capacity</label>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Minimum: 2 members, Maximum: 5 members</p>
              <input
                type="number"
                min="2"
                max="5"
                value={formData.teamCapacity}
                onChange={(e) => setFormData({ ...formData, teamCapacity: e.target.value })}
                placeholder="Enter team capacity (2-5)"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">Create Team</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMode('select')}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinTeam} style={{ marginTop: '24px' }}>
            <h3>Join Existing Team</h3>
            <div className="form-group">
              <label>Select Team</label>
              <select
                value={formData.selectedTeamId || ''}
                onChange={(e) => setFormData({ ...formData, selectedTeamId: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="">Choose a team...</option>
                {teams?.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} ({team.members?.length || 0} members)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Invite Code</label>
              <input
                type="text"
                value={formData.inviteCode}
                onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                placeholder="Enter team invite code"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">Join Team</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMode('select')}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}