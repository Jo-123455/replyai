import { Link } from 'react-router-dom'
import { isAuthenticated } from '../api'

export default function Landing() {
  const loggedIn = isAuthenticated()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-bold text-xl text-gray-900">ReplyAI</span>
            </div>
            <div className="flex items-center gap-3">
              {loggedIn ? (
                <Link to="/dashboard" className="btn-primary text-sm">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm">Log in</Link>
                  <Link to="/signup" className="btn-primary text-sm">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-6">
            🛠️ Built for tradesmen
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Never Miss a{' '}
            <span className="text-brand-600">Lead</span> Again
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            ReplyAI automatically follows up every missed call, text, email, and web enquiry — 
            sounding warm and human, not like a robot. Turn leads into booked jobs on autopilot.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <a href="#how-it-works" className="btn-secondary text-lg px-8 py-3">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Connect Your Phone', desc: 'Link your business number in 2 minutes. We handle calls, texts, and emails.' },
            { step: '02', title: 'AI Answers Your Leads', desc: 'Every missed call gets an instant, warm follow-up text. Emails and web forms get human-sounding replies.' },
            { step: '03', title: 'Watch Jobs Book Themselves', desc: 'Our 7-day follow-up sequence nurtures leads until they book or opt out.' },
          ].map(item => (
            <div key={item.step} className="card text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Tradesmen Love ReplyAI</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Instant Response', desc: 'Reply within seconds, every time' },
              { icon: '🤖', title: 'Warm, Human AI', desc: 'No robots — sounds like a real person' },
              { icon: '📅', title: '7-Day Follow-Up', desc: 'Intelligent sequence over 7 days' },
              { icon: '🚨', title: 'Urgency Detection', desc: 'Spots emergencies and prioritises them' },
            ].map(f => (
              <div key={f.title} className="text-center p-4">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="card bg-brand-600 text-white border-brand-600 p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Stop Losing Leads?</h2>
          <p className="text-brand-100 mb-8 max-w-lg mx-auto">
            Join hundreds of tradesmen who never miss a job. Set up in under 5 minutes.
          </p>
          <Link to="/signup" className="inline-block bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors">
            Get Started →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} ReplyAI. All rights reserved.</p>
      </footer>
    </div>
  )
}