import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('rooms')
  const { userId } = useAuth()

  const rooms = useQuery(api.admin.getAllRooms, activeTab === 'rooms' ? {} : "skip")
  const teams = useQuery(api.admin.getAllTeams, activeTab === 'teams' ? {} : "skip")
  const logs = useQuery(api.admin.getLogs, activeTab === 'logs' ? {} : "skip")

  const loading = (activeTab === 'rooms' && rooms === undefined) ||
    (activeTab === 'teams' && teams === undefined) ||
    (activeTab === 'logs' && logs === undefined)

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
            {activeTab === 'teams' && <TeamsTab teams={teams || []} />}
            {activeTab === 'logs' && <LogsTab logs={logs || []} />}
            {activeTab === 'create' && <CreateTab />}
          </>
        )}
      </div>
    </div>
  )
}

function RoomsTab({ rooms }) {
  return (
    <div className="card">
      <h2>Rooms</h2>
      <table style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Order</th>
            <th>Puzzles</th>
            <th>Unlock Cost</th>
            <th>Status</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TeamsTab({ teams }) {
  const refundPoints = useMutation(api.admin.refundPoints)
  const disableTeam = useMutation(api.admin.disableTeam)
  const deleteTeam = useMutation(api.admin.deleteTeamAdmin)

  const handleRefund = async (teamId) => {
    const amount = prompt('Enter refund amount:')
    if (!amount) return

    try {
      await refundPoints({ teamId, amount: parseFloat(amount) })
      alert('Points refunded')
    } catch (error) {
      alert(error?.message || 'Failed to refund points')
    }
  }

  const handleDisable = async (teamId) => {
    if (!confirm('Disable this team?')) return

    try {
      await disableTeam({ teamId })
      alert('Team disabled')
    } catch (error) {
      alert(error?.message || 'Failed to disable team')
    }
  }

  const handleDelete = async (teamId) => {
    if (!confirm('Delete this team permanently? This action cannot be undone!')) return

    try {
      await deleteTeam({ teamId })
      alert('Team deleted')
    } catch (error) {
      alert(error?.message || 'Failed to delete team')
    }
  }

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
                  onClick={() => handleRefund(team._id)}
                >
                  Refund
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
  )
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
  )
}

function CreateTab() {
  const [contentType, setContentType] = useState('room')

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
        </select>

        {contentType === 'room' && <CreateRoomForm />}
        {contentType === 'puzzle' && <CreatePuzzleForm />}
        {contentType === 'clue' && <CreateClueForm />}
      </div>
    </div>
  )
}

function CreateRoomForm() {
  const createRoom = useMutation(api.admin.createRoom)

  const [formData, setFormData] = useState({
    name: '',
    orderIndex: 1,
    description: '',
    isChallenge: false,
    unlockCost: 0
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createRoom(formData)
      alert('Room created!')
      setFormData({
        name: '',
        orderIndex: 1,
        description: '',
        isChallenge: false,
        unlockCost: 0
      })
    } catch (error) {
      alert(error?.message || 'Failed to create room')
    }
  }

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
        <label>Unlock Cost</label>
        <input
          type="number"
          value={formData.unlockCost}
          onChange={(e) => setFormData({ ...formData, unlockCost: parseFloat(e.target.value) })}
        />
      </div>
      <button type="submit" className="btn btn-primary">Create Room</button>
    </form>
  )
}

function CreatePuzzleForm() {
  const rooms = useQuery(api.admin.getAllRooms)
  const createPuzzle = useMutation(api.admin.createPuzzle)

  const [formData, setFormData] = useState({
    roomId: '',
    title: '',
    description: '',
    flag: '',
    pointsReward: 100
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createPuzzle(formData)
      alert('Puzzle created!')
      setFormData({
        roomId: '',
        title: '',
        description: '',
        flag: '',
        pointsReward: 100
      })
    } catch (error) {
      alert(error?.message || 'Failed to create puzzle')
    }
  }

  if (!rooms) return <div>Loading rooms...</div>

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
          {rooms.map(room => (
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
      <button type="submit" className="btn btn-primary">Create Puzzle</button>
    </form>
  )
}

function CreateClueForm() {
  const rooms = useQuery(api.admin.getAllRooms)
  const createClue = useMutation(api.admin.createClue)

  const [selectedRoom, setSelectedRoom] = useState('')
  const [puzzles, setPuzzles] = useState([])
  const [formData, setFormData] = useState({
    puzzleId: '',
    text: '',
    cost: 10,
    orderIndex: 0
  })

  // Update puzzles when room selection changes
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0]._id)
    }
  }, [rooms, selectedRoom])

  useEffect(() => {
    if (selectedRoom && rooms) {
      const room = rooms.find(r => r._id === selectedRoom)
      if (room?.puzzles) {
        setPuzzles(room.puzzles)
        if (room.puzzles.length > 0) {
          setFormData(prev => ({ ...prev, puzzleId: room.puzzles[0]._id }))
        }
      }
    }
  }, [selectedRoom, rooms])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createClue(formData)
      alert('Clue created!')
      setFormData({
        puzzleId: '',
        text: '',
        cost: 10,
        orderIndex: 0
      })
    } catch (error) {
      alert(error?.message || 'Failed to create clue')
    }
  }

  if (!rooms) return <div>Loading rooms...</div>

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Room</label>
        <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
          {rooms.map(room => (
            <option key={room._id} value={room._id}>{room.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Puzzle</label>
        <select
          value={formData.puzzleId}
          onChange={(e) => setFormData({ ...formData, puzzleId: e.target.value })}
          required
        >
          {puzzles.map(puzzle => (
            <option key={puzzle._id} value={puzzle._id}>{puzzle.title}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Clue Text</label>
        <textarea
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          rows={3}
          required
        />
      </div>
      <div className="form-group">
        <label>Cost</label>
        <input
          type="number"
          value={formData.cost}
          onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
        />
      </div>
      <button type="submit" className="btn btn-primary">Create Clue</button>
    </form>
  )
}
