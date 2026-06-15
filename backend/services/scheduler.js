/**
 * Follow-Up Scheduler
 * Runs every 5 minutes, checks for enquiries needing follow-ups at
 * Day 0 (immediate), Day 1, Day 3, and Day 7.
 * Stops sequence when lead replies or status changes to booked.
 */

const cron = require('node-cron');
const db = require('../db/supabase');
const { generateResponse } = require('./aiAgent');

const TASK = '*/5 * * * *'; // Every 5 minutes

// Follow-up schedule: after how many minutes to send each follow-up
const FOLLOW_UP_MINUTES = {
  0: 0,     // Immediate (within first few minutes)
  1: 1440,  // Day 1 (24 hours)
  3: 4320,  // Day 3 (72 hours)
  7: 10080, // Day 7 (7 days)
};

// Label for logging
const FOLLOW_UP_LABELS = {
  0: 'Day 0 (immediate)',
  1: 'Day 1 (24h)',
  3: 'Day 3 (72h)',
  7: 'Day 7 (7 days)',
};

let isRunning = false;

/**
 * Start the follow-up scheduler.
 */
function start() {
  if (isRunning) {
    console.log('[scheduler] Already running');
    return;
  }

  console.log('[scheduler] Starting — checking every 5 minutes');
  cron.schedule(TASK, runCheck);
  isRunning = true;

  // Also run an immediate check
  runCheck();
}

/**
 * Main check — finds enquiries needing a follow-up.
 */
async function runCheck() {
  try {
    console.log('[scheduler] Running follow-up check...');

    // For demo mode without DB, log and skip
    const client = db.getClient();
    if (!client) {
      console.log('[scheduler] No DB client — skipping (demo mode)');
      return;
    }

    const now = new Date();

    // Get all active enquiries that need follow-ups
    const { data: enquiries, error } = await client
      .from('enquiries')
      .select('*, businesses(*)')
      .in('status', ['new', 'in_progress'])
      .eq('follow_up_paused', false);

    if (error) {
      console.error('[scheduler] DB query error:', error.message);
      return;
    }

    if (!enquiries || enquiries.length === 0) {
      console.log('[scheduler] No enquiries needing follow-up');
      return;
    }

    for (const enquiry of enquiries) {
      await processEnquiry(enquiry, now);
    }

    console.log(`[scheduler] Check complete — processed ${enquiries.length} enquiries`);
  } catch (err) {
    console.error('[scheduler] Error in runCheck:', err.message);
  }
}

/**
 * Process a single enquiry — send follow-up if scheduled.
 */
async function processEnquiry(enquiry, now) {
  try {
    const createdAt = new Date(enquiry.created_at);
    const elapsedMinutes = (now - createdAt) / (1000 * 60);
    const business = enquiry.businesses;

    if (!business) {
      console.warn(`[scheduler] Enquiry ${enquiry.id} has no business data — skipping`);
      return;
    }

    // Determine which follow-up day we're on
    let currentDay = enquiry.follow_up_day;

    // Find the next follow-up to send
    const scheduleDays = Object.keys(FOLLOW_UP_MINUTES).map(Number).sort((a, b) => a - b);

    for (const day of scheduleDays) {
      if (day <= currentDay) continue; // Already sent this one

      const requiredMinutes = FOLLOW_UP_MINUTES[day];
      if (elapsedMinutes >= requiredMinutes) {
        // Time to send this follow-up
        await sendFollowUp(enquiry, business, day);
        return; // Only send one at a time
      } else {
        break; // Future days require more minutes, don't skip ahead
      }
    }

    // Check if we should mark as closed (all follow-ups sent and 14+ days old)
    if (currentDay >= 7 && elapsedMinutes > 20160) { // 14 days
      await db.updateEnquiry(enquiry.id, { status: 'closed', follow_up_paused: true });
      console.log(`[scheduler] Enquiry ${enquiry.id} closed after 14 days inactivity`);
    }
  } catch (err) {
    console.error(`[scheduler] Error processing enquiry ${enquiry.id}:`, err.message);
  }
}

/**
 * Send a follow-up message for an enquiry.
 */
async function sendFollowUp(enquiry, business, day) {
  try {
    console.log(`[scheduler] Sending ${FOLLOW_UP_LABELS[day]} follow-up for enquiry ${enquiry.id}`);

    // Determine channel — prefer SMS if we have a phone number, else email
    const channel = enquiry.phone ? 'sms' : 'email';

    // Get previous interactions for context
    const interactions = await db.getInteractions(enquiry.id);

    // Generate the follow-up message
    const { content } = await generateResponse(business, enquiry, {
      channel,
      followUpDay: day,
      interactions,
    });

    // Log the interaction (in production this would send via Twilio/SendGrid)
    await db.createInteraction({
      enquiryId: enquiry.id,
      direction: 'sent',
      channel,
      content,
    });

    // Update the enquiry's follow_up_day
    await db.updateEnquiry(enquiry.id, {
      follow_up_day: day,
      status: 'in_progress',
    });

    console.log(`[scheduler] ✓ ${FOLLOW_UP_LABELS[day]} follow-up sent via ${channel}`);
    console.log(`[scheduler]   Message: "${content.slice(0, 100)}..."`);
  } catch (err) {
    console.error(`[scheduler] Failed to send follow-up for enquiry ${enquiry.id}:`, err.message);
  }
}

module.exports = { start };