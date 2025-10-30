import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function Shop() {
  const { user } = useAuth()

  // Convex queries
  const perks = useQuery(api.game.getPerks)
  const userTeams = useQuery(api.teams.getUserTeams, user ? { userId: user.id } : 'skip')

  // Convex mutations
  const purchasePerkMutation = useMutation(api.game.purchasePerk)

  const team = userTeams?.[0] || null
  const loading = !perks || (user && !userTeams)

  const handleBuyPerk = async (perkId) => {
    try {
      await purchasePerkMutation({
        teamId: team.id,
        perkId: perkId
      })
      alert('Perk purchased successfully!')
    } catch (error) {
      alert(error.message || 'Failed to purchase perk')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="container">
        <div className="card">
          <h1>Shop</h1>
          <p style={{ marginTop: '8px' }}>
            <strong>Available Points:</strong> {team?.points_balance.toFixed(2) || 0}
          </p>
        </div>

        <div className="grid grid-3">
          {perks?.map((perk) => (
            <div key={perk.id} className="card">
              <h3>{perk.name}</h3>
              <p style={{ margin: '12px 0', color: '#666', minHeight: '60px' }}>
                {perk.description}
              </p>
              <div style={{ marginBottom: '12px' }}>
                <span className="badge badge-warning">{perk.cost} points</span>
                <span className={`badge badge-${perk.effect_type === 'attack' ? 'danger' : perk.effect_type === 'defense' ? 'success' : 'info'}`} style={{ marginLeft: '8px' }}>
                  {perk.effect_type}
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleBuyPerk(perk.id)}
                disabled={!team || team.points_balance < perk.cost}
              >
                Purchase
              </button>
            </div>
          ))}
        </div>

        {(!perks || perks.length === 0) && (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#666' }}>No perks available</p>
          </div>
        )}
      </div>
    </div>
  )
}
