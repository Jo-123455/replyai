import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup, isAuthenticated } from '../api'

const SERVICE_TYPES = [
  'Plumber',
  'Electrician',
  'Handyman',
  'HVAC',
  'Carpenter',
  'Painter',
  'Landscaper',
  'Roofer',
  'Other',
]

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    businessName: '',
    email: '',
    password: '',
    serviceType: '',
    phone: '',
    businessHours: 'Mon-Fri 8am-6pm, Sat 9am-1pm',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated()) {
    navigate('/dashboard', { replace: true })
    return null
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signup({
        businessName: form.businessName,
        email: form.email,
        password: form.password,
        serviceType: form.serviceType.toLowerCase(),
        phone: form.phone,
        businessHours: form.businessHours,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <span className="font-bold text-2xl text-gray-900">ReplyAI</span>
      </Link>

      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Get Started</h1>
        <p className="text-gray-500 text-sm mb-6">Set up your AI follow-up agent in minutes</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              value={form.businessName}
              onChange={handleChange}
              className="input-field"
              placeholder="Sam's Plumbing"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="input-field"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select
              id="serviceType"
              name="serviceType"
              value={form.serviceType}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select your trade</option>
              {SERVICE_TYPES.map(t => (
                <option key={t} value={t.toLowerCase()}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="+44 7700 900000"
              required
            />
          </div>
          <div>
            <label htmlFor="businessHours" className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
            <input
              id="businessHours"
              name="businessHours"
              type="text"
              value={form.businessHours}
              onChange={handleChange}
              className="input-field"
              placeholder="Mon-Fri 8am-6pm, Sat 9am-1pm"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  )
}