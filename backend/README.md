# 🤖 ReplyAI — AI Lead Follow-Up for Tradesmen

An AI agent purpose-built for tradesmen (plumbers, electricians, handymen) that automatically follows up every missed call, text, email, and web enquiry — turning leads into booked jobs on autopilot.

Warm, human responses. Intelligent follow-up sequencing over 7 days. Urgency detection for emergencies. No templates, no robots — sounds like a real person.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project (or run in demo mode without one)
- API keys for the services you want to use

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Set up the database
# Run database/schema.sql against your Supabase SQL editor

# 4. Start the server
npm start
```

### Demo Mode (no API keys needed)

```bash
npm run demo
```

This simulates 5 enquiry scenarios without any live API keys:
1. 🚨 **Missed call** — burst pipe (emergency)
2. 💬 **SMS** — quote request
3. 📧 **Email** — commercial job enquiry
4. 🌐 **Web form** — new customer
5. 🔄 **Lead reply** — ready to book

## 📡 API Documentation

### Health Check
```
GET /api/health
```
Returns: `{ status: "ok", timestamp: "2026-01-15T...", version: "1.0.0" }`

### Authentication

#### Login
```
POST /api/businesses/auth
Body: { email: string, password: string }
Returns: { token: string, business: { id, businessName, serviceType, email, phone } }
```

### Businesses

#### Create Business (Signup)
```
POST /api/businesses
Body: {
  businessName: string (required),
  serviceType: string (required) — "plumber" | "electrician" | "handyman" | "hvac",
  toneOfVoice: "professional" | "friendly" | "casual",
  phone: string,
  email: string,
  password: string,
  calendlyLink: string
}
Returns: { success: true, business: { id, businessName, serviceType }, token: string }
```

#### Get Business
```
GET /api/businesses/:id
Returns: { id, businessName, serviceType, toneOfVoice, businessHours, phone, email, calendlyLink }
```

#### Update Business
```
PATCH /api/businesses/:id
Body: { businessName, serviceType, toneOfVoice, businessHours, phone, email, calendlyLink }
Returns: { success: true, business: { ... } }
```

### Enquiries

#### List Enquiries
```
GET /api/enquiries?business_id=xxx&limit=50&offset=0
Returns: { enquiries: [...], total: number }
```

#### Get Single Enquiry
```
GET /api/enquiries/:id
Returns: { id, business_id, source, contact_name, phone, email, message, urgency, status, follow_up_day, follow_up_paused, created_at, updated_at, interactions: [...] }
```

#### Update Enquiry
```
PATCH /api/enquiries/:id
Body: { status: "new" | "in_progress" | "booked" | "closed", followUpPaused: boolean, contactName: string }
Returns: { success: true, enquiry: { ... } }
```

### Stats

#### Get Dashboard Stats
```
GET /api/stats?business_id=xxx
Returns: { total, booked, inProgress, closed, new }
```

### Webhooks (External Integrations)

These endpoints accept data from Twilio, SendGrid, or direct POST requests.

#### Missed Call (Twilio)
```
POST /webhooks/twilio/missed-call
Body: { From: caller_number, businessId: uuid }
```

#### Incoming SMS (Twilio)
```
POST /webhooks/twilio/sms
Body: { From: sender_number, Body: message_text, businessId: uuid }
```

#### Incoming Email (SendGrid)
```
POST /webhooks/sendgrid
Body: { from, subject, text, businessId: uuid }
```

#### Web Form Submission
```
POST /webhooks/contact-form
Body: { businessId: uuid, name, email, phone, message }
```

## 🧠 How It Works

### Follow-Up Sequence
Every enquiry gets an intelligent follow-up schedule:

| Stage | Timing | Content |
|-------|--------|---------|
| **Day 0** | Immediate | Warm acknowledgment + engage |
| **Day 1** | ~24 hours | Friendly check-in, different angle |
| **Day 3** | ~72 hours | Ask if sorted, offer service tip |
| **Day 7** | ~7 days | Gentle final nudge + Calendly link |

The sequence **stops automatically** when:
- The lead replies with booking intent
- Status is changed to "booked"
- 14 days pass with no response

### Urgency Detection
Keywords like "burst", "flooding", "gas", "emergency" trigger priority handling.

### AI Agent (Claude)
- Generates warm, human-sounding responses
- Adapts tone based on business settings (professional/friendly/casual)
- SMS: under 3 sentences | Email: under 150 words
- Never reveals it's AI unless directly asked

## 🏗️ Architecture

```
replyai/
├── backend/
│   ├── app.js              # Express server entry point
│   ├── config/index.js     # Environment config loader
│   ├── db/supabase.js      # Supabase database client
│   ├── routes/
│   │   ├── api.js          # REST API endpoints
│   │   └── webhooks.js     # Twilio/SendGrid/web form webhooks
│   ├── services/
│   │   ├── aiAgent.js      # Claude AI response generator
│   │   └── scheduler.js    # Follow-up cron scheduler
│   ├── utils/
│   │   └── urgencyDetector.js  # Keyword-based urgency detection
│   └── demo/
│       └── demoRunner.js   # Demo mode (no API keys required)
├── database/
│   └── schema.sql          # Supabase PostgreSQL schema
└── README.md
```

## 🚢 Deployment

### Production Checklist
1. Set up a **Supabase** project and run `database/schema.sql`
2. Configure **Twilio** phone number with webhooks pointing to `/webhooks/twilio/*`
3. Configure **SendGrid** Inbound Parse webhook pointing to `/webhooks/sendgrid`
4. Add your **Anthropic Claude** API key
5. Set `NODE_ENV=production`
6. Use a process manager (PM2, systemd) or deploy to Railway/Render/Fly.io

### Environment Variables
All configuration is through `.env` — see `.env.example` for the full list.

## 📋 Tech Stack
- **Runtime:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude (claude-sonnet-4-20250514)
- **SMS:** Twilio
- **Email:** SendGrid
- **Scheduler:** node-cron

## 📄 License
MIT — built for ReplyAI by team member @agent-backend-engineer