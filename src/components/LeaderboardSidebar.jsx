import { useState, useEffect } from 'react';

export default function LeaderboardSidebar({ isOpen, onToggle, leaderboard, myTeam }) {
  // Group teams by room tier
  const groupedTeams = {};
  
  if (leaderboard) {
    leaderboard.forEach(team => {
      const tier = `Room ${team.roomIndex || 0}`;
      if (!groupedTeams[tier]) {
        groupedTeams[tier] = [];
      }
      groupedTeams[tier].push(team);
    });

    // Sort within each tier by points
    Object.keys(groupedTeams).forEach(tier => {
      groupedTeams[tier].sort((a, b) => b.points - a.points);
    });
  }

  const tiers = Object.keys(groupedTeams).sort((a, b) => {
    const aNum = parseInt(a.replace('Room ', ''));
    const bNum = parseInt(b.replace('Room ', ''));
    return bNum - aNum; // Highest room first
  });

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '350px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(135deg, #0ff, #00a8a8)',
          border: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '20px 12px',
          cursor: 'pointer',
          zIndex: 1001,
          color: '#000',
          fontWeight: 'bold',
          fontSize: '18px',
          boxShadow: '-4px 0 20px rgba(0, 255, 255, 0.3)',
          transition: 'right 0.3s ease',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
      >
        {isOpen ? '→' : '←'} LEADERBOARD
      </button>

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          right: isOpen ? '0' : '-350px',
          top: '0',
          width: '350px',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 60, 0.95))',
          borderLeft: '2px solid #0ff',
          boxShadow: '-4px 0 20px rgba(0, 255, 255, 0.1)',
          transition: 'right 0.3s ease',
          zIndex: 1000,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px'
        }}
      >
        <h2 style={{
          color: '#0ff',
          marginBottom: '20px',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
          fontSize: '24px',
          borderBottom: '2px solid #0ff',
          paddingBottom: '10px'
        }}>
          🏆 LEADERBOARD
        </h2>

        {tiers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#aaa',
            padding: '40px 20px'
          }}>
            No teams yet
          </div>
        ) : (
          tiers.map(tier => (
            <div key={tier} style={{ marginBottom: '30px' }}>
              <h3 style={{
                color: '#ff00ff',
                fontSize: '16px',
                marginBottom: '12px',
                textShadow: '0 0 10px rgba(255, 0, 255, 0.5)',
                borderBottom: '1px solid rgba(255, 0, 255, 0.3)',
                paddingBottom: '6px'
              }}>
                {tier}
              </h3>

              {groupedTeams[tier].map((team, index) => {
                const isMyTeam = myTeam && team.teamId === myTeam._id;
                const rankInTier = index + 1;
                
                return (
                  <div
                    key={team.teamId}
                    style={{
                      background: isMyTeam 
                        ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 200, 200, 0.2))'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isMyTeam ? '2px solid #0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMyTeam) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMyTeam) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                  >
                    {/* Rank */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: rankInTier <= 3 
                        ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: rankInTier <= 3 ? '#000' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      flexShrink: 0,
                      border: rankInTier <= 3 ? '2px solid #ffed4e' : 'none'
                    }}>
                      {rankInTier <= 3 ? ['🥇', '🥈', '🥉'][rankInTier - 1] : rankInTier}
                    </div>

                    {/* Team Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: isMyTeam ? '#0ff' : '#fff',
                        fontWeight: isMyTeam ? 'bold' : 'normal',
                        fontSize: '14px',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {team.name}
                        {isMyTeam && (
                          <span style={{
                            marginLeft: '6px',
                            fontSize: '10px',
                            color: '#0ff',
                            textShadow: '0 0 5px rgba(0, 255, 255, 0.5)'
                          }}>
                            (YOU)
                          </span>
                        )}
                      </div>
                      <div style={{
                        color: '#ff0',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        {team.points.toFixed(0)} pts
                      </div>
                    </div>

                    {/* Shield/Immunity indicators */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      {team.hasShield && (
                        <span style={{
                          fontSize: '16px',
                          filter: 'drop-shadow(0 0 4px rgba(0, 255, 255, 0.8))'
                        }}>
                          🛡️
                        </span>
                      )}
                      {team.hasImmunity && (
                        <span style={{
                          fontSize: '16px',
                          filter: 'drop-shadow(0 0 4px rgba(255, 0, 255, 0.8))'
                        }}>
                          ✨
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Footer */}
        <div style={{
          marginTop: '30px',
          padding: '16px',
          background: 'rgba(0, 255, 255, 0.05)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#aaa'
        }}>
          🛡️ = Shield Active<br />
          ✨ = Immunity Active<br />
          Real-time updates
        </div>
      </div>
    </>
  );
}
