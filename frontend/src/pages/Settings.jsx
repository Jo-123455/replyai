import { useState, useEffect } from 'react'
import { getBusiness, updateBusiness } from '../api'

const SERVICE_TYPES = [
  'plumber', 'electrician', 'handyman', 'hvac', 'carpenter', 'painter', 'landscaper', 'roofer', 'other',
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
]

export default function Settings() {
  const [form, setForm] = useState({
    business_name: '',
    service_type: '',
    tone_of_voice: 'professional',
    business_hours: '',
    phone: '',
    email: '',
    calendly_link: '',
    avg_job_value: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const data = await getBusiness()
      setForm({
        business_name: data.businessName || data.business_name || '',
        service_type: data.serviceType || data.service_type || '',
        tone_of_voice: data.toneOfVoice || data.tone_of_voice || 'professional',
        business_hours: typeof (data.businessHours || data.business_hours) === 'object'
          ? JSON.stringify(data.businessHours || data.business_hours)
          : data.businessHours || data.business_hours || '',
        phone: data.phone || '',
        email: data.email || '',
        calendly_link: data.calendlyLink || data.calendly_link || '',
        avg_job_value: data.avgJobValue || data.avg_job_value || '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await updateBusiness({
        businessName: form.business_name,
        serviceType: form.service_type,
        toneOfVoice: form.tone_of_voice,
        businessHours: form.business_hours,
        phone: form.phone,
        calendlyLink: form.calendly_link,
        avgJobValue: form.avg_job_value,
      })
      setSuccess('Settings saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="card animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your business profile and AI agent behaviour</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Business Name */}
        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input
            id="business_name"
            name="business_name"
            type="text"
            value={form.business_name}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        {/* Service Type */}
        <div>
          <label htmlFor="service_type" className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
          <select
            id="service_type"
            name="service_type"
            value={form.service_type}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select your trade</option>
            {SERVICE_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Tone of Voice */}
        <div>
          <label htmlFor="tone_of_voice" className="block text-sm font-medium text-gray-700 mb-1">Tone of Voice</label>
          <select
            id="tone_of_voice"
            name="tone_of_voice"
            value={form.tone_of_voice}
            onChange={handleChange}
            className="input-field"
          >
            {TONE_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">How your AI agent sounds when replying to leads</p>
        </div>

        {/* Business Hours */}
        <div>
          <label htmlFor="business_hours" className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
          <input
            id="business_hours"
            name="business_hours"
            type="text"
            value={form.business_hours}
            onChange={handleChange}
            className="input-field"
            placeholder="Mon-Fri 8am-6pm, Sat 9am-1pm"
          />
        </div>

        {/* Phone */}
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
          />
        </div>

        {/* Calendly Link */}
        <div>
          <label htmlFor="calendly_link" className="block text-sm font-medium text-gray-700 mb-1">Calendly / Booking Link</label>
          <input
            id="calendly_link"
            name="calendly_link"
            type="url"
            value={form.calendly_link}
            onChange={handleChange}
            className="input-field"
            placeholder="https://calendly.com/your-name"
          />
          <p className="text-xs text-gray-400 mt-1">Optional — share this so leads can book directly</p>
        </div>

        {/* Average Job Value */}
        <div>
          <label htmlFor="avg_job_value" className="block text-sm font-medium text-gray-700 mb-1">Average Job Value (£)</label>
          <input
            id="avg_job_value"
            name="avg_job_value"
            type="number"
            value={form.avg_job_value}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g. 250"
          />
          <p className="text-xs text-gray-400 mt-1">Used to estimate your earnings from booked jobs</p>
        </div>

        {/* Email (readonly) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Account Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            className="input-field bg-gray-50 text-gray-500"
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}