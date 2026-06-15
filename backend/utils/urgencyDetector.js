/**
 * Urgency detector — analyses message content for emergency keywords.
 * Returns: 'emergency' | 'high' | 'medium' | 'low'
 */

const EMERGENCY_KEYWORDS = [
  'burst pipe', 'burst', 'flooding', 'flood', 'gas leak', 'gas',
  'no heat', 'no heating', 'no water', 'without water',
  'electric shock', 'fire', 'smoke', 'carbon monoxide', 'faulty wiring',
  'power outage', 'no power', 'blackout', 'water damage',
  'emergency', 'urgent',
];

const HIGH_KEYWORDS = [
  'asap', 'as soon as possible', 'today', 'right away', 'immediately',
  'quickly', 'fast', 'soon', 'cannot wait', 'can\'t wait', 'broken',
  'leak', 'leaking', 'dripping', 'not working', 'overflow', 'clogged',
  'blocked', 'trouble', 'problem', 'help', 'needed now',
];

/**
 * Analyse message text and return urgency level.
 * @param {string} message - The enquiry message or voicemail text
 * @returns {string} - 'emergency' | 'high' | 'medium' | 'low'
 */
function detectUrgency(message) {
  if (!message || typeof message !== 'string') return 'low';

  const lower = message.toLowerCase();

  // Check emergency keywords first
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'emergency';
    }
  }

  // Check high urgency keywords
  for (const keyword of HIGH_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'high';
    }
  }

  // Check for question marks or detail (medium)
  if (lower.length > 50 || lower.includes('?')) {
    return 'medium';
  }

  return 'low';
}

module.exports = { detectUrgency };