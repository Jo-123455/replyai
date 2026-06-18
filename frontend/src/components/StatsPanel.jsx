import { useState, useEffect } from 'react'
import { getStats, getBusiness } from '../api'

export default function StatsPanel() {
  const [stats, setStats] = useState(null)
  const [avgJobValue, setAvgJobValue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [statsData, businessData] = await Promise.all([
        getStats(),
        getBusiness().catch(() => ({})),
      ])
      setStats(statsData)
      setAvgJobValue(Number(businessData.avgJobValue || businessData.avg_job_value || 0))
    } catch (err) {
      console.error('Failed to load data:', err)
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

  const booked = stats?.booked || 0
  const estimatedRevenue = booked * avgJobValue

  const statItems = [
    { label: 'Total Enquiries', value: stats?.total || 0, color: '' },
    { label: 'Booked Jobs', value: booked, color: 'text-accent-600' },
    { label: 'Estimated Revenue', value: `£${estimatedRevenue.toLocaleString()}`, color: 'text-green-600' },
    { label: 'Avg Response Time', value: stats?.avgResponseTime || '<5 min', color: 'text-gray-500' },
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