import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <div className="navbar">
      <div className="navbar-brand">CTF Platform</div>
      <div className="navbar-menu">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/team">Team</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        {(user?.role === 'admin' || user?.role === 'organiser') && (
          <Link to="/admin">Admin</Link>
        )}
        <span style={{ color: '#666' }}>{user?.name}</span>
        <button className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  )
}
