import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('rooms')
  const [rooms, setRooms] = useState([])
  const [teams, setTeams] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'rooms') {
        const res = await axios.get('/api/rooms')
        setRooms(res.data)
      } else if (activeTab === 'teams') {
        const res = await axios.get('/api/admin/teams')
        setTeams(res.data)
      } else if (activeTab === 'logs') {
        const res = await axios.get('/api/admin/logs')
        setLogs(res.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
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
            {activeTab === 'rooms' && <RoomsTab rooms={rooms} onRefresh={fetchData} />}
            {activeTab === 'teams' && <TeamsTab teams={teams} onRefresh={fetchData} />}
            {activeTab === 'logs' && <LogsTab logs={logs} />}
            {activeTab === 'create' && <CreateTab onRefresh={fetchData} />}
          </>
        )}
      </div>
    </div>
  )
}

function RoomsTab({ rooms, onRefresh }) {
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
            <tr key={room.id}>
              <td>{room.name}</td>
              <td>{room.order_index}</td>
              <td>{room.puzzles?.length || 0}</td>
              <td>{room.unlock_cost}</td>
              <td>
                <span className={`badge ${room.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {room.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TeamsTab({ teams, onRefresh }) {
  const handleRefund = async (teamId) => {
    const amount = prompt('Enter refund amount:')
    if (!amount) return

    try {
      await axios.post(`/api/admin/teams/${teamId}/refund?amount=${amount}`)
      alert('Points refunded')
      onRefresh()
    } catch (error) {
      alert('Failed to refund points')
    }
  }

  const handleDisable = async (teamId) => {
    if (!confirm('Disable this team?')) return

    try {
      await axios.post(`/api/admin/teams/${teamId}/disable`)
      alert('Team disabled')
      onRefresh()
    } catch (error) {
      alert('Failed to disable team')
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
            <tr key={team.id}>
              <td>{team.name}</td>
              <td>{team.points_balance.toFixed(2)}</td>
              <td>{team.current_room_id || 'Not started'}</td>
              <td>
                {team.shield_active && (
                  <span className="badge badge-success">Active</span>
                )}
              </td>
              <td>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}
                  onClick={() => handleRefund(team.id)}
                >
                  Refund
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => handleDisable(team.id)}
                >
                  Disable
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
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td><span className="badge badge-info">{log.action}</span></td>
                <td style={{ fontSize: '12px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.details_json}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CreateTab({ onRefresh }) {
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

        {contentType === 'room' && <CreateRoomForm onSuccess={onRefresh} />}
        {contentType === 'puzzle' && <CreatePuzzleForm onSuccess={onRefresh} />}
        {contentType === 'clue' && <CreateClueForm onSuccess={onRefresh} />}
      </div>
    </div>
  )
}

function CreateRoomForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    order_index: 1,
    description: '',
    is_challenge: false,
    unlock_cost: 0
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/admin/rooms', formData)
      alert('Room created!')
      onSuccess()
    } catch (error) {
      alert('Failed to create room')
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
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
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
          value={formData.unlock_cost}
          onChange={(e) => setFormData({ ...formData, unlock_cost: parseFloat(e.target.value) })}
        />
      </div>
      <button type="submit" className="btn btn-primary">Create Room</button>
    </form>
  )
}

function CreatePuzzleForm({ onSuccess }) {
  const [rooms, setRooms] = useState([])
  const [formData, setFormData] = useState({
    room_id: '',
    title: '',
    description: '',
    flag: '',
    points_reward: 100
  })

  useEffect(() => {
    axios.get('/api/rooms').then(res => {
      setRooms(res.data)
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, room_id: res.data[0].id }))
      }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/admin/puzzles', formData)
      alert('Puzzle created!')
      onSuccess()
    } catch (error) {
      alert('Failed to create puzzle')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Room</label>
        <select
          value={formData.room_id}
          onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
          required
        >
          {rooms.map(room => (
            <option key={room.id} value={room.id}>{room.name}</option>
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
          value={formData.points_reward}
          onChange={(e) => setFormData({ ...formData, points_reward: parseFloat(e.target.value) })}
        />
      </div>
      <button type="submit" className="btn btn-primary">Create Puzzle</button>
    </form>
  )
}

function CreateClueForm({ onSuccess }) {
  const [rooms, setRooms] = useState([])
  const [puzzles, setPuzzles] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [formData, setFormData] = useState({
    puzzle_id: '',
    text: '',
    cost: 10,
    order_index: 0
  })

  useEffect(() => {
    axios.get('/api/rooms').then(res => {
      setRooms(res.data)
      if (res.data.length > 0) {
        setSelectedRoom(res.data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      const room = rooms.find(r => r.id === selectedRoom)
      if (room?.puzzles) {
        setPuzzles(room.puzzles)
        if (room.puzzles.length > 0) {
          setFormData(prev => ({ ...prev, puzzle_id: room.puzzles[0].id }))
        }
      }
    }
  }, [selectedRoom, rooms])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/admin/clues', formData)
      alert('Clue created!')
      onSuccess()
    } catch (error) {
      alert('Failed to create clue')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Room</label>
        <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
          {rooms.map(room => (
            <option key={room.id} value={room.id}>{room.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Puzzle</label>
        <select
          value={formData.puzzle_id}
          onChange={(e) => setFormData({ ...formData, puzzle_id: e.target.value })}
          required
        >
          {puzzles.map(puzzle => (
            <option key={puzzle.id} value={puzzle.id}>{puzzle.title}</option>
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
