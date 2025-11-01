import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import toast from 'react-hot-toast';

export default function ChallengeDetail({ challenge, onBack, userId, team }) {
  const [flag, setFlag] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  
  const submitFlag = useMutation(api.game.submitFlag);
  const startChallengeAttempt = useMutation(api.game.startChallengeAttempt);
  const activeAttempt = useQuery(
    api.game.getActiveChallengeAttempt,
    userId && challenge.isChallenge ? { userId, challengeId: challenge._id } : "skip"
  );
  
  // Fetch clues for this challenge
  const clues = useQuery(api.game.getCluesByPuzzle, { puzzleId: challenge._id });

  // Timer effect
  useEffect(() => {
    if (!activeAttempt || !challenge.isChallenge) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = activeAttempt.endsAt - now;
      
      if (remaining <= 0) {
        setTimeRemaining('⏰ EXPIRED');
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeAttempt, challenge.isChallenge]);

  const handleStartChallenge = async () => {
    const investment = Math.floor(challenge.pointsReward * 0.5);
    
    if (!confirm(`Start challenge? This will cost ${investment} points as investment.`)) {
      return;
    }

    try {
      await startChallengeAttempt({ userId, challengeId: challenge._id });
      toast.success('Challenge started! Timer is running.');
    } catch (error) {
      toast.error(error?.data || error?.message || 'Failed to start challenge');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim()) {
      toast.error('Please enter a flag');
      return;
    }

    try {
      const result = await submitFlag({
        userId,
        puzzleId: challenge._id,
        flag: flag.trim(),
      });
      
      if (result.message.includes('Correct')) {
        toast.success(`${result.message} +${result.pointsAwarded} points!`);
        setFlag('');
        setTimeout(() => onBack(), 1500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error?.data || error?.message || 'Submission failed');
    }
  };

  const difficultyColors = {
    very_easy: { border: '#0ff', label: 'Very Easy' },
    easy: { border: '#0f0', label: 'Easy' },
    medium: { border: '#ff0', label: 'Medium' },
    hard: { border: '#ffa500', label: 'Hard' },
    very_hard: { border: '#f00', label: 'Very Hard' },
  };

  const difficulty = challenge.difficulty || 'medium';
  const colors = difficultyColors[difficulty] || difficultyColors.medium;

  return (
    <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
      {/* Left Panel - Description & Media */}
      <div style={{
        flex: 1,
        background: 'rgba(0, 0, 0, 0.3)',
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '24px',
        overflowY: 'auto',
        maxHeight: '80vh'
      }}>
        <button
          onClick={onBack}
          className="btn btn-secondary"
          style={{ marginBottom: '20px' }}
        >
          ← Back to Challenges
        </button>

        <h2 style={{
          color: colors.border,
          marginBottom: '16px',
          textShadow: `0 0 10px ${colors.border}50`
        }}>
          {challenge.title}
        </h2>

        {/* Topic & Difficulty */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {challenge.topic && (
            <span style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#aaa'
            }}>
              📚 {challenge.topic}
            </span>
          )}
          <span style={{
            background: `${colors.border}20`,
            color: colors.border,
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            border: `1px solid ${colors.border}`
          }}>
            {colors.label}
          </span>
        </div>

        {/* Description/Clue */}
        <div style={{
          background: 'rgba(0, 255, 255, 0.05)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '18px' }}>
            📝 Challenge Description
          </h3>
          <div style={{
            color: '#fff',
            lineHeight: '1.8',
            fontSize: '16px',
            whiteSpace: 'pre-wrap',
            textShadow: '0 0 1px rgba(255, 255, 255, 0.5)'
          }}>
            {challenge.description || 'No description provided.'}
          </div>
        </div>

        {/* Clues Section */}
        {clues && clues.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 0, 0.05)',
            border: '1px solid rgba(255, 255, 0, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#ff0', marginBottom: '12px', fontSize: '18px' }}>
              💡 Available Clues
            </h3>
            {clues.map((clue, index) => (
              <div
                key={clue._id}
                style={{
                  background: 'rgba(255, 255, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#ff0', fontWeight: 'bold' }}>
                    💡 Clue {index + 1}
                  </span>
                  <span style={{ color: '#ff0', fontSize: '14px' }}>
                    {clue.cost} pts
                  </span>
                </div>
                <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>
                  {clue.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Images */}
        {challenge.imageUrls && challenge.imageUrls.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#0ff', marginBottom: '12px' }}>Images</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {challenge.imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Challenge image ${i + 1}`}
                  style={{
                    maxWidth: '100%',
                    borderRadius: '8px',
                    border: '2px solid rgba(0, 255, 255, 0.3)'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* File Downloads */}
        {challenge.fileUrls && challenge.fileUrls.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#0ff', marginBottom: '12px' }}>Downloads</h3>
            {challenge.fileUrls.map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: 'rgba(0, 255, 255, 0.1)',
                  border: '1px solid #0ff',
                  borderRadius: '8px',
                  color: '#0ff',
                  textDecoration: 'none',
                  marginBottom: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                }}
              >
                📎 {file.name}
              </a>
            ))}
          </div>
        )}

        {/* External Links */}
        {challenge.externalLinks && challenge.externalLinks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#0ff', marginBottom: '12px' }}>Links</h3>
            {challenge.externalLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: 'rgba(255, 0, 255, 0.1)',
                  border: '1px solid #f0f',
                  borderRadius: '8px',
                  color: '#f0f',
                  textDecoration: 'none',
                  marginBottom: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 0, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 0, 255, 0.1)';
                }}
              >
                🔗 {link.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Timer & Submission */}
      <div style={{
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Challenge Timer */}
        {challenge.isChallenge && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.2), rgba(255, 0, 128, 0.2))',
            border: '2px solid #ff00ff',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#ff00ff', marginBottom: '8px' }}>
              ⚡ CHALLENGE MODE
            </div>
            
            {activeAttempt ? (
              <>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: timeRemaining.includes('EXPIRED') ? '#f00' : '#ff00ff',
                  textShadow: '0 0 20px rgba(255, 0, 255, 0.8)',
                  fontFamily: 'monospace'
                }}>
                  {timeRemaining}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>
                  Time Remaining
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>
                  Investment: {Math.floor(challenge.pointsReward * 0.5)} pts
                </div>
                <div style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>
                  Timer: {challenge.challengeTimerMinutes || 10} minutes
                </div>
                <div style={{ fontSize: '16px', color: '#0f0', marginBottom: '16px', fontWeight: 'bold' }}>
                  Reward: {challenge.pointsReward * (challenge.challengePointsMultiplier || 2)}pts 
                  ({challenge.challengePointsMultiplier || 2}x)
                </div>
                <button
                  onClick={handleStartChallenge}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ff00ff, #ff0080)',
                    border: 'none',
                    fontSize: '16px',
                    padding: '12px'
                  }}
                >
                  Start Challenge
                </button>
              </>
            )}
          </div>
        )}

        {/* Points Display */}
        <div style={{
          background: 'rgba(255, 255, 0, 0.1)',
          border: '2px solid #ff0',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#ff0', marginBottom: '4px' }}>
            Reward
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ff0',
            textShadow: '0 0 10px rgba(255, 255, 0, 0.5)'
          }}>
            {challenge.isChallenge && challenge.challengePointsMultiplier
              ? `${challenge.pointsReward * challenge.challengePointsMultiplier}pts`
              : `${challenge.pointsReward}pts`
            }
          </div>
        </div>

        {/* Flag Submission */}
        <div style={{
          background: 'rgba(0, 255, 255, 0.05)',
          border: '2px solid #0ff',
          borderRadius: '12px',
          padding: '20px',
          flex: 1
        }}>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Submit Flag</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Enter flag here..."
              className="input"
              style={{
                width: '100%',
                marginBottom: '16px',
                fontFamily: 'monospace',
                padding: '16px',
                fontSize: '16px',
                minHeight: '56px'
              }}
              disabled={challenge.isChallenge && !activeAttempt}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={challenge.isChallenge && !activeAttempt}
            >
              {challenge.isChallenge && !activeAttempt ? 'Start Challenge First' : 'Submit Flag'}
            </button>
          </form>

          {challenge.isChallenge && !activeAttempt && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid #f00',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#f00',
              textAlign: 'center'
            }}>
              ⚠️ Start the challenge to submit flags
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
