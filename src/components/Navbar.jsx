import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <div className="navbar">
      <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src="/GDGC logo.png" alt="GDGC Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
        Room-Style CTF
      </Link>
      <div className="navbar-menu">
        <Link to="/" className="nav-link">🏠 Home</Link>
        <Link to="/dashboard" className="nav-link">🎯 Challenges</Link>
        <Link to="/leaderboard" className="nav-link">🏆 Leaderboard</Link>
        <Link to="/rules" className="nav-link">📋 Rules</Link>
        <Link to="/team" className="nav-link">👥 Team</Link>
        <Link to="/shop" className="nav-link">🛒 Shop</Link>
        {(user?.role === 'admin' || user?.role === 'organiser') && (
          <Link to="/admin" className="nav-link">⚙️ Admin</Link>
        )}
        {user ? (
          <>
            <span className="user-info">👤 {user?.name}</span>
            <button className="btn btn-secondary btn-pixel" onClick={logout}>
              🚪 Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">🔐 Login</Link>
            <Link to="/signup" className="btn btn-primary btn-pixel">🎮 Sign Up</Link>
          </>
        )}
      </div>
    </div>
  )
}
