import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import toast from 'react-hot-toast';

export default function ChallengeDetail({ challenge, onBack, userId, team }) {
  const [flag, setFlag] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  const submitFlag = useMutation(api.game.submitFlag);
  const startChallengeAttempt = useMutation(api.game.startChallengeAttempt);
  const buyClue = useMutation(api.game.buyClue);
  const activeAttempt = useQuery(
    api.game.getActiveChallengeAttempt,
    userId && challenge.isChallenge ? { userId, challengeId: challenge._id } : "skip"
  );

  const clues = useQuery(
    api.game.getPurchasedClues,
    userId ? { userId, puzzleId: challenge._id } : "skip"
  );

  const submissionStatus = useQuery(
    api.game.getSubmissionStatus,
    userId && team ? { userId, puzzleId: challenge._id } : "skip"
  );

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

  const handleBuyClue = async (clueId) => {
    try {
      const result = await buyClue({ userId, clueId });
      toast.success(result.message || 'Clue purchased!');
    } catch (error) {
      toast.error(error?.data || error?.message || 'Failed to buy clue');
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
          textShadow: `0 0 10px ${colors.border}50`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {challenge.title}
          {submissionStatus?.isAlreadySolved && (
            <span style={{
              background: 'linear-gradient(135deg, #0f0, #00aa00)',
              color: '#000',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
            }}>
              SOLVED
            </span>
          )}
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
                  background: clue.isPurchased
                    ? 'rgba(0, 255, 0, 0.1)'
                    : clue.canPurchase
                      ? 'rgba(255, 255, 0, 0.1)'
                      : 'rgba(128, 128, 128, 0.1)',
                  border: `1px solid ${clue.isPurchased
                    ? 'rgba(0, 255, 0, 0.3)'
                    : clue.canPurchase
                      ? 'rgba(255, 255, 0, 0.3)'
                      : 'rgba(128, 128, 128, 0.3)'
                    }`,
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px',
                  opacity: clue.isPurchased || clue.canPurchase ? 1 : 0.6
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: clue.isPurchased ? '8px' : '0px'
                }}>
                  <span style={{
                    color: clue.isPurchased ? '#0f0' : clue.canPurchase ? '#ff0' : '#888',
                    fontWeight: 'bold'
                  }}>
                    💡 Clue {index + 1}
                    {clue.isPurchased && ' ✅'}
                    {!clue.isPurchased && !clue.canPurchase && ' 🔒'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      color: clue.isPurchased ? '#0f0' : clue.canPurchase ? '#ff0' : '#888',
                      fontSize: '14px'
                    }}>
                      {clue.cost} pts
                    </span>
                    {clue.canPurchase && (
                      <button
                        onClick={() => handleBuyClue(clue._id)}
                        style={{
                          background: 'linear-gradient(135deg, #ff0, #ffa500)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          color: '#000',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Buy
                      </button>
                    )}
                  </div>
                </div>
                {clue.isPurchased && clue.text && (
                  <div style={{
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    background: 'rgba(0, 255, 0, 0.1)',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 255, 0, 0.2)'
                  }}>
                    {clue.text}
                  </div>
                )}
                {!clue.isPurchased && !clue.canPurchase && (
                  <div style={{
                    color: '#888',
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}>
                    Purchase previous clues first
                  </div>
                )}
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
          background: submissionStatus?.isAlreadySolved
            ? 'rgba(0, 255, 0, 0.05)'
            : 'rgba(0, 255, 255, 0.05)',
          border: submissionStatus?.isAlreadySolved
            ? '2px solid #0f0'
            : '2px solid #0ff',
          borderRadius: '12px',
          padding: '20px',
          flex: 1
        }}>
          <h3 style={{
            color: submissionStatus?.isAlreadySolved ? '#0f0' : '#0ff',
            marginBottom: '16px'
          }}>
            {submissionStatus?.isAlreadySolved ? 'Already Submitted' : 'Submit Flag'}
          </h3>

          {submissionStatus?.isAlreadySolved ? (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 200, 0, 0.05))',
              border: '2px solid #0f0',
              borderRadius: '12px',
              color: '#0f0',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '8px',
                textShadow: '0 0 5px rgba(0, 255, 0, 0.3)'
              }}>
                Challenge Solved!
              </div>
              <div style={{
                fontSize: '14px',
                opacity: 0.9,
                marginBottom: '12px',
                fontFamily: 'monospace'
              }}>
                Completed: {submissionStatus?.solvedAt ? new Date(submissionStatus.solvedAt).toLocaleDateString() + ' at ' + new Date(submissionStatus.solvedAt).toLocaleTimeString() : 'Unknown'}
              </div>
              <div style={{
                background: 'rgba(0, 255, 0, 0.2)',
                border: '1px solid #0f0',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                🎯 Points Earned: {challenge.isChallenge && challenge.challengePointsMultiplier
                  ? `${challenge.pointsReward * challenge.challengePointsMultiplier}pts`
                  : `${challenge.pointsReward}pts`
                }
              </div>
            </div>
          ) : (
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
          )}

          {challenge.isChallenge && !activeAttempt && !submissionStatus?.isAlreadySolved && (
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
