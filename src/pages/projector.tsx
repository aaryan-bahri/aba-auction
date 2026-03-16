import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import logo from '/logo.png'
import Footer from '../components/footer'


const ORANGE = '#E8761A'

type Player = {
  id: number
  name: string
  gender: string
  tier: number
  notes: string
  photo_url: string | null
  position: string | null
}

type AuctionState = {
  current_player_id: number | null
  current_round: number | null
  current_bid: number
  bidding_team: string | null
  is_final_call: boolean
  status: string | null
}

type Team = {
  id: number
  name: string
  purse: number
  logo_url: string | null
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
  const [teams, setTeams] = useState<Team[]>([])

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

        if (newState.status === 'sold' || newState.status === 'sold_rtm' || newState.status === 'unsold')  {
          setTimeout(() => {
            setAuctionState(prev => prev ? { ...prev, status: null, current_player_id: null, current_bid: 0, bidding_team: null } : null)
            setCurrentPlayer(null)
            supabase.from('auction_state').update({ status: null }).eq('id', 1)
          }, 1500)
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
    const { data: teamData } = await supabase.from('teams').select('*')
    if (teamData) setTeams(teamData)
    if (data) {
      if (data.status === 'sold' || data.status === 'sold_rtm' || data.status === 'unsold') {
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
    <>
      <style>{`
        .projector-outer {
          min-height: 100vh;
          width: 100%;
          background: #000000;
          color: white;
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          box-sizing: border-box;
        }
        .projector-card {
          background: #111;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 32px;
          padding: 28px 20px;
          width: 92%;
          max-width: 720px;
          box-sizing: border-box;
        }
        .player-name {
          font-size: 20px;
          margin: 0 0 12px 0;
          color: white;
          font-weight: 700;
        }
        .bid-row {
          display: flex;
          gap: 24px;
          text-align: center;
          align-items: center;
        }
        .bid-amount {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
        }
        .sold-title {
          font-size: 56px;
          margin: 0 0 16px 0;
          letter-spacing: 8px;
          font-weight: 800;
        }
        .sold-sub {
          font-size: 20px;
        }
        @media (min-width: 768px) {
          .projector-card {
            padding: 48px 64px;
            width: 80%;
            max-width: 720px;
          }
          .player-name {
            font-size: 40px;
          }
          .bid-row {
            gap: 80px;
          }
          .bid-amount {
            font-size: 52px;
          }
          .sold-title {
            font-size: 96px;
          }
          .sold-sub {
            font-size: 28px;
          }
        }
      `}</style>

      <div className="projector-outer">

        {/* Logo */}
        <img
          src={logo}
          alt="ABA"
          style={{ width: '52px', position: 'absolute', top: '20px', left: '20px', opacity: 0.6 }}
        />

        {/* SOLD overlay */}
        {(auctionState?.status === 'sold' || auctionState?.status === 'sold_rtm') && (
          <div style={{ textAlign: 'center' }}>
            <h1 className="sold-title" style={{ color: ORANGE }}>SOLD</h1>
            <p className="sold-sub" style={{ color: 'white', margin: '0 0 16px 0' }}>
              {currentPlayer?.name}
            </p>
            {(() => {
              const team = teams.find(t => t.name === auctionState.bidding_team)
              return team?.logo_url ? (
                <img src={team.logo_url} alt={team.name}
                  style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto 12px auto', display: 'block' }}
                />
              ) : null
            })()}
            <p className="sold-sub" style={{ color: ORANGE, margin: '0 0 8px 0' }}>
              {auctionState.bidding_team}
            </p>
            {auctionState?.status === 'sold_rtm' && (
              <p style={{ color: ORANGE, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase', margin: '8px 0 0 0' }}>
                {auctionState.bidding_team} used RTM
              </p>
            )}
            <p style={{ fontSize: '22px', color: 'white', margin: '8px 0 0 0' }}>
              {auctionState.current_bid ? `₹${(auctionState.current_bid / 1000000).toFixed(1)}M` : ''}
            </p>
          </div>
        )}

        {/* UNSOLD overlay */}
        {auctionState?.status === 'unsold' && (
          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            <h1 className="sold-title" style={{ color: '#333' }}>UNSOLD</h1>
            <p className="sold-sub" style={{ color: 'white', margin: 0 }}>{currentPlayer?.name}</p>
          </div>
        )}

        {/* Main content */}
        {!auctionState?.status && (
          <>
            {/* Round label */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              {round ? (
                <>
                  <p style={{ color: ORANGE, fontSize: '18px', margin: 0, textTransform: 'uppercase', letterSpacing: '4px' }}>
                    {auctionState?.is_final_call ? 'Final Call — ' : ''}{round.label}
                  </p>
                  <p style={{ color: 'white', fontSize: '18px', margin: '6px 0 0 0', letterSpacing: '3px' }}>
                    {round.sublabel}
                  </p>
                </>
              ) : (
                <p style={{ color: 'white', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>
                  Waiting to begin
                </p>
              )}
            </div>

            {/* Player Card */}
            <div
              className="projector-card"
              style={{ border: `1px solid ${currentPlayer ? ORANGE : '#1e1e1e'}` }}
            >
              {currentPlayer ? (
                <>
                  <div style={{ margin: '0 auto 20px auto', maxWidth: '280px' }}>
                    <img
                      src={currentPlayer.photo_url || 'https://www.gravatar.com/avatar/?d=mp&s=200'}
                      alt={currentPlayer.name}
                      style={{ width: '100%', height: 'auto', borderRadius: '10px', display: 'block' }}
                      onError={e => {
                        (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp&s=200'
                      }}
                    />
                  </div>
                 <h1 className="player-name">{currentPlayer.name}</h1>
                  <p style={{ 
                    fontSize: '24px', color: ORANGE, margin: '0 0 8px 0', 
                    letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' 
                  }}>
                    {currentPlayer.position || 'PLAYER'}
                  </p>
                  <p style={{ fontSize: '24px', color: 'white', margin: '0 0 8px 0', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    {currentPlayer.gender} &nbsp;·&nbsp; Tier {currentPlayer.tier}
                  </p>
                  {currentPlayer.notes && (
                    <p style={{ fontSize: '20px', color: 'white', margin: '8px 0 0 0' }}>
                      {currentPlayer.notes}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ color: '#2a2a2a', margin: 0, fontSize: '15px', letterSpacing: '2px' }}>
                  No player selected
                </p>
              )}
            </div>

            {/* Bid Info */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: '10px', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>
                Current Bid
              </p>
              <p className="bid-amount" style={{ color: ORANGE }}>
                {auctionState?.current_bid
                  ? `₹${(auctionState.current_bid / 1000000).toFixed(1)}M`
                  : '—'}
              </p>
              <p style={{ color: 'white', fontSize: '10px', margin: '16px 0 8px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>
                Bidding Team
              </p>
              <p className="bid-amount" style={{ color: 'white' }}>
                {auctionState?.bidding_team || '—'}
              </p>
            </div>
          </>
        )}
      </div>
        <Footer />
    </>
  )
}