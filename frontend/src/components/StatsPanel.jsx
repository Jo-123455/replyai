import { useState, useEffect } from 'react'
import { getStats } from '../api'

export default function StatsPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const data = await getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{ label: 'Total Enquiries', value: '—', color: '' },
          { label: 'Replied', value: '—', color: '' },
          { label: 'Booked', value: '—', color: 'text-accent-600' },
          { label: 'Response Time', value: '—', color: '' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className={`stat-value ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const statItems = [
    { label: 'Total Enquiries', value: stats.total, color: '' },
    { label: 'New / In Progress', value: (stats.new || 0) + (stats.inProgress || 0), color: 'text-yellow-600' },
    { label: 'Booked', value: stats.booked || 0, color: 'text-accent-600' },
    { label: 'Closed', value: stats.closed || 0, color: 'text-gray-500' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map(s => (
        <div key={s.label} className="stat-card">
          <span className="stat-label">{s.label}</span>
          <span className={`stat-value ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  )
}