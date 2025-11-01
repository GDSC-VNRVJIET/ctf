import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'
import LeaderboardSidebar from './LeaderboardSidebar'

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { userId } = useAuth()

  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : "skip")
  const leaderboard = useQuery(api.game.getLeaderboard)

  return (
    <div className="main-layout">
      <Navbar />
      <LeaderboardSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        leaderboard={leaderboard}
        myTeam={team}
        userId={userId}
      />
      <div 
        className="main-content"
        style={{
          marginRight: sidebarOpen ? '350px' : '0',
          transition: 'margin-right 0.3s ease',
          width: '100%'
        }}
      >
        {children}
      </div>
    </div>
  )
}