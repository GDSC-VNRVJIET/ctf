import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorHandler';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('rooms');
  const { userId } = useAuth();

  const rooms = useQuery(api.admin.getAllRooms, activeTab === 'rooms' ? { userId } : "skip");
  const teams = useQuery(api.admin.getAllTeams, activeTab === 'teams' ? { userId } : "skip");
  const logs = useQuery(api.admin.getLogs, activeTab === 'logs' ? { userId } : "skip");
  const puzzles = useQuery(api.admin.getAllPuzzles, activeTab === 'puzzles' ? { userId } : "skip");

  const loading = (activeTab === 'rooms' && rooms === undefined) ||
    (activeTab === 'teams' && teams === undefined) ||
    (activeTab === 'logs' && logs === undefined) ||
    (activeTab === 'puzzles' && puzzles === undefined);

  return (
    <div>
      <div className="container">
        <div className="card">
          <h1>Admin Panel</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              className={`btn ${activeTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('rooms')}
            >
              Rooms
            </button>
            <button
              className={`btn ${activeTab === 'puzzles' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('puzzles')}
            >
              Challenges
            </button>
            <button
              className={`btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('teams')}
            >
              Teams
            </button>
            <button
              className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
            <button
              className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('create')}
            >
              Create Content
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'rooms' && <RoomsTab rooms={rooms || []} />}
            {activeTab === 'puzzles' && <PuzzlesTab puzzles={puzzles || []} />}
            {activeTab === 'teams' && <TeamsTab teams={teams || []} />}
            {activeTab === 'logs' && <LogsTab logs={logs || []} />}
            {activeTab === 'create' && <CreateTab />}
          </>
        )}
      </div>
    </div>
  );
}

function RoomsTab({ rooms }) {
  const [editingRoom, setEditingRoom] = useState(null);

  return (
    <div className="card">
      <h2>Rooms</h2>
      <table style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Order</th>
            <th>Challenges</th>
            <th>Unlock Cost</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room._id}>
              <td>{room.name}</td>
              <td>{room.orderIndex}</td>
              <td>{room.puzzles?.length || 0}</td>
              <td>{room.unlockCost}</td>
              <td>
                <span className={`badge ${room.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {room.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setEditingRoom(room)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingRoom && (
        <EditRoomForm room={editingRoom} onClose={() => setEditingRoom(null)} />
      )}
    </div>
  );
}

function PuzzlesTab({ puzzles }) {
  const [editingPuzzle, setEditingPuzzle] = useState(null);

  return (
    <div className="card">
      <h2>Challenges</h2>
      <table style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Points</th>
            <th>Room</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {puzzles.map((puzzle) => (
            <tr key={puzzle._id}>
              <td>{puzzle.title}</td>
              <td>{puzzle.type}</td>
              <td>{puzzle.pointsReward}</td>
              <td>{puzzle.roomId}</td>
              <td>
                <span className={`badge ${puzzle.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {puzzle.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setEditingPuzzle(puzzle)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingPuzzle && (
        <EditPuzzleForm puzzle={editingPuzzle} onClose={() => setEditingPuzzle(null)} />
      )}
    </div>
  );
}

function TeamsTab({ teams }) {
  const refundPoints = useMutation(api.admin.refundPoints);
  const disableTeam = useMutation(api.admin.disableTeam);
  const deleteTeam = useMutation(api.admin.deleteTeamAdmin);

  const handleAddPoints = async (teamId) => {
    const amount = prompt('Enter points amount to add:');
    if (!amount) return;

    try {
      await refundPoints({ userId, teamId, amount: parseFloat(amount) });
      toast.success('Points added successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add points'));
    }
  };

  const handleDisable = async (teamId) => {
    if (!confirm('Disable this team?')) return;

    try {
      await disableTeam({ teamId });
      toast.success('Team disabled');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to disable team'));
    }
  };

  const { userId } = useAuth();
  const handleDelete = async (teamId) => {
    if (!confirm('Delete this team permanently? This action cannot be undone!')) return;

    try {
      await deleteTeam({ userId, teamId });
      toast.success('Team deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete team'));
    }
  };

  return (
    <div className="card">
      <h2>Teams</h2>
      <table style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Points</th>
            <th>Current Room</th>
            <th>Shield</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team._id}>
              <td>{team.name}</td>
              <td>{team.pointsBalance.toFixed(2)}</td>
              <td>{team.currentRoomId || 'Not started'}</td>
              <td>
                {team.shieldActive && (
                  <span className="badge badge-success">Active</span>
                )}
              </td>
              <td>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}
                  onClick={() => handleAddPoints(team._id)}
                >
                  Add Points
                </button>
                <button
                  className="btn btn-warning"
                  style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}
                  onClick={() => handleDisable(team._id)}
                >
                  Disable
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => handleDelete(team._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsTab({ logs }) {
  return (
    <div className="card">
      <h2>Audit Logs</h2>
      <div style={{ maxHeight: '600px', overflowY: 'auto', marginTop: '16px' }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td><span className="badge badge-info">{log.action}</span></td>
                <td style={{ fontSize: '12px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.detailsJson}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateTab() {
  const [contentType, setContentType] = useState('room');

  return (
    <div className="card">
      <h2>Create Content</h2>
      <div style={{ marginTop: '16px' }}>
        <select
          className="form-group"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          style={{ marginBottom: '16px' }}
        >
          <option value="room">Room</option>
          <option value="puzzle">Puzzle</option>
          <option value="clue">Clue</option>
          <option value="clue">Perk</option>
        </select>

        {contentType === 'room' && <CreateRoomForm />}
        {contentType === 'puzzle' && <CreatePuzzleForm />}
          {contentType === 'clue' && <CreateClueForm />}
      </div>
    </div>
  );
}

function CreateRoomForm() {
  const createRoom = useMutation(api.admin.createRoom);
  const { userId } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    orderIndex: 1,
    description: '',
    brief: '',
    isChallenge: false,
    unlockCost: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRoom({ userId, ...formData });
      toast.success('Room created!');
      setFormData({
        name: '',
        orderIndex: 1,
        description: '',
        brief: '',
        isChallenge: false,
        unlockCost: 0
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create room'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>Order Index</label>
        <input
          type="number"
          value={formData.orderIndex}
          onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="form-group">
        <label>Brief/Story (shown when entering room)</label>
        <textarea
          value={formData.brief}
          onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
          rows={4}
          placeholder="Enter the story or briefing text that will be shown to players when they enter this room..."
        />
      </div>
      <div className="form-group">
        <label>Unlock Cost</label>
        <input
          type="number"
          value={formData.unlockCost}
          onChange={(e) => setFormData({ ...formData, unlockCost: parseFloat(e.target.value) })}
        />
      </div>
      <button type="submit" className="btn btn-primary">Create Room</button>
    </form>
  );
}

function EditRoomForm({ room, onClose }) {
  const updateRoom = useMutation(api.admin.updateRoom);

  const [formData, setFormData] = useState({
    roomId: room._id,
    name: room.name,
    orderIndex: room.orderIndex,
    description: room.description,
    brief: room.brief || '',
    isChallenge: room.isChallenge,
    unlockCost: room.unlockCost,
    challengeInvestment: room.challengeInvestment
  });

  const { userId } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRoom({ userId, ...formData });
      toast.success('Room updated!');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update room'));
    }
  };

  return (
    <div className="card" style={{ marginTop: '16px' }}>
      <h3>Edit Room</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Order Index</label>
          <input
            type="number"
            value={formData.orderIndex}
            onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Brief/Story (shown when entering room)</label>
          <textarea
            value={formData.brief}
            onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
            rows={4}
            placeholder="Enter the story or briefing text that will be shown to players when they enter this room..."
          />
        </div>
        <div className="form-group">
          <label>Unlock Cost</label>
          <input
            type="number"
            value={formData.unlockCost}
            onChange={(e) => setFormData({ ...formData, unlockCost: parseFloat(e.target.value) })}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn btn-primary">Update Room</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function EditPuzzleForm({ puzzle, onClose }) {
  const { userId } = useAuth()
  const rooms = useQuery(api.admin.getAllRooms, { userId })
  const updatePuzzle = useMutation(api.admin.updatePuzzle)

  const [formData, setFormData] = useState({
    puzzleId: puzzle._id,
    roomId: puzzle.roomId || '',
    title: puzzle.title,
    type: puzzle.type,
    description: puzzle.description,
    flag: '', // Don't show existing flag for security
    pointsReward: puzzle.pointsReward
  })

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Remove isActive if present
      const { isActive, ...payload } = formData;
      await updatePuzzle({ userId, ...payload });
      toast.success('Question updated!');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update question'));
    }
  }

  return (
    <div className="card" style={{ marginTop: '16px' }}>
      <h3>Edit Question</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Room</label>
          <select
            value={formData.roomId}
            onChange={e => setFormData({ ...formData, roomId: e.target.value })}
            required
          >
            <option value="">Select a room</option>
            {rooms && rooms.map(room => (
              <option key={room._id} value={room._id}>{room.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="static_flag">Static Flag</option>
            <option value="interactive">Interactive</option>
            <option value="question">Question</option>
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>New Flag (leave empty to keep current)</label>
          <input
            type="text"
            value={formData.flag}
            onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
            placeholder="Enter new flag to update"
          />
        </div>
        <div className="form-group">
          <label>Points Reward</label>
          <input
            type="number"
            value={formData.pointsReward}
            onChange={(e) => setFormData({ ...formData, pointsReward: parseInt(e.target.value) })}
            required
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn btn-primary">Update Question</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

function CreatePuzzleForm() {
  const { userId } = useAuth()
  const rooms = useQuery(api.admin.getAllRooms, { userId })
  const createPuzzle = useMutation(api.admin.createPuzzle)

  const [formData, setFormData] = useState({
    roomId: '',
    title: '',
    description: '',
    flag: '',
    pointsReward: 100,
    type: 'question',
    isChallenge: false,
    challengeTimerMinutes: 10,
    challengePointsMultiplier: 2,
    topic: '',
    difficulty: 'medium',
    imageUrls: '',
    fileUrls: '',
    externalLinks: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Parse arrays for imageUrls, fileUrls, externalLinks
      const submitData = {
        ...formData,
        imageUrls: formData.imageUrls ? formData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        fileUrls: formData.fileUrls ? JSON.parse(formData.fileUrls) : undefined,
        externalLinks: formData.externalLinks ? JSON.parse(formData.externalLinks) : undefined,
      };
      
      await createPuzzle({ userId, ...submitData });
      toast.success('Challenge created!');
      setFormData({
        roomId: '',
        title: '',
        description: '',
        flag: '',
        pointsReward: 100,
        type: 'question',
        isChallenge: false,
        challengeTimerMinutes: 10,
        challengePointsMultiplier: 2,
        topic: '',
        difficulty: 'medium',
        imageUrls: '',
        fileUrls: '',
        externalLinks: ''
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create challenge'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Room</label>
        <select
          value={formData.roomId}
          onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
          required
        >
          <option value="">Select a room</option>
          {rooms && rooms.map(room => (
            <option key={room._id} value={room._id}>{room.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="form-group">
        <label>Flag</label>
        <input
          type="text"
          value={formData.flag}
          onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
          placeholder="flag{example}"
          required
        />
      </div>
      <div className="form-group">
        <label>Points Reward</label>
        <input
          type="number"
          value={formData.pointsReward}
          onChange={(e) => setFormData({ ...formData, pointsReward: parseFloat(e.target.value) })}
        />
      </div>
      
      <div className="form-group">
        <label>Topic/Category</label>
        <input
          type="text"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          placeholder="e.g., Cryptography, Web Security"
        />
      </div>

      <div className="form-group">
        <label>Difficulty</label>
        <select
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
        >
          <option value="very_easy">Very Easy</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="very_hard">Very Hard</option>
        </select>
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={formData.isChallenge}
            onChange={(e) => setFormData({ ...formData, isChallenge: e.target.checked })}
          />
          Is Challenge Question (Premium)
        </label>
      </div>

      {formData.isChallenge && (
        <>
          <div className="form-group">
            <label>Challenge Timer (Minutes)</label>
            <input
              type="number"
              value={formData.challengeTimerMinutes}
              onChange={(e) => setFormData({ ...formData, challengeTimerMinutes: parseInt(e.target.value) })}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Points Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={formData.challengePointsMultiplier}
              onChange={(e) => setFormData({ ...formData, challengePointsMultiplier: parseFloat(e.target.value) })}
              min="1"
            />
            <small style={{ color: '#aaa' }}>
              Final reward: {formData.pointsReward * formData.challengePointsMultiplier} pts
            </small>
          </div>
        </>
      )}

      <div className="form-group">
        <label>Image URLs (comma-separated)</label>
        <textarea
          value={formData.imageUrls}
          onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value })}
          placeholder="https://imgur.com/image1.png, https://imgur.com/image2.png"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label>File URLs (JSON array)</label>
        <textarea
          value={formData.fileUrls}
          onChange={(e) => setFormData({ ...formData, fileUrls: e.target.value })}
          placeholder='[{"name": "data.zip", "url": "https://example.com/data.zip"}]'
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>External Links (JSON array)</label>
        <textarea
          value={formData.externalLinks}
          onChange={(e) => setFormData({ ...formData, externalLinks: e.target.value })}
          placeholder='[{"title": "Documentation", "url": "https://example.com/docs"}]'
          rows={3}
        />
      </div>

      <button type="submit" className="btn btn-primary">Create Challenge</button>
    </form>
  );
}

function CreateClueForm() {
  const { userId } = useAuth();
  const rooms = useQuery(api.admin.getAllRooms, { userId });
  const allPuzzles = useQuery(api.admin.getAllPuzzles, { userId });
  const createClue = useMutation(api.admin.createClue);
  const updateClue = useMutation(api.admin.updateClue);
  const deleteClue = useMutation(api.admin.deleteClue);
  
  const [selectedRoom, setSelectedRoom] = useState('');
  const [editingClueId, setEditingClueId] = useState(null);
  const [formData, setFormData] = useState({
    puzzleId: '',
    text: '',
    cost: 10,
    orderIndex: 0
  });
  
  // Get clues for the selected puzzle
  const clues = useQuery(
    api.admin.getCluesByPuzzle,
    formData.puzzleId ? { userId, puzzleId: formData.puzzleId } : "skip"
  );
  
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0]._id);
    }
  }, [rooms, selectedRoom]);
  
  useEffect(() => {
    if (selectedRoom && allPuzzles) {
      const roomPuzzles = allPuzzles.filter(p => p.roomId === selectedRoom);
      setFormData(prev => ({ ...prev, puzzleId: roomPuzzles.length > 0 ? roomPuzzles[0]._id : '' }));
    }
  }, [selectedRoom, allPuzzles]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.puzzleId) {
      toast.error('Please select a puzzle');
      return;
    }
    if (!formData.text.trim()) {
      toast.error('Please enter clue text');
      return;
    }
    if (formData.cost < 0) {
      toast.error('Cost cannot be negative');
      return;
    }
    
    try {
      if (editingClueId) {
        await updateClue({ userId, clueId: editingClueId, text: formData.text, cost: formData.cost, orderIndex: formData.orderIndex });
        toast.success('Clue updated!');
        setEditingClueId(null);
      } else {
        await createClue({ userId, puzzleId: formData.puzzleId, text: formData.text, cost: formData.cost, orderIndex: formData.orderIndex });
        toast.success('Clue created!');
      }
      setFormData({
        puzzleId: formData.puzzleId,
        text: '',
        cost: 10,
        orderIndex: 0
      });
    } catch (error) {
      toast.error(getErrorMessage(error, editingClueId ? 'Failed to update clue' : 'Failed to create clue'));
    }
  };

  const handleEdit = (clue) => {
    setEditingClueId(clue._id);
    setFormData({
      puzzleId: formData.puzzleId,
      text: clue.text,
      cost: clue.cost,
      orderIndex: clue.orderIndex
    });
  };

  const handleDelete = async (clueId) => {
    if (!confirm('Delete this clue?')) return;
    try {
      await deleteClue({ userId, clueId });
      toast.success('Clue deleted!');
      if (editingClueId === clueId) {
        setEditingClueId(null);
        setFormData(prev => ({ ...prev, text: '', cost: 10, orderIndex: 0 }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete clue'));
    }
  };

  if (!rooms || !allPuzzles) return <div>Loading rooms and puzzles...</div>;
  const roomPuzzles = allPuzzles.filter(p => p.roomId === selectedRoom);
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Room</label>
          <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
            {rooms.map(room => (
              <option key={room._id} value={room._id}>{room.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Puzzle</label>
          <select
            value={formData.puzzleId}
            onChange={e => setFormData(prev => ({ ...prev, puzzleId: e.target.value }))}
            disabled={roomPuzzles.length === 0}
          >
            {roomPuzzles.length === 0 ? (
              <option value="">No puzzles available for this room</option>
            ) : (
              roomPuzzles.map(puzzle => (
                <option key={puzzle._id} value={puzzle._id}>{puzzle.title}</option>
              ))
            )}
          </select>
        </div>
        <div className="form-group">
          <label>Clue Text</label>
          <textarea
            value={formData.text}
            onChange={e => setFormData({ ...formData, text: e.target.value })}
            rows={3}
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label>Cost</label>
          <input
            type="number"
            value={formData.cost}
            onChange={e => setFormData({ ...formData, cost: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
            min="0"
            required
          />
        </div>
        <div className="form-group">
          <label>Order Index</label>
          <input
            type="number"
            value={formData.orderIndex}
            onChange={e => setFormData({ ...formData, orderIndex: e.target.value === '' ? 0 : parseInt(e.target.value) })}
            min="0"
            required
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary">
            {editingClueId ? 'Update Clue' : 'Create Clue'}
          </button>
          {editingClueId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingClueId(null);
                setFormData(prev => ({ ...prev, text: '', cost: 10, orderIndex: 0 }));
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {clues && clues.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3>Clues for this Question ({clues.length}/3)</h3>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Text</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clues.map(clue => (
                <tr key={clue._id} style={{ backgroundColor: editingClueId === clue._id ? '#2d3a4f' : 'transparent' }}>
                  <td>#{clue.orderIndex}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clue.text}</td>
                  <td>{clue.cost} pts</td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleEdit(clue)}
                      style={{ marginRight: '8px', backgroundColor: '#4a7bde' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleDelete(clue._id)}
                      style={{ backgroundColor: '#e74c3c' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
