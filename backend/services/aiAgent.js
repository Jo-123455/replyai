/**
 * AI Agent Service — generates warm, human responses using Anthropic Claude.
 * Never reveals it's AI unless directly asked.
 * Adapts tone based on business settings.
 */

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { detectUrgency } = require('../utils/urgencyDetector');

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_RETRIES = 2;

let anthropic = null;

function getClient() {
  if (anthropic) return anthropic;
  if (config.anthropicApiKey) {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    return anthropic;
  }
  return null;
}

/**
 * Build the system prompt for a specific business.
 */
function buildSystemPrompt(business) {
  const tone = business.tone_of_voice || 'professional';
  const hours = business.business_hours || {};

  let hoursStr = 'Not specified';
  if (hours && typeof hours === 'object') {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const lines = days.map(d => {
      const h = hours[d];
      if (!h) return `${d}: Closed`;
      if (h.start === '00:00' && h.end === '00:00') return `${d}: Closed`;
      return `${d}: ${h.start} - ${h.end}`;
    });
    hoursStr = lines.join('\n');
  }

  return `You are a friendly assistant working for ${business.business_name}, a ${business.service_type} company.

YOUR VOICE:
- You speak with a ${tone} tone — natural, warm, and never robotic.
- Keep SMS replies under 3 short sentences. Never exceed 3 sentences for SMS.
- Keep email replies under 150 words, friendly and helpful.
- Use natural contractions ("I'm", "we'll", "that's") and sound like a real person.
- Never say "I am an AI" or "as an AI" or anything that reveals you are not human.
- If someone asks directly if you're a bot or AI, say you're part of the team helping out.

BUSINESS HOURS:
${hoursStr}

WHAT YOU DO:
1. When someone reaches out, respond warmly acknowledging their message.
2. Offer to help book them in or answer their question.
3. If it's outside business hours, mention you'll pass it to the team and they'll respond when open.
4. If the enquiry sounds urgent (leak, flooding, gas, emergency), acknowledge the urgency and prioritise getting help.
5. Suggest booking a time via Calendly when someone shows interest in proceeding.

FOLLOW-UP STRATEGY — different angles at each stage:
- Day 0 (immediate): Thank them for reaching out, acknowledge their need, offer to help
- Day 1: Friendly check-in, "just wanted to make sure you got our message", offer a different angle
- Day 3: Ask if they've sorted it or still need help, offer a service tip relevant to their issue
- Day 7: Gentle final nudge, "we're still here if you need us", offer a Calendly booking link

IMPORTANT:
- Detect and escalate urgency from language like "burst", "flooding", "leak", "emergency", "broken", "now"
- When someone says they'd like to book or proceed, send them the Calendly link for easy scheduling
- Don't over-ask — if they've already declined, stop messaging`;
}

/**
 * Generate an AI response for an enquiry.
 *
 * @param {object} business - The business record
 * @param {object} enquiry - The enquiry record
 * @param {object} options
 * @param {string} options.channel - 'sms' or 'email'
 * @param {number} options.followUpDay - 0, 1, 3, or 7
 * @param {Array} options.interactions - Previous interactions for context
 * @returns {Promise<{content: string, urgency: string}>}
 */
async function generateResponse(business, enquiry, options = {}) {
  const channel = options.channel || 'sms';
  const followUpDay = options.followUpDay ?? 0;
  const interactions = options.interactions || [];

  const client = getClient();

  // Detect urgency from the message
  const urgency = detectUrgency(enquiry.message || '');

  // Build conversation context from previous interactions
  const history = interactions.map(i =>
    `${i.direction === 'received' ? 'Lead' : 'You'}: ${i.content}`
  ).join('\n');

  const followUpLabels = {
    0: 'Immediate response — acknowledge and engage',
    1: 'Day 1 follow-up — friendly check-in, different angle',
    3: 'Day 3 follow-up — ask if sorted, offer service tip',
    7: 'Day 7 follow-up — gentle final nudge, Calendly link',
  };

  const userPrompt = `You are responding to a lead who contacted ${business.business_name}.

Lead details:
- Name: ${enquiry.contact_name || 'Unknown'}
- Phone: ${enquiry.phone || 'N/A'}
- Email: ${enquiry.email || 'N/A'}
- Message: "${enquiry.message || 'No message — this was a missed call.'}"
- Urgency detected: ${urgency}

Conversation history:
${history || '(No previous messages)'}

Follow-up stage: ${followUpLabels[followUpDay] || 'Immediate response'}

Channel: ${channel.toUpperCase()}

Generate a ${channel === 'sms' ? 'brief SMS (under 3 sentences)' : 'friendly email (under 150 words)'} response:`;

  // If no Anthropic client, return a mock response
  if (!client) {
    return {
      content: getMockResponse(business, enquiry, urgency, followUpDay, channel),
      urgency,
    };
  }

  // Call Claude
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        system: buildSystemPrompt(business),
        messages: [{ role: 'user', content: userPrompt }],
      });

      const content = response.content[0].text.trim();

      // Enforce SMS length
      const finalContent = (channel === 'sms' && countSentences(content) > 3)
        ? truncateToThreeSentences(content)
        : content;

      return { content: finalContent, urgency };
    } catch (err) {
      console.error(`[aiAgent] Claude call attempt ${attempt + 1} failed:`, err.message);
      if (attempt === MAX_RETRIES) {
        // Fallback to mock on error
        return {
          content: getMockResponse(business, enquiry, urgency, followUpDay, channel),
          urgency,
        };
      }
    }
  }
}

/**
 * Get a mock response for demo/dev mode when no API key is present.
 */
function getMockResponse(business, enquiry, urgency, followUpDay, channel) {
  const name = enquiry.contact_name || 'there';
  const bizName = business.business_name || config.demo.businessName;

  const responses = {
    0: {
      sms: {
        emergency: `Hi ${name}, ${bizName} here — we got your urgent message. We'll prioritise this. Can you confirm your address so we can get someone out to you ASAP?`,
        high: `Hi ${name}, thanks for reaching out to ${bizName}. We can get someone to you quickly. When's a good time to stop by?`,
        medium: `Hi ${name}, thanks for contacting ${bizName}. Could you tell us a bit more about what you need? Happy to help.`,
        low: `Hi ${name}, thanks for getting in touch with ${bizName}. Let us know how we can help and we'll get back to you soon.`,
      },
      email: {
        emergency: `Hi ${name},\n\nThank you for reaching out to ${bizName} about this. We understand it's urgent and will prioritise getting someone to you as quickly as possible.\n\nCould you please confirm your address and availability so we can schedule an emergency visit?\n\nBest regards,\nThe ${bizName} Team`,
        high: `Hi ${name},\n\nThanks for contacting ${bizName}. We'll do our best to get to you quickly.\n\nCould you let us know when you'd be available for a visit?\n\nBest regards,\nThe ${bizName} Team`,
        medium: `Hi ${name},\n\nThanks for reaching out to ${bizName}. We'd love to help with your request.\n\nCould you tell us a bit more about what you need so we can best assist?\n\nBest regards,\nThe ${bizName} Team`,
        low: `Hi ${name},\n\nThanks for getting in touch with ${bizName}. We look forward to helping you out.\n\nLet us know what you need and when works for you.\n\nBest regards,\nThe ${bizName} Team`,
      },
    },
    1: {
      sms: `Hi ${name}, just following up from ${bizName} — wanted to make sure you got our message. Still need help with your ${business.service_type || 'job'}?`,
      email: `Hi ${name},\n\nJust a quick follow-up from ${bizName} — we wanted to check you received our previous message.\n\nIf you still need assistance, we'd be happy to help. Let us know!\n\nBest regards,\nThe ${bizName} Team`,
    },
    3: {
      sms: `Hi ${name}, ${bizName} here again. Have you managed to sort things out? If not, we're still here to help. Quick tip: ${getServiceTip(business.service_type)}`,
      email: `Hi ${name},\n\nHope you're doing well! Just checking in to see if you've managed to resolve your ${business.service_type || 'job'} issue.\n\nIf you still need a hand, we'd be happy to help out. We also have availability coming up soon.\n\nBest regards,\nThe ${bizName} Team`,
    },
    7: {
      sms: `Hi ${name}, this is the last nudge from ${bizName} — we're still here if you need us. Here's a link to book directly: ${business.calendly_link || 'get in touch when ready'}`,
      email: `Hi ${name},

We don't want to keep bothering you, but we're still here if you ever need our services.

Feel free to book a time that works for you here:
${business.calendly_link || "Just reply to this email and we'll sort it out."}

Take care,
The ${bizName} Team`,
    },
  };

  const followUp = responses[followUpDay] || responses[0];
  const channelResponses = followUp[channel] || followUp.sms;

  // For day 0, pick by urgency; for days 1/3/7, use the combined response
  if (followUpDay === 0 && typeof channelResponses === 'object') {
    return channelResponses[urgency] || channelResponses.low;
  }

  return channelResponses;
}

/**
 * Get a relevant service tip based on service type.
 */
function getServiceTip(serviceType) {
  const tips = {
    plumber: 'catching small leaks early can save you thousands in water damage.',
    electrician: 'checking your fuse box annually can prevent unexpected outages.',
    hvac: 'changing your air filter every 3 months keeps your system running efficiently.',
    handyman: 'regular small repairs save you from big bills down the road.',
  };
  return tips[serviceType] || 'staying on top of maintenance saves time and money.';
}

/**
 * Count approximate sentences in a string.
 */
function countSentences(text) {
  return (text.match(/[.!?]+/g) || []).length;
}

/**
 * Truncate to the first 3 sentences.
 */
function truncateToThreeSentences(text) {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.slice(0, 3).join(' ');
}

module.exports = { generateResponse, detectUrgency };