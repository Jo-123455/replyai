/**
 * Config loader — loads environment variables with sensible defaults.
 * All config lives here so the rest of the app reads from one source.
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

  // Anthropic
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // SendGrid
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'hello@replyai.co',
  },

  // Demo defaults
  demo: {
    businessName: process.env.DEMO_BUSINESS_NAME || "Sam's Plumbing",
    serviceType: process.env.DEMO_SERVICE_TYPE || 'plumber',
    toneOfVoice: process.env.DEMO_TONE_OF_VOICE || 'friendly',
  },
};

module.exports = config;