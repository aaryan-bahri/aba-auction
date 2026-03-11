import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import logo from '../public/logo.png'


const ORANGE = '#E8761A'

type Player = {
  id: number
  name: string
  gender: string
  tier: number
  notes: string
  photo_url: string | null
}

type AuctionState = {
  current_player_id: number | null
  current_round: number | null
  current_bid: number
  bidding_team: string | null
  is_final_call: boolean
  status: string | null
}

const ROUNDS = [
  { label: 'Round 1', sublabel: 'NCM T1 & T2' },
  { label: 'Round 2', sublabel: 'NCM T3 & T4' },
  { label: 'Round 3', sublabel: 'CM T1 & T2' },
  { label: 'Round 4', sublabel: 'CM T3 & T4' },
]

export default function Projector() {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)

  useEffect(() => {
    fetchAuctionState()

    const subscription = supabase
      .channel('auction_state_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auction_state'
      }, payload => {
        const newState = payload.new as AuctionState
        setAuctionState(newState)

        if (newState.status === 'sold' || newState.status === 'unsold') {
          setTimeout(() => {
            setAuctionState(prev => prev ? { ...prev, status: null, current_player_id: null, current_bid: 0, bidding_team: null } : null)
            setCurrentPlayer(null)
            supabase.from('auction_state').update({ status: null }).eq('id', 1)
          }, 3000)
        } else if (newState.current_player_id) {
          fetchPlayer(newState.current_player_id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  async function fetchAuctionState() {
    const { data } = await supabase.from('auction_state').select('*').eq('id', 1).single()
    if (data) {
      if (data.status === 'sold' || data.status === 'unsold') {
        await supabase.from('auction_state').update({ status: null }).eq('id', 1)
        setAuctionState({ ...data, status: null })
        setCurrentPlayer(null)
      } else {
        setAuctionState(data)
        if (data.current_player_id) fetchPlayer(data.current_player_id)
      }
    }
  }

  async function fetchPlayer(playerId: number) {
    const { data } = await supabase.from('players').select('*').eq('id', playerId).single()
    if (data) setCurrentPlayer(data)
  }

  const round = auctionState?.current_round !== null && auctionState?.current_round !== undefined
    ? ROUNDS[auctionState.current_round]
    : null

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#000000',
      color: 'white',
      fontFamily: "'Segoe UI', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      boxSizing: 'border-box',
    }}>

      {/* Logo */}
      <img
        src={logo}
        alt="ABA"
        style={{ width: '80px', position: 'absolute', top: '32px', left: '40px', opacity: 0.6 }}
      />

      {/* SOLD overlay */}
      {auctionState?.status === 'sold' && (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '96px', color: ORANGE, margin: '0 0 16px 0', letterSpacing: '8px', fontWeight: '800' }}>
            SOLD
          </h1>
          <p style={{ fontSize: '28px', color: 'white', margin: '0 0 8px 0' }}>
            {currentPlayer?.name} — {auctionState.bidding_team}
          </p>
          <p style={{ fontSize: '22px', color: '#555' }}>
            {auctionState.current_bid ? `₹${(auctionState.current_bid / 1000000).toFixed(1)}M` : ''}
          </p>
        </div>
      )}

      {/* UNSOLD overlay */}
      {auctionState?.status === 'unsold' && (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '96px', color: '#333', margin: '0 0 16px 0', letterSpacing: '8px', fontWeight: '800' }}>
            UNSOLD
          </h1>
          <p style={{ fontSize: '28px', color: '#555' }}>{currentPlayer?.name}</p>
        </div>
      )}

      {/* Main content */}
      {!auctionState?.status && (
        <>
          {/* Round label */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            {round ? (
              <>
                <p style={{
                  color: ORANGE,
                  fontSize: '13px',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '5px'
                }}>
                  {auctionState?.is_final_call ? 'Final Call — ' : ''}{round.label}
                </p>
                <p style={{ color: '#444', fontSize: '13px', margin: '6px 0 0 0', letterSpacing: '3px' }}>
                  {round.sublabel}
                </p>
              </>
            ) : (
              <p style={{ color: '#333', fontSize: '16px', letterSpacing: '3px', textTransform: 'uppercase' }}>
                Waiting to begin
              </p>
            )}
          </div>

          {/* Player Card */}
          <div style={{
            background: '#111',
            border: `1px solid ${currentPlayer ? ORANGE : '#1e1e1e'}`,
            borderRadius: '16px',
            padding: '48px 64px',
            textAlign: 'center',
            minWidth: '520px',
            marginBottom: '48px'
          }}>
            {currentPlayer ? (
              <>
                {/* Player Photo */}
                <div style={{ margin: '0 auto 28px auto', maxWidth: '220px' }}>
                  <img
                    src={currentPlayer.photo_url || 'https://www.gravatar.com/avatar/?d=mp&s=200'}
                    alt={currentPlayer.name}
                    style={{ width: '100%', height: 'auto', borderRadius: '10px', display: 'block' }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp&s=200'
                    }}
                  />
                </div>

                <h1 style={{ fontSize: '52px', margin: '0 0 16px 0', color: 'white', fontWeight: '700' }}>
                  {currentPlayer.name}
                </h1>
                <p style={{ fontSize: '16px', color: '#555', margin: '0 0 10px 0', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {currentPlayer.gender} &nbsp;·&nbsp; Tier {currentPlayer.tier}
                </p>
                {currentPlayer.notes && (
                  <p style={{ fontSize: '15px', color: '#444', margin: '10px 0 0 0' }}>
                    {currentPlayer.notes}
                  </p>
                )}
              </>
            ) : (
              <p style={{ color: '#2a2a2a', margin: 0, fontSize: '18px', letterSpacing: '2px' }}>
                No player selected
              </p>
            )}
          </div>

          {/* Bid Info */}
          <div style={{ display: 'flex', gap: '80px', textAlign: 'center' }}>
            <div>
              <p style={{ color: '#333', fontSize: '11px', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>
                Current Bid
              </p>
              <p style={{ fontSize: '52px', fontWeight: '700', color: ORANGE, margin: 0 }}>
                {auctionState?.current_bid
                  ? `₹${(auctionState.current_bid / 1000000).toFixed(1)}M`
                  : '—'}
              </p>
            </div>

            <div style={{ width: '1px', background: '#1e1e1e' }} />

            <div>
              <p style={{ color: '#333', fontSize: '11px', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>
                Bidding Team
              </p>
              <p style={{ fontSize: '52px', fontWeight: '700', color: 'white', margin: 0 }}>
                {auctionState?.bidding_team || '—'}
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  )
}