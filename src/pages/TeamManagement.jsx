import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../convex/_generated/api';

export default function TeamManagement() {
  const { user, userId } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : "skip");
  const members = useQuery(
    api.teams.getTeamMembers,
    userId && team ? { userId, teamId: team._id } : "skip"
  );
  const joinRequests = useQuery(
    api.teams.getTeamJoinRequests,
    userId && team && team.captainUserId === userId ? { userId, teamId: team._id } : "skip"
  );

  // Mutations
  const acceptRequest = useMutation(api.teams.acceptJoinRequest);
  const rejectRequest = useMutation(api.teams.rejectJoinRequest);
  const removeMember = useMutation(api.teams.removeTeamMember);
  const deleteTeam = useMutation(api.teams.deleteTeam);

  const loading = team === undefined;

  const handleAcceptRequest = async (requestId) => {
    if (!confirm('Accept this join request?')) return;

    try {
      await acceptRequest({ userId, teamId: team._id, requestId });
      toast.success('Request accepted!');
    } catch (error) {
      const errorMessage = error?.message?.split('\n')[0] || 'Failed to accept request';
      toast.error(errorMessage);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!confirm('Reject this join request?')) return;

    try {
      await rejectRequest({ userId, teamId: team._id, requestId });
      toast.success('Request rejected!');
    } catch (error) {
      const errorMessage = error?.message?.split('\n')[0] || 'Failed to reject request';
      toast.error(errorMessage);
    }
  };

  const handleRemoveMember = async (targetUserId, userName) => {
    if (!confirm(`Remove ${userName} from the team?`)) return;

    try {
      await removeMember({ userId, teamId: team._id, targetUserId });
      toast.success('Member removed successfully!');
    } catch (error) {
      const errorMessage = error?.message?.split('\n')[0] || 'Failed to remove member';
      toast.error(errorMessage);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone!')) return;

    try {
      await deleteTeam({ userId, teamId: team._id });
      toast.success('Team deleted successfully!');
      window.location.reload();
    } catch (error) {
      const errorMessage = error?.message?.split('\n')[0] || 'Failed to delete team';
      toast.error(errorMessage);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

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
                <div><strong>Points Balance:</strong> {team.pointsBalance.toFixed(2)}</div>
                <div><strong>Capacity:</strong> {members ? members.length : 0}/{team.capacity}</div>
                <div><strong>Invite Code:</strong> <code>{team.inviteCode}</code></div>
              </div>
              {team.captainUserId === userId && (
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
                    {team.captainUserId === userId && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members && members.map((member) => (
                    <tr key={member._id}>
                      <td>{member.user?.name}</td>
                      <td>{member.user?.email}</td>
                      <td>
                        <span className={`badge ${member.role === 'captain' ? 'badge-success' : 'badge-info'}`}>
                          {member.role}
                        </span>
                      </td>
                      <td>{new Date(member.joinedAt).toLocaleDateString()}</td>
                      {team.captainUserId === userId && (
                        <td>
                          {member.userId !== userId && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveMember(member.userId, member.user?.name)}
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

            {team.captainUserId === userId && joinRequests && joinRequests.length > 0 && (
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
                      <tr key={request._id}>
                        <td>{request.user?.name}</td>
                        <td>{request.user?.email}</td>
                        <td>{new Date(request.requestedAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            style={{ marginRight: '8px' }}
                            onClick={() => handleAcceptRequest(request._id)}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRejectRequest(request._id)}
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

        {showCreateModal && <CreateTeamModal onClose={() => setShowCreateModal(false)} />}
        {showJoinModal && <JoinTeamModal onClose={() => setShowJoinModal(false)} />}
      </div>
    </div>
  )
}

function CreateTeamModal({ onClose }) {
  const { userId } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createTeam = useMutation(api.teams.createTeam);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createTeam({ userId, name, description, capacity });
      toast.success('Team created successfully!');
      onClose();
    } catch (err) {
      const errorMessage = err?.message?.split('\n')[0] || 'Failed to create team';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

function JoinTeamModal({ onClose }) {
  const { userId } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getTeamByInvite = useQuery(
    api.teams.getTeamByInviteCode,
    inviteCode ? { inviteCode } : "skip"
  );
  const requestJoin = useMutation(api.teams.requestJoinTeam);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!getTeamByInvite) {
        throw new Error('Team not found with that invite code');
      }

      await requestJoin({
        userId,
        teamId: getTeamByInvite._id,
        inviteCode
      });
      toast.success('Join request sent successfully! Wait for captain approval.');
      onClose();
    } catch (err) {
      const errorMessage = err?.message?.split('\n')[0] || 'Failed to send join request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
