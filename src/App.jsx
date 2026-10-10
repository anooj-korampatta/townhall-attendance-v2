import { useEffect, useState } from 'react'
import CheckIn from './pages/CheckIn'
import Dashboard from './pages/Dashboard'
import { attendanceService } from './services/attendance'

export default function App() {
  const [page, setPage] = useState(
    window.location.hash.toLowerCase() === '#dashboard' ? 'dashboard' : 'checkin'
  )

  useEffect(() => {
    const onHash = () =>
      setPage(window.location.hash.toLowerCase() === '#dashboard' ? 'dashboard' : 'checkin')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return page === 'dashboard'
    ? <Dashboard service={attendanceService} />
    : <CheckIn service={attendanceService} />
}