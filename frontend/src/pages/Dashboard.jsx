import { useState, useEffect, useCallback } from 'react'
import { getEnquiries, toggleFollowUp } from '../api'
import StatsPanel from '../components/StatsPanel'
import EnquiryCard from '../components/EnquiryCard'
import EnquiryDetail from '../components/EnquiryDetail'

export default function Dashboard() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')

  const loadEnquiries = useCallback(async () => {
    try {
      const data = await getEnquiries()
      setEnquiries(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEnquiries()
  }, [loadEnquiries])

  async function handleTogglePause(id, paused) {
    try {
      await toggleFollowUp(id, paused)
      await loadEnquiries()
    } catch (err) {
      console.error('Failed to toggle follow-up:', err)
    }
  }

  const filtered = filter === 'all'
    ? enquiries
    : enquiries.filter(e => e.status === filter)

  const counts = {
    all: enquiries.length,
    new: enquiries.filter(e => e.status === 'new').length,
    in_progress: enquiries.filter(e => e.status === 'in_progress').length,
    booked: enquiries.filter(e => e.status === 'booked').length,
    closed: enquiries.filter(e => e.status === 'closed').length,
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={loadEnquiries}
          className="btn-secondary text-sm"
          title="Refresh enquiries"
        >
          ⟳ Refresh
        </button>
      </div>

      {/* Stats Panel */}
      <StatsPanel />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto">
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'new', label: `New (${counts.new})`, className: 'badge-new' },
          { key: 'in_progress', label: `In Progress (${counts.in_progress})`, className: 'badge-in-progress' },
          { key: 'booked', label: `Booked (${counts.booked})`, className: 'badge-booked' },
          { key: 'closed', label: `Closed (${counts.closed})`, className: 'badge-closed' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Enquiry Feed */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-48" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-600 mb-2">Failed to load enquiries</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={loadEnquiries} className="btn-primary mt-4 text-sm">Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No enquiries yet</h3>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'When leads come in through calls, texts, emails, or your website, they\'ll appear here.'
              : `No enquiries with status "${filter.replace('_', ' ')}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(enquiry => (
            <EnquiryCard
              key={enquiry.id}
              enquiry={enquiry}
              onClick={() => setSelectedId(enquiry.id)}
              onTogglePause={handleTogglePause}
            />
          ))}
        </div>
      )}

      {/* Enquiry Detail Modal */}
      {selectedId && (
        <EnquiryDetail
          enquiryId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={loadEnquiries}
        />
      )}
    </div>
  )
}