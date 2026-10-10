import { useState } from 'react'
import { supabaseConfigured } from '../lib/supabase'

const messages = {
  CHECKED_IN: ['success', 'Checked in successfully'],
  CHECKED_OUT: ['success', 'Checked out successfully'],
  ALREADY_IN: ['pending', 'Already checked in'],
  NOT_IN: ['pending', 'This attendee is not currently checked in'],
  NOT_FOUND: ['error', 'Attendee not found'],
  ERROR: ['error', 'Something went wrong']
}

export default function CheckIn({ service }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function submit(event) {
    event.preventDefault()
    if (!value.trim() || loading) return

    setLoading(true)
    setResult(null)

    try {
      const response = await service.checkIn(value)
      setResult(response)
      if (response.ok) setValue('')
    } catch (error) {
      console.error(error)
      setResult({ ok: false, type: 'ERROR', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function checkout() {
    if (!result?.attendee) return
    setLoading(true)

    try {
      const response = await service.checkOut(value || result.attendee.employee_id)
      setResult(response)
      if (response.ok) setValue('')
    } catch (error) {
      setResult({ ok: false, type: 'ERROR', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const config = messages[result?.type]
  const messageText = result?.type === 'ERROR'
    ? result.message || messages.ERROR[1]
    : config?.[1]

  return (
    <main className="app-shell">
      <section className="checkin-card">
        <header className="brand">
          <div className="brand-mark">GWC</div>
          <div>
            <h1>Townhall Attendance</h1>
            <p>ALIGNMENT. ACCOUNTABILITY. AGILITY</p>
          </div>
        </header>

        <form onSubmit={submit}>
          <label htmlFor="attendee">Employee ID / Mobile / Email</label>
          <input
            id="attendee"
            value={value}
            onChange={event => setValue(event.target.value)}
            placeholder="Enter your ID, mobile or email"
            autoComplete="off"
            autoFocus
          />
          <button disabled={loading || !value.trim()}>
            {loading ? 'Processing…' : 'Check In'}
          </button>
        </form>

        {!supabaseConfigured && (
          <div className="status-message error">
            Supabase is not configured yet. Add the values from <code>.env</code>.
          </div>
        )}

        {result && config && (
          <div className={`status-message ${config[0]}`}>
            <strong>{messageText}</strong>
            {result.attendee?.name && <span>{result.attendee.name}</span>}
            {result.type === 'ALREADY_IN' && (
              <button type="button" className="secondary" onClick={checkout}>
                Check Out
              </button>
            )}
          </div>
        )}

        {result?.type === 'ERROR' && !config && (
          <div className="status-message error">{messageText}</div>
        )}

        <footer>©2026 Anooj Korampatta | GWC Townhall</footer>
      </section>
    </main>
  )
}