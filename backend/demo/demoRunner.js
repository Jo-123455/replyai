#!/usr/bin/env node

/**
 * ReplyAI Demo Runner
 *
 * Simulates 5 common enquiry scenarios without requiring live API keys:
 * 1. Missed call (urgent — burst pipe)
 * 2. SMS (quote request)
 * 3. Email (commercial job)
 * 4. Web form (new customer)
 * 5. Lead replying to follow-up (ready to book)
 *
 * Uses mock AI responses so it works offline/without credentials.
 * Logs everything clearly to console.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load .env if it exists
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Set demo defaults
process.env.DEMO_BUSINESS_NAME = process.env.DEMO_BUSINESS_NAME || "Sam's Plumbing";
process.env.DEMO_SERVICE_TYPE = process.env.DEMO_SERVICE_TYPE || 'plumber';
process.env.DEMO_TONE_OF_VOICE = process.env.DEMO_TONE_OF_VOICE || 'friendly';

const { generateResponse, detectUrgency } = require('../services/aiAgent');
const { detectUrgency: detect } = require('../utils/urgencyDetector');

// ─── Demo Business ───────────────────────────────────────────────────────────

const demoBusiness = {
  id: 'demo-biz-001',
  business_name: process.env.DEMO_BUSINESS_NAME || "Sam's Plumbing",
  service_type: process.env.DEMO_SERVICE_TYPE || 'plumber',
  tone_of_voice: process.env.DEMO_TONE_OF_VOICE || 'friendly',
  business_hours: {
    monday: { start: '08:00', end: '18:00' },
    tuesday: { start: '08:00', end: '18:00' },
    wednesday: { start: '08:00', end: '18:00' },
    thursday: { start: '08:00', end: '18:00' },
    friday: { start: '08:00', end: '18:00' },
    saturday: { start: '09:00', end: '14:00' },
    sunday: { start: '00:00', end: '00:00' },
  },
  phone: '+1234567890',
  email: 'sam@plumbingservices.com',
  calendly_link: 'https://calendly.com/sams-plumbing',
};

// ─── Scenario Definitions ────────────────────────────────────────────────────

const scenarios = [
  {
    id: 1,
    title: '🚨 Missed Call — Burst Pipe (Emergency)',
    enquiry: {
      source: 'missed_call',
      contactName: 'Jane Smith',
      phone: '+440712345678',
      email: null,
      message: 'We have a burst pipe in the kitchen! Water everywhere!',
    },
    expectedUrgency: 'emergency',
  },
  {
    id: 2,
    title: '💬 SMS — Quote Request',
    enquiry: {
      source: 'sms',
      contactName: 'Mike',
      phone: '+440798765432',
      email: null,
      message: 'Hi, how much do you charge to fix a leaking tap?',
    },
    expectedUrgency: 'high',
  },
  {
    id: 3,
    title: '📧 Email — Commercial Job Enquiry',
    enquiry: {
      source: 'email',
      contactName: 'Sarah Johnson',
      phone: null,
      email: 'sarah@example-business.com',
      message: 'Hello, we are looking for an electrician to rewire our office space. It is a 2000sqft commercial unit. Could you provide a quote?',
    },
    expectedUrgency: 'medium',
  },
  {
    id: 4,
    title: '🌐 Web Form — New Customer',
    enquiry: {
      source: 'web_form',
      contactName: 'Tom Williams',
      phone: '+440712349876',
      email: null,
      message: 'Need a new boiler installed. Can you come and take a look?',
    },
    expectedUrgency: 'medium',
  },
  {
    id: 5,
    title: '🔄 Lead Reply — Ready to Book',
    enquiry: {
      source: 'sms',
      contactName: 'Mike',
      phone: '+440798765432',
      email: null,
      message: 'Yes please, sounds good. Can you come on Thursday?',
    },
    expectedUrgency: 'medium',
    isReply: true,
    previousInteractions: [
      { direction: 'sent', channel: 'sms', content: "Hi Mike, thanks for reaching out to Sam's Plumbing. Happy to help with that leaking tap — when would suit you for us to come and take a look?" },
      { direction: 'received', channel: 'sms', content: 'How much would it cost roughly?' },
      { direction: 'sent', channel: 'sms', content: "Hi Mike, it depends on the tap type, but typically £80-£120 for a standard tap repair. We give a fixed price before starting any work so there's no surprises." },
    ],
  },
];

// ─── Demo Runner ─────────────────────────────────────────────────────────────

async function runDemo() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🤖 ReplyAI — Demo Mode');
  console.log(`  🏪 ${demoBusiness.business_name} — ${demoBusiness.service_type}`);
  console.log('═══════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    console.log(`\n─── Scenario ${scenario.id}: ${scenario.title} ───\n`);

    const { enquiry } = scenario;

    // 1. Detect urgency
    const detectedUrgency = detect(enquiry.message || '');
    const urgencyMatch = detectedUrgency === scenario.expectedUrgency;
    console.log(`  📊 Urgency: detected="${detectedUrgency}" expected="${scenario.expectedUrgency}" ${urgencyMatch ? '✓' : '✗'}`);
    if (!urgencyMatch) failed++; else passed++;

    // 2. Generate AI response (SMS or email)
    const channel = enquiry.source === 'email' ? 'email' : 'sms';

    if (!scenario.isReply) {
      // Day 0 — Immediate response
      const response = await generateResponse(demoBusiness, enquiry, {
        channel,
        followUpDay: 0,
        interactions: [],
      });

      console.log(`  📬 Channel: ${channel.toUpperCase()}`);
      console.log(`  💬 Response (Day 0):`);
      console.log(`     "${response.content}"\n`);
      passed++;
    } else {
      // This is a reply — generate Day 0 response with context
      const response = await generateResponse(demoBusiness, enquiry, {
        channel,
        followUpDay: 0,
        interactions: scenario.previousInteractions,
      });

      console.log(`  📬 Channel: ${channel.toUpperCase()}`);
      console.log(`  💬 Reply Response (with conversation context):`);
      console.log(`     "${response.content}"\n`);
      passed++;
    }

    // 3. Show follow-up sequencing (simulate Day 1, 3, 7)
    if (detectedUrgency !== 'emergency') {
      console.log(`  📅 Follow-up simulation:`);

      const followUpDays = [
        { day: 1, label: 'Day 1 (24h)' },
        { day: 3, label: 'Day 3 (72h)' },
        { day: 7, label: 'Day 7 (7 days)' },
      ];

      // For the booking scenario, stop the sequence early
      const stopAfter = scenario.isReply ? 0 : 7;

      for (const fu of followUpDays) {
        if (fu.day > stopAfter) {
          const fuResponse = await generateResponse(demoBusiness, enquiry, {
            channel,
            followUpDay: fu.day,
            interactions: scenario.isReply ? scenario.previousInteractions : [],
          });

          console.log(`     ${fu.label}: "${fuResponse.content.slice(0, 120)}..."`);
        }
      }

      // If this was a booking reply, show scheduling link
      if (scenario.isReply) {
        console.log(`     ✅ Lead wants to book! Sending Calendly link: ${demoBusiness.calendly_link}`);
      }
    } else {
      console.log(`  🚨 Emergency detected — prioritising immediate response, skipping follow-up simulation`);
    }

    // Divider
    if (scenario.id < scenarios.length) {
      console.log(`  ${'─'.repeat(55)}`);
    }
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  ✅ Demo Complete — ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('  ⚠️  Some urgency detections didn\'t match. Check the urgency detector keywords.');
  } else {
    console.log('  🎉 All scenarios handled correctly!');
    console.log(`  📌 Next steps:`);
    console.log(`     1. Set up your Supabase database with schema.sql`);
    console.log(`     2. Add your API keys to .env`);
    console.log(`     3. Run \`npm start\` to start the server`);
    console.log(`     4. Configure Twilio/SendGrid webhooks to point at /webhooks/*`);
  }

  console.log('');
}

// ─── Run ─────────────────────────────────────────────────────────────────────

runDemo().catch(err => {
  console.error('\n❌ Demo error:', err);
  process.exit(1);
});