-- ReplyAI Database Schema
-- Supabase PostgreSQL

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- plumber, electrician, handyman, hvac, etc.
  tone_of_voice VARCHAR(50) DEFAULT 'professional', -- professional, friendly, casual
  business_hours JSONB DEFAULT '{"monday":{"start":"08:00","end":"18:00"},"tuesday":{"start":"08:00","end":"18:00"},"wednesday":{"start":"08:00","end":"18:00"},"thursday":{"start":"08:00","end":"18:00"},"friday":{"start":"08:00","end":"18:00"},"saturday":{"start":"09:00","end":"14:00"},"sunday":{"start":"00:00","end":"00:00"}}',
  phone VARCHAR(20),
  email VARCHAR(255),
  calendly_link VARCHAR(500),
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('missed_call', 'sms', 'email', 'web_form')),
  contact_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  message TEXT,
  urgency VARCHAR(20) DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'booked', 'closed')),
  follow_up_day INT DEFAULT 0, -- 0 = immediate, 1 = day 1, 3 = day 3, 7 = day 7
  follow_up_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('sent', 'received')),
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('sms', 'email')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enquiries_business_id ON enquiries(business_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_follow_up ON enquiries(follow_up_day, follow_up_paused) WHERE follow_up_paused = FALSE;
CREATE INDEX IF NOT EXISTS idx_interactions_enquiry_id ON interactions(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);