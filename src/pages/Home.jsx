import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <div className="hero-content">
          <h1 className="hero-title">Start Your Cyber Adventure</h1>
          <p className="hero-subtitle">A fun and beginner-friendly cyber quest. Hack, solve, explore.</p>
          <div className="hero-actions">
            {user ? (
              <Link to="/onboarding" className="btn btn-primary btn-glow">Start the Heist</Link>
            ) : (
              <Link to="/signup" className="btn btn-primary btn-glow">Get Started</Link>
            )}
          </div>
        </div>
        <div className="floating-elements">
          <div className="pixel-hologram hologram-1">ACCESS_GRANTED</div>
          <div className="pixel-hologram hologram-2">{"FLAG{welcome}"}</div>
          <div className="pixel-hologram hologram-3">LEVEL_01</div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💻</div>
              <h3>Solve Challenges</h3>
              <p>Tackle cybersecurity puzzles and capture flags</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Earn Flags</h3>
              <p>Collect points and unlock achievements</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Level Up</h3>
              <p>Progress through increasingly difficult challenges</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏅</div>
              <h3>Compete</h3>
              <p>Climb the leaderboard and prove your skills</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Challenges Preview */}
      <section className="featured-challenges">
        <div className="container">
          <h2 className="section-title">Featured Challenges</h2>
          <div className="challenges-grid">
            <div className="challenge-card">
              <h3>Web Exploitation</h3>
              <div className="challenge-difficulty">
                <span className="badge badge-info">Easy</span>
              </div>
              <p>Learn basic web vulnerabilities and exploitation techniques.</p>
              <Link to="/dashboard" className="btn btn-primary btn-sm">Start Challenge</Link>
            </div>
            <div className="challenge-card">
              <h3>Cryptography</h3>
              <div className="challenge-difficulty">
                <span className="badge badge-warning">Medium</span>
              </div>
              <p>Decrypt messages and break encryption algorithms.</p>
              <Link to="/dashboard" className="btn btn-primary btn-sm">Start Challenge</Link>
            </div>
            <div className="challenge-card">
              <h3>Binary Exploitation</h3>
              <div className="challenge-difficulty">
                <span className="badge badge-danger">Hard</span>
              </div>
              <p>Master buffer overflows and memory corruption techniques.</p>
              <Link to="/dashboard" className="btn btn-primary btn-sm">Start Challenge</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="leaderboard-preview">
        <div className="container">
          <h2 className="section-title">Top Players</h2>
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <div>Rank</div>
              <div>Team</div>
              <div>Score</div>
            </div>
            <div className="leaderboard-row">
              <div className="rank">1</div>
              <div className="team">CyberNinjas</div>
              <div className="score">2,450 pts</div>
            </div>
            <div className="leaderboard-row">
              <div className="rank">2</div>
              <div className="team">HackStreet</div>
              <div className="score">2,180 pts</div>
            </div>
            <div className="leaderboard-row">
              <div className="rank">3</div>
              <div className="team">CodeBreakers</div>
              <div className="score">1,920 pts</div>
            </div>
          </div>
          <div className="text-center" style={{ marginTop: '20px' }}>
            <Link to="/leaderboard" className="btn btn-secondary">View Full Leaderboard</Link>
          </div>
        </div>
      </section>
    </div>
  )
}