import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import logo from '/logo.png'

const ORANGE = '#E8761A'

type Player = {
  id: number
  name: string
  gender: string
  tier: number
  sold_to_team: string | null
  sold_price: number | null
}

type Team = {
  id: number
  name: string
  purse: number
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()

    const subscription = supabase
      .channel('teams_page_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'players'
      }, payload => {
        const updated = payload.new as Player
        setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'teams'
      }, payload => {
        const updated = payload.new as Team
        setTeams(prev => prev.map(t => t.id === updated.id ? updated : t))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  async function fetchData() {
    const { data: teamData } = await supabase.from('teams').select('*').order('id')
    const { data: playerData } = await supabase.from('players').select('*')
    if (teamData) setTeams(teamData)
    if (playerData) setPlayers(playerData)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#555', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '13px' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#000000',
      color: 'white',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '40px',
      boxSizing: 'border-box'
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <img src={logo} alt="ABA" style={{ width: '72px', marginBottom: '16px' }} />
        <h1 style={{ color: ORANGE, fontSize: '36px', margin: '0 0 8px 0', letterSpacing: '2px' }}>ABA 9.0</h1>
        <p style={{ color: '#444', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', margin: 0 }}>
          Team Rosters
        </p>
      </div>

      {/* Team Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {teams.map(team => {
          const roster = players.filter(p => p.sold_to_team === team.name)
          const spent = 120000000 - team.purse

          return (
            <div key={team.id} style={{
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: '12px',
              padding: '24px',
              transition: 'border-color 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
            >
              {/* Team Header */}
              <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #1e1e1e' }}>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'white', fontWeight: '600' }}>
                  {team.name}
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: team.purse < 20000000 ? '#c0392b' : ORANGE
                  }}>
                    ₹{(team.purse / 1000000).toFixed(1)}M remaining
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>
                    {roster.length} players
                  </p>
                </div>
              </div>

              {/* Roster */}
              {roster.length === 0 ? (
                <p style={{ color: '#2a2a2a', fontSize: '13px', margin: 0 }}>No players yet</p>
              ) : (
                roster.map(player => (
                  <div key={player.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '7px 0',
                    borderBottom: '1px solid #161616',
                  }}>
                    <span style={{ color: '#ccc', fontSize: '13px' }}>{player.name}</span>
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      {player.gender} T{player.tier} &nbsp;·&nbsp; ₹{player.sold_price ? (player.sold_price / 1000000).toFixed(1) : 0}M
                    </span>
                  </div>
                ))
              )}

              {/* Total spent */}
              {roster.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #1e1e1e' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888', textAlign: 'right' }}>
                    Total spent: ₹{(spent / 1000000).toFixed(1)}M
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}