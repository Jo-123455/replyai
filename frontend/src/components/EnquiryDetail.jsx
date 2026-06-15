import { useState, useEffect } from 'react'
import { getEnquiry, updateEnquiry } from '../api'

const SOURCE_LABELS = {
  missed_call: '📞 Missed Call',
  sms: '💬 Text Message',
  email: '📧 Email',
  web_form: '🌐 Website Enquiry',
}

const URGENCY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  emergency: '🚨 Emergency',
}

export default function EnquiryDetail({ enquiryId, onClose, onUpdated }) {
  const [enquiry, setEnquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (enquiryId) loadEnquiry()
  }, [enquiryId])

  async function loadEnquiry() {
    setLoading(true)
    try {
      const data = await getEnquiry(enquiryId)
      setEnquiry(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus) {
    setUpdating(true)
    try {
      await updateEnquiry(enquiryId, { status: newStatus })
      await loadEnquiry()
      onUpdated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (!enquiryId) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Enquiry Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {loading && (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
          </div>
        )}

        {enquiry && !loading && (
          <div className="p-6 space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Source</span>
                <p className="text-sm font-medium text-gray-900 mt-1">{SOURCE_LABELS[enquiry.source] || enquiry.source}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Urgency</span>
                <p className="text-sm font-medium text-gray-900 mt-1">{URGENCY_LABELS[enquiry.urgency] || enquiry.urgency}</p>
              </div>
              {enquiry.contact_name && (
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Name</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">{enquiry.contact_name}</p>
                </div>
              )}
              {(enquiry.phone || enquiry.email) && (
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Contact</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {enquiry.phone && <span>{enquiry.phone}</span>}
                    {enquiry.email && <span className="block text-gray-500">{enquiry.email}</span>}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Received</span>
                <p className="text-sm font-medium text-gray-900 mt-1">{new Date(enquiry.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Status</span>
                <p className="mt-1">
                  <span className={STATUS_CLASSES[enquiry.status] || 'badge-new'}>
                    {enquiry.status?.replace('_', ' ')}
                  </span>
                </p>
              </div>
            </div>

            {/* Message */}
            {enquiry.message && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Message</span>
                <div className="mt-2 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {enquiry.message}
                </div>
              </div>
            )}

            {/* Conversation Thread */}
            {enquiry.interactions && enquiry.interactions.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Conversation</span>
                <div className="mt-2 space-y-3">
                  {enquiry.interactions.map(interaction => (
                    <div
                      key={interaction.id}
                      className={`flex ${interaction.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                        interaction.direction === 'sent'
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs opacity-70">
                            {interaction.channel === 'sms' ? '💬' : '📧'} {interaction.direction === 'sent' ? 'Sent' : 'Received'}
                          </span>
                        </div>
                        <p>{interaction.content}</p>
                        <span className="text-xs opacity-60 block mt-1">
                          {new Date(interaction.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Update Status</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {['new', 'in_progress', 'booked', 'closed'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating || enquiry.status === status}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      enquiry.status === status
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'booked' ? '✅ Booked' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const STATUS_CLASSES = {
  new: 'badge-new',
  in_progress: 'badge-in-progress',
  booked: 'badge-booked',
  closed: 'badge-closed',
}