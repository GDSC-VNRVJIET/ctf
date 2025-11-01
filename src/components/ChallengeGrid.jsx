export default function ChallengeGrid({ challenges, onSelect, solvedChallengeIds = [] }) {
  const difficultyColors = {
    very_easy: { bg: 'rgba(0, 255, 255, 0.1)', border: '#0ff', label: 'Very Easy' },
    easy: { bg: 'rgba(0, 255, 0, 0.1)', border: '#0f0', label: 'Easy' },
    medium: { bg: 'rgba(255, 255, 0, 0.1)', border: '#ff0', label: 'Medium' },
    hard: { bg: 'rgba(255, 165, 0, 0.1)', border: '#ffa500', label: 'Hard' },
    very_hard: { bg: 'rgba(255, 0, 0, 0.1)', border: '#f00', label: 'Very Hard' },
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
      padding: '20px 0'
    }}>
      {challenges.map((challenge) => {
        const isSolved = solvedChallengeIds.includes(challenge._id);
        const difficulty = challenge.difficulty || 'medium';
        const colors = difficultyColors[difficulty] || difficultyColors.medium;
        const isChallenge = challenge.isChallenge;

        return (
          <div
            key={challenge._id}
            onClick={() => onSelect(challenge)}
            style={{
              background: isSolved ? 'rgba(0, 255, 0, 0.05)' : colors.bg,
              border: `2px solid ${isSolved ? '#0f0' : colors.border}`,
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${colors.border}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Challenge badge */}
            {isChallenge && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'linear-gradient(135deg, #ff00ff, #ff0080)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255, 0, 255, 0.8)',
              }}>
                ⚡ CHALLENGE
              </div>
            )}

            {/* Solved badge */}
            {isSolved && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0, 255, 0, 0.2)',
                color: '#0f0',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>
                ✓ SOLVED
              </div>
            )}

            <div style={{ marginTop: isChallenge || isSolved ? '30px' : '0' }}>
              <h3 style={{
                color: isSolved ? '#0f0' : colors.border,
                marginBottom: '8px',
                fontSize: '20px',
                textShadow: `0 0 10px ${colors.border}50`
              }}>
                {challenge.title}
              </h3>

              {/* Topic */}
              {challenge.topic && (
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '12px',
                  color: '#aaa'
                }}>
                  {challenge.topic}
                </div>
              )}

              <p style={{
                color: '#aaa',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '16px',
                maxHeight: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {challenge.description}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {/* Difficulty badge */}
                <span style={{
                  background: colors.bg,
                  color: colors.border,
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: `1px solid ${colors.border}`
                }}>
                  {colors.label}
                </span>

                {/* Points */}
                <span style={{
                  color: '#ff0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(255, 255, 0, 0.5)'
                }}>
                  {isChallenge && challenge.challengePointsMultiplier
                    ? `${challenge.pointsReward * challenge.challengePointsMultiplier}pts (${challenge.challengePointsMultiplier}x)`
                    : `${challenge.pointsReward}pts`
                  }
                </span>
              </div>

              {/* Challenge timer info */}
              {isChallenge && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  background: 'rgba(255, 0, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#ff00ff',
                  textAlign: 'center'
                }}>
                  ⏱️ {challenge.challengeTimerMinutes || 10} min timer • 
                  {Math.floor(challenge.pointsReward * 0.5)}pts investment
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
