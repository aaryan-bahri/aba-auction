import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import logo from '/logo.png'

const ORANGE = '#E8761A'

type Player = {
  id: number
  name: string
  gender: string
  tier: number
  notes: string
  sold: boolean
  final_call: boolean
  sold_to_team: string | null
  sold_price: number | null
}

type Team = {
  id: number
  name: string
  purse: number
}

const ROUNDS = [
  { label: 'Round 1', sublabel: 'NCM T1 & T2', gender: 'NCM', tiers: [1, 2] },
  { label: 'Round 2', sublabel: 'NCM T3 & T4', gender: 'NCM', tiers: [3, 4] },
  { label: 'Round 3', sublabel: 'CM T1 & T2',  gender: 'CM',  tiers: [1, 2] },
  { label: 'Round 4', sublabel: 'CM T3 & T4',  gender: 'CM',  tiers: [3, 4] },
]

const ADMIN_PIN = '1234'

export default function Admin() {
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRound, setActiveRound] = useState<number | null>(null)
  const [isFinalCall, setIsFinalCall] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [bidPrice, setBidPrice] = useState<number | ''>('')
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('')
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: playerData } = await supabase.from('players').select('*')
    const { data: teamData } = await supabase.from('teams').select('*').order('id')
    if (playerData) setPlayers(playerData)
    if (teamData) setTeams(teamData)
    setLoading(false)
  }

  async function updateAuctionState(updates: object) {
    await supabase.from('auction_state').update(updates).eq('id', 1)
  }

  function effectivePurse(team: Team): number {
  const rosterSize = players.filter(p => p.sold_to_team === team.name).length
  const requiredReserve = Math.max(0, (6 - rosterSize) - 1) * 1000000
  return team.purse - requiredReserve
}

  function pickRandomPlayer(roundIndex: number, finalCall: boolean) {
    const round = ROUNDS[roundIndex]
    const pool = players.filter(p =>
      p.gender === round.gender &&
      round.tiers.includes(p.tier) &&
      !p.sold &&
      p.final_call === finalCall
    )

    if (pool.length === 0) {
      alert(finalCall
        ? 'No players left in Final Call for this round!'
        : 'All players in this round have been seen! Use Final Call to re-auction unsold players.'
      )
      return
    }

    const random = pool[Math.floor(Math.random() * pool.length)]
    setCurrentPlayer(random)
    setActiveRound(roundIndex)
    setIsFinalCall(finalCall)
    setBidPrice('')
    setSelectedTeamId('')

    updateAuctionState({
      current_player_id: random.id,
      current_round: roundIndex,
      current_bid: 0,
      bidding_team: null,
      is_final_call: finalCall,
      status: null
    })
  }

  async function handleSold() {
    if (!currentPlayer) return alert('No player selected!')
    if (!bidPrice) return alert('Enter a bid price!')
    if (!selectedTeamId) return alert('Select a team!')

    const team = teams.find(t => t.id === Number(selectedTeamId))
    if (!team) return

    if (Number(bidPrice) * 1000000 > 115000000) {
      return alert('No player can be sold for more than ₹115M!')
    }

    if (Number(bidPrice) * 1000000 > effectivePurse(team)) {
      const rosterSize = players.filter(p => p.sold_to_team === team.name).length
      const reserve = Math.max(0, (6 - rosterSize) - 1)
      return alert(`${team.name} can't afford this bid! They must keep ₹${reserve}M in reserve for remaining roster spots.`)
    }

    const { error: playerError } = await supabase.from('players').update({
      sold: true,
      sold_to_team: team.name,
      sold_price: Number(bidPrice) * 1000000,
    }).eq('id', currentPlayer.id)

    const { error: teamError } = await supabase.from('teams').update({
      purse: team.purse - Number(bidPrice) * 1000000
    }).eq('id', team.id)

    if (playerError) console.error('Player update failed:', playerError)
    if (teamError) console.error('Team update failed:', teamError)

    setPlayers(prev => prev.map(p =>
      p.id === currentPlayer.id
        ? { ...p, sold: true, sold_to_team: team.name, sold_price: Number(bidPrice) * 1000000 }
        : p
    ))
    setTeams(prev => prev.map(t =>
      t.id === team.id ? { ...t, purse: t.purse - Number(bidPrice) * 1000000 } : t
    ))

    await updateAuctionState({ status: 'sold' })
    setCurrentPlayer(null)
    setBidPrice('')
    setSelectedTeamId('')
  }

  async function handleUnsold() {
    if (!currentPlayer) return alert('No player selected!')

    if (isFinalCall) {
      await supabase.from('players').update({ final_call: false }).eq('id', currentPlayer.id)
      setPlayers(prev => prev.map(p =>
        p.id === currentPlayer.id ? { ...p, final_call: false } : p
      ))
    } else {
      await supabase.from('players').update({ final_call: true }).eq('id', currentPlayer.id)
      setPlayers(prev => prev.map(p =>
        p.id === currentPlayer.id ? { ...p, final_call: true } : p
      ))
    }

    await updateAuctionState({ status: 'unsold' })
    setCurrentPlayer(null)
    setBidPrice('')
    setSelectedTeamId('')
  }

  // PIN screen
  if (!unlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', sans-serif",
        boxSizing: 'border-box'
      }}>
        <img src = {logo} alt="ABA Logo" style={{ width: '100px', marginBottom: '24px' }} />
        <div style={{
          background: '#1a1a1a',
          border: `1px solid ${ORANGE}`,
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          minWidth: '320px'
        }}>
          <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '22px' }}>Admin Access</h2>
          <p style={{ color: '#555', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 32px 0' }}>
            Enter PIN to continue
          </p>
          <input
            type="password"
            placeholder="• • • •"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (pin === ADMIN_PIN) setUnlocked(true)
                else { alert('Incorrect PIN'); setPin('') }
              }
            }}
            style={{
              fontSize: '28px',
              padding: '12px',
              width: '100%',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#000000',
              color: 'white',
              textAlign: 'center',
              boxSizing: 'border-box',
              marginBottom: '16px',
              outline: 'none',
              letterSpacing: '8px'
            }}
          />
          <button
            onClick={() => {
              if (pin === ADMIN_PIN) setUnlocked(true)
              else { alert('Incorrect PIN'); setPin('') }
            }}
            style={{
              width: '100%',
              padding: '14px',
              background: ORANGE,
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            Unlock
          </button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#555', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '13px' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#000000' }}>

      {/* LEFT SIDEBAR */}
      <div style={{
        width: '210px',
        background: '#111',
        borderRight: '1px solid #1e1e1e',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto'
      }}>
        <img src={logo} alt="ABA" style={{ width: '60px', margin: '0 auto 20px auto', display: 'block' }} />
        <p style={{ color: '#444', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 8px 4px' }}>Rounds</p>
        {ROUNDS.map((round, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            <button
              onClick={() => pickRandomPlayer(i, false)}
              style={{
                padding: '10px 12px',
                background: activeRound === i && !isFinalCall ? ORANGE : 'transparent',
                color: activeRound === i && !isFinalCall ? 'white' : '#aaa',
                border: `1px solid ${activeRound === i && !isFinalCall ? ORANGE : '#2a2a2a'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {round.label} — {round.sublabel}
            </button>
            <button
              onClick={() => pickRandomPlayer(i, true)}
              style={{
                padding: '8px 12px',
                background: activeRound === i && isFinalCall ? '#3a1a05' : 'transparent',
                color: activeRound === i && isFinalCall ? ORANGE : '#555',
                border: `1px solid ${activeRound === i && isFinalCall ? ORANGE : '#222'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '11px',
              }}
            >
              Final Call R{i + 1}
            </button>
          </div>
        ))}
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, padding: '40px', background: '#000000', overflowY: 'auto' }}>
        <p style={{ color: '#444', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 24px 0' }}>
          {activeRound !== null
            ? `${isFinalCall ? 'Final Call — ' : ''}${ROUNDS[activeRound].label} — ${ROUNDS[activeRound].sublabel}`
            : 'Select a round to begin'}
        </p>

        {/* Player Card */}
        <div style={{
          background: '#1a1a1a',
          border: `1px solid ${currentPlayer ? ORANGE : '#222'}`,
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
        }}>
          {currentPlayer ? (
            <>
              <h1 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '36px', fontWeight: '700' }}>
                {currentPlayer.name}
              </h1>
              <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}>
                {currentPlayer.gender} &nbsp;·&nbsp; Tier {currentPlayer.tier}
              </p>
              {currentPlayer.notes && (
                <p style={{ color: '#555', margin: 0, fontSize: '13px' }}>{currentPlayer.notes}</p>
              )}
            </>
          ) : (
            <p style={{ color: '#333', margin: 0, fontSize: '16px' }}>Select a round to pick a player</p>
          )}
        </div>

        {/* Bidding Controls */}
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '28px',
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ color: '#555', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Current Bid (M)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input
                type="number"
                placeholder="0"
                value={bidPrice}
                onChange={e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value)
                  setBidPrice(val)
                  if (val !== '') updateAuctionState({ current_bid: Number(val) * 1000000 })
                }}
                style={{
                  fontSize: '28px',
                  width: '140px',
                  padding: '10px 12px',
                  color: 'white',
                  background: '#000000',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '18px', color: '#555' }}>M</span>
            </div>
            {bidPrice !== '' && (
              <p style={{ color: '#444', fontSize: '12px', margin: '6px 0 0 0' }}>
                = ₹{(Number(bidPrice) * 1000000).toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label style={{ color: '#555', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Bidding Team
            </label>
            <div style={{ marginTop: '8px' }}>
              <select
                value={selectedTeamId}
                onChange={e => {
                  setSelectedTeamId(Number(e.target.value))
                  const team = teams.find(t => t.id === Number(e.target.value))
                  if (team) updateAuctionState({ bidding_team: team.name })
                }}
                style={{
                  fontSize: '16px',
                  padding: '10px 12px',
                  color: 'white',
                  background: '#000000',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  outline: 'none',
                  minWidth: '220px'
                }}
              >
                <option value=''>Select team...</option>
                {teams.map(team => {
                  const available = effectivePurse(team)
                  const rosterSize = players.filter(p => p.sold_to_team === team.name).length
                  const canAfford = typeof bidPrice !== 'number' || bidPrice * 1000000 <= available
                  const overCap = typeof bidPrice === 'number' && bidPrice * 1000000 > 115000000

                  return (
                    <option
                      key={team.id}
                      value={team.id}
                      disabled={!canAfford || overCap}
                    >
                      {team.name} — ₹{(available / 1000000).toFixed(1)}M available ({rosterSize}/6 players)
                      {!canAfford ? ' (insufficient funds)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <button
            onClick={handleSold}
            style={{
              padding: '12px 32px',
              background: ORANGE,
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            Sold
          </button>

          <button
            onClick={handleUnsold}
            style={{
              padding: '12px 32px',
              background: 'transparent',
              color: '#666',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid #333',
              borderRadius: '8px',
              cursor: 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            Unsold
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div style={{
        width: '220px',
        background: '#111',
        borderLeft: '1px solid #1e1e1e',
        padding: '24px 16px',
        overflowY: 'auto'
      }}>
        <p style={{ color: '#444', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 16px 0' }}>
          Team Purses
        </p>
        {teams.map(team => (
          <div key={team.id} style={{ padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
            <p style={{ color: '#ccc', fontSize: '12px', margin: '0 0 2px 0' }}>{team.name}</p>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: team.purse < 20000000 ? '#c0392b' : ORANGE
            }}>
              ₹{(team.purse / 1000000).toFixed(1)}M
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}