import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorHandler';
import ChallengeGrid from '../components/ChallengeGrid';
import ChallengeDetail from '../components/ChallengeDetail';

export default function RoomView() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'detail'

  const room = useQuery(api.game.getRoom, userId && roomId ? { userId, roomId } : 'skip');
  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : 'skip');

  // Mutation for unlocking room
  const unlockRoom = useMutation(api.game.unlockRoom);

  // Select first puzzle when room loads successfully
  useEffect(() => {
    if (room?.puzzles?.length > 0 && !selectedPuzzle) {
      setSelectedPuzzle(room.puzzles[0]);
    }
  }, [room, selectedPuzzle]);

  // Get room intro from database brief or fallback to default
  const getRoomIntro = (room) => {
    const defaultIntros = {
      Lobby: {
        title: 'ENTRY POINT',
        description:
          "You're outside the massive corporate building. The target is within reach. This is where it all begins.",
        story:
          'Security cameras sweep the perimeter. Guards patrol the entrance. This is your first obstacle. Use your skills wisely.',
      },
      'Server Room': {
        title: 'THE DIGITAL VAULT',
        description:
          "You've breached the outer defenses. Now comes the real challenge - the server room.",
        story:
          'Racks of servers hum with data. Each one holds secrets worth stealing. But the real treasure lies deeper.',
      },
      'CEO Office': {
        title: 'THE PRIZE',
        description:
          "The final target. The CEO's office contains the crown jewels of this heist.",
        story:
          'Private documents, encrypted drives, classified information. Everything is here. But getting out alive is another matter.',
      },
    };

    // If room has a custom brief, use it
    if (room?.brief) {
      return {
        title: room.name,
        description: room.description || 'Enter the room',
        story: room.brief,
      };
    }

    // Otherwise fall back to defaults
    return defaultIntros[room?.name] || {
      title: 'UNKNOWN TERRITORY',
      description: "You've entered an uncharted part of the target building.",
      story: 'Proceed with caution. Every step could be your last.',
    };
  };

  const handleUnlockRoom = async () => {
    if (!userId) {
      toast.error('Please log in first');
      return;
    }

    try {
      await unlockRoom({ userId, roomId });
      toast.success('Room unlocked!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to unlock room'));
    }
  };

  const loading = room === undefined || team === undefined;
  if (loading) return <div className="loading">Loading...</div>;

  // Handle room access errors (Room not found or not unlocked)
  if (!room) {
    toast.error('This room is not accessible. Complete previous rooms first!');
    navigate(-1);
    return null;
  }

  const canAccess = !team?.currentRoomId || team.currentRoomId === roomId;
  const roomIntro = getRoomIntro(room);

  if (showIntro && canAccess) {
    return (
      <div className="modal-overlay" onClick={() => setShowIntro(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{roomIntro.title}</h2>
          </div>
          <div className="modal-content">
            <h3 style={{ color: '#8EFF8B', marginBottom: '16px' }}>{room.name}</h3>
            <p style={{ color: '#B388FF', marginBottom: '16px', lineHeight: '1.6' }}>
              {roomIntro.description}
            </p>
            <p style={{ color: '#00E5FF', marginBottom: '20px', lineHeight: '1.6', fontStyle: 'italic' }}>
              {roomIntro.story}
            </p>
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowIntro(false)}>
                Enter Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-view">
      <div className="container">
        <div className="card room-header">
          <div className="room-info">
            <h1 className="room-title">{room.name}</h1>
            <p className="room-description">{room.description}</p>
          </div>
          <div className="room-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowIntro(true)}
              style={{ fontSize: '10px', padding: '8px 16px' }}
            >
              Room Brief
            </button>
          </div>
        </div>

        {!canAccess && (
          <div className="card room-locked">
            <h3>Access Required</h3>
            <p>You need to unlock this room first.</p>
            <button className="btn btn-primary" onClick={handleUnlockRoom}>
              Unlock Room ({room.unlockCost} points)
            </button>
          </div>
        )}

        {canAccess && (
          <div className="card">
            {viewMode === 'grid' ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ color: '#0ff', marginBottom: '8px' }}>Challenges</h2>
                  <p style={{ color: '#aaa' }}>Select a challenge to view details and submit your solution</p>
                </div>
                <ChallengeGrid
                  challenges={room.puzzles || []}
                  onSelect={(challenge) => {
                    setSelectedPuzzle(challenge);
                    setViewMode('detail');
                  }}
                  solvedChallengeIds={room.solvedPuzzleIds || []}
                />
              </>
            ) : (
              selectedPuzzle && (
                <ChallengeDetail
                  challenge={selectedPuzzle}
                  onBack={() => {
                    setViewMode('grid');
                    setSelectedPuzzle(null);
                  }}
                  userId={userId}
                  team={team}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}


