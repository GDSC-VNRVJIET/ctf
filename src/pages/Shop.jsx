import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'

export default function Shop() {
  const { userId } = useAuth()

  const perks = useQuery(api.game.getPerks)
  const team = useQuery(api.teams.getMyTeam, userId ? { userId } : "skip")

  const buyPerk = useMutation(api.game.buyPerk)

  const handleBuyPerk = async (perkId) => {
    if (!userId) {
      alert('Please log in first')
      return
    }

    try {
      const result = await buyPerk({ userId, perkId })
      alert(result.message || 'Perk purchased successfully!')
    } catch (error) {
      alert(error?.message || 'Failed to purchase perk')
    }
  }

  const loading = perks === undefined || team === undefined
  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="container">
        <div className="card">
          <h1>Shop</h1>
          <p style={{ marginTop: '8px' }}>
            <strong>Available Points:</strong> {team?.pointsBalance?.toFixed(2) || 0}
          </p>
        </div>

        <div className="grid grid-3">
          {perks && perks.map((perk) => (
            <div key={perk._id} className="card">
              <h3>{perk.name}</h3>
              <p style={{ margin: '12px 0', color: '#666', minHeight: '60px' }}>
                {perk.description}
              </p>
              <div style={{ marginBottom: '12px' }}>
                <span className="badge badge-warning">{perk.cost} points</span>
                {perk.isOneTime && (
                  <span className="badge badge-info" style={{ marginLeft: '8px' }}>
                    One-time
                  </span>
                )}
                <span className={`badge badge-${perk.perkType === 'attack' ? 'danger' : perk.perkType === 'defense' ? 'success' : 'info'}`} style={{ marginLeft: '8px' }}>
                  {perk.perkType}
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleBuyPerk(perk._id)}
                disabled={!team || team.pointsBalance < perk.cost}
              >
                Purchase
              </button>
            </div>
          ))}
        </div>

        {perks && perks.length === 0 && (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#666' }}>No perks available</p>
          </div>
        )}
      </div>
    </div>
  )
}
