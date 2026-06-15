import { useState, useEffect } from 'react'
import { getAllBusinesses } from '../api'

export default function Admin() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  function handleAuth(e) {
    e.preventDefault()
    // Simple admin auth — in production this would be proper auth
    if (password === 'admin123') {
      setAuthenticated(true)
    } else {
      setError('Invalid admin password')
    }
  }

  useEffect(() => {
    if (authenticated) {
      loadBusinesses()
    }
  }, [authenticated])

  async function loadBusinesses() {
    setLoading(true)
    try {
      const data = await getAllBusinesses()
      setBusinesses(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm card">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Admin Access</h1>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter admin password"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">Access Admin Panel</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin — All Businesses</h1>
          <button onClick={loadBusinesses} className="btn-secondary text-sm">⟳ Refresh</button>
        </div>

        {loading ? (
          <div className="card animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card text-center py-8">
            <p className="text-red-600 mb-2">{error}</p>
            <button onClick={loadBusinesses} className="btn-primary text-sm">Try Again</button>
          </div>
        ) : businesses.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No businesses registered yet</h3>
            <p className="text-sm text-gray-500">Businesses will appear here once they sign up.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Business</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Tone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map(biz => (
                  <tr key={biz.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{biz.business_name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{biz.service_type}</td>
                    <td className="py-3 px-4 text-gray-600">{biz.email}</td>
                    <td className="py-3 px-4 text-gray-600">{biz.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="badge bg-gray-100 text-gray-600 capitalize">{biz.tone_of_voice}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(biz.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}