import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

export default function Shop() {
  const [perks, setPerks] = useState([])
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [perksRes, teamRes] = await Promise.all([
        axios.get('/api/perks'),
        axios.get('/api/teams/my/team')
      ])
      setPerks(perksRes.data)
      setTeam(teamRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyPerk = async (perkId) => {
    try {
      await axios.post(`/api/perks/${perkId}/buy`)
      alert('Perk purchased successfully!')
      fetchData()
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to purchase perk')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <h1>Shop</h1>
          <p style={{ marginTop: '8px' }}>
            <strong>Available Points:</strong> {team?.points_balance.toFixed(2) || 0}
          </p>
        </div>

        <div className="grid grid-3">
          {perks.map((perk) => (
            <div key={perk.id} className="card">
              <h3>{perk.name}</h3>
              <p style={{ margin: '12px 0', color: '#666', minHeight: '60px' }}>
                {perk.description}
              </p>
              <div style={{ marginBottom: '12px' }}>
                <span className="badge badge-warning">{perk.cost} points</span>
                {perk.is_one_time && (
                  <span className="badge badge-info" style={{ marginLeft: '8px' }}>
                    One-time
                  </span>
                )}
                <span className={`badge badge-${perk.perk_type === 'attack' ? 'danger' : perk.perk_type === 'defense' ? 'success' : 'info'}`} style={{ marginLeft: '8px' }}>
                  {perk.perk_type}
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

        {perks.length === 0 && (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#666' }}>No perks available</p>
          </div>
        )}
      </div>
    </div>
  )
}
