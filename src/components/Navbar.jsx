import { Link } from 'react-router-dom'
import { MdOutlineLeaderboard } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import { RiTeamLine } from "react-icons/ri";
import { MdOutlineSportsScore } from "react-icons/md";
import { CgDanger } from "react-icons/cg";
import { useAuth } from '../context/AuthContext'
import { FaRegUser } from "react-icons/fa";
import { SlLogout } from "react-icons/sl";

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <div className="navbar">
      <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src="/GDGC logo.png" alt="GDGC Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
        Room-Style CTF
      </Link>
      <div className="navbar-menu">
        <Link style={{color:"white", fontSize:"0.7rem"}} to="/" className="nav-link"><FaHome className='' /> Home</Link>
        <Link style={{color:"white", fontSize:"0.7rem"}} to="/dashboard" className="nav-link"><MdOutlineSportsScore className='' style={{fontSize:"1rem"}} /> Challenges</Link>
        <Link style={{color:"white", fontSize:"0.7rem"}} to="/leaderboard" className="nav-link"><MdOutlineLeaderboard className='' style={{fontSize:"1rem"}} /> Leaderboard</Link>
        <Link style={{color:"white", fontSize:"0.7rem"}} to="/rules" className="nav-link"><CgDanger className='' style={{fontSize:"1rem",color:"white"}} /> Rules</Link>
        <Link style={{color:"white", fontSize:"0.7rem"}} to="/team" className="nav-link"><RiTeamLine className='' style={{fontSize:"1rem"}} /> Team</Link>
        {(user?.role === 'admin' || user?.role === 'organiser') && (
          <Link to="/admin" className="nav-link">⚙️ Admin</Link>
        )}
        {user ? (
          <>
            <span className="user-info"><FaRegUser className='' style={{fontSize:"1rem"}} /> {user?.name}</span>
            <button className="btn btn-secondary btn-pixel" onClick={logout}>
              <SlLogout className='' style={{fontSize:"1rem"}} /> Logout
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
