const SOURCE_LABELS = {
  missed_call: '📞 Missed Call',
  sms: '💬 Text',
  email: '📧 Email',
  web_form: '🌐 Web Enquiry',
}

const STATUS_BADGES = {
  new: 'badge-new',
  in_progress: 'badge-in-progress',
  booked: 'badge-booked',
  closed: 'badge-closed',
}

const STATUS_LABELS = {
  new: 'New',
  in_progress: 'In Progress',
  booked: 'Booked',
  closed: 'Closed',
}

export default function EnquiryCard({ enquiry, onClick, onTogglePause }) {
  const sourceInfo = SOURCE_LABELS[enquiry.source] || enquiry.source
  const statusBadge = STATUS_BADGES[enquiry.status] || 'badge-new'
  const statusLabel = STATUS_LABELS[enquiry.status] || enquiry.status

  const timeAgo = getTimeAgo(new Date(enquiry.created_at))
  const preview = enquiry.message
    ? enquiry.message.length > 80
      ? enquiry.message.slice(0, 80) + '…'
      : enquiry.message
    : enquiry.contact_name
      ? `Lead from ${enquiry.contact_name}`
      : 'New enquiry'

  return (
    <div
      className="card cursor-pointer hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-3"
      onClick={() => onClick?.(enquiry)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-500">{sourceInfo}</span>
          {enquiry.urgency === 'emergency' && (
            <span className="badge bg-red-100 text-red-700">🚨 Urgent</span>
          )}
        </div>
        {enquiry.contact_name && (
          <h3 className="font-semibold text-gray-900 truncate">{enquiry.contact_name}</h3>
        )}
        <p className="text-sm text-gray-600 truncate">{preview}</p>
        <span className="text-xs text-gray-400 mt-1 block">{timeAgo}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
        <span className={statusBadge}>{statusLabel}</span>
        <button
          onClick={() => onTogglePause?.(enquiry.id, !enquiry.follow_up_paused)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            enquiry.follow_up_paused
              ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
          title={enquiry.follow_up_paused ? 'Resume follow-ups' : 'Pause follow-ups'}
        >
          {enquiry.follow_up_paused ? '⏸ Paused' : '▶ Active'}
        </button>
      </div>
    </div>
  )
}

function getTimeAgo(date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}