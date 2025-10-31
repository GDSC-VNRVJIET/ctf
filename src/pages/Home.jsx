import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-hero-fullscreen">
      <div className="hero-background"></div>
      <div className="hero-content">
        <h1 className="hero-title">Convergence Heist</h1>
        <p className="hero-subtitle">Assemble your crew. Plan the ultimate cyber heist.</p>
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
    </div>
  );
}