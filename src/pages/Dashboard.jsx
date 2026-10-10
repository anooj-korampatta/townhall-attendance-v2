import { useEffect, useState } from 'react'
import LoadingSkeleton from '../components/LoadingSkeleton'

const pageSize = 6

export default function Dashboard({ service }) {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  async function load() {
    try {
      setError('')
      setData(await service.getDashboard())
    } catch (e) {
      console.error(e)
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
    const unsubscribe = service.subscribeToActivity(() => load())
    return unsubscribe
  }, [])

  const records = data?.recent || []
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize))
  const rows = records.slice((page - 1) * pageSize, page * pageSize)

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>Townhall Dashboard</h1>
          <p>ALIGNMENT. ACCOUNTABILITY. AGILITY</p>
        </div>
        <a href="#" className="back-link">← Check-in</a>
      </header>

      {error && <div className="status-message error">{error}</div>}

      <section className="metrics">
        <Metric title="Checked In" value={data?.checkedIn} />
        <Metric title="Total Invitees" value={data?.total} />

        <div className="metric latest">
          <span>Latest Activity</span>
          {!data ? <LoadingSkeleton className="latest-skeleton" /> : (
            <>
              <strong>{data.latest?.name || '—'}</strong>
              <small>
                {data.latest?.timestamp
                  ? new Date(data.latest.timestamp).toLocaleString()
                  : '—'}
              </small>
              {data.latest && <Badge action={data.latest.action} />}
            </>
          )}
        </div>
      </section>

      <section className="activity-card">
        <div className="section-title">
          <h2>All Activities</h2>
          <span>{records.length} recent records</span>
        </div>

        {!data ? (
          <div className="activity-skeleton">
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </div>
        ) : rows.length ? (
          rows.map(item => (
            <div className="activity-row" key={item.id}>
              <div>
                <strong>{item.name || '—'}</strong>
                <Badge action={item.action} />
              </div>
              <time>{new Date(item.timestamp).toLocaleString()}</time>
            </div>
          ))
        ) : (
          <div className="empty">No activity yet.</div>
        )}

        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      </section>

      <footer>©2026 Anooj Korampatta | GWC Townhall</footer>
    </main>
  )
}

function Metric({ title, value }) {
  return (
    <div className="metric">
      <span>{title}</span>
      {value == null ? <LoadingSkeleton /> : <strong>{value}</strong>}
    </div>
  )
}

function Badge({ action }) {
  return (
    <span className={`badge ${action === 'OUT' ? 'out' : 'in'}`}>
      {action === 'OUT' ? 'CHECK-OUT' : 'CHECK-IN'}
    </span>
  )
}