/**
 * Webhook Routes
 * Handles incoming events from Twilio (missed calls, SMS) and SendGrid (email).
 * Also accepts web form submissions directly.
 */

const express = require('express');
const router = express.Router();
const db = require('../db/supabase');
const { generateResponse } = require('../services/aiAgent');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Process an incoming enquiry: store it, generate AI response, log interaction.
 */
async function processEnquiry(businessId, source, data) {
  // Look up the business
  const business = await db.getBusiness(businessId);
  if (!business) {
    console.error(`[webhooks] Business not found: ${businessId}`);
    return { error: 'Business not found' };
  }

  // Create the enquiry record
  const enquiry = await db.createEnquiry({
    businessId,
    source,
    contactName: data.contactName,
    phone: data.phone,
    email: data.email,
    message: data.message,
    urgency: data.urgency || 'low',
  });

  console.log(`[webhooks] Created enquiry ${enquiry.id} from ${source}`);

  // Generate AI response (immediate — Day 0 follow-up)
  const channel = source === 'email' ? 'email' : 'sms';
  const { content, urgency } = await generateResponse(business, enquiry, {
    channel,
    followUpDay: 0,
  });

  // Log the interaction
  await db.createInteraction({
    enquiryId: enquiry.id,
    direction: 'sent',
    channel,
    content,
  });

  // Update the enquiry with urgency detection
  await db.updateEnquiry(enquiry.id, { urgency });

  console.log(`[webhooks] Generated response for enquiry ${enquiry.id}: "${content.slice(0, 100)}..."`);

  return {
    enquiry,
    response: content,
    channel,
  };
}

// ─── Twilio: Missed Call ─────────────────────────────────────────────────────

router.post('/twilio/missed-call', async (req, res) => {
  try {
    console.log('[webhooks] Received missed call event');

    // Twilio sends: CallSid, From (caller number), To (your number), etc.
    const callerNumber = req.body.From || req.body.from;
    const calledNumber = req.body.To || req.body.to;

    // In production, look up the business by the called number
    // For now, use a demo business ID or accept it in the request
    const businessId = req.body.businessId || req.query.businessId;

    if (!businessId) {
      return res.status(400).json({ error: 'Missing businessId' });
    }

    const result = await processEnquiry(businessId, 'missed_call', {
      contactName: req.body.contactName || null,
      phone: callerNumber,
      message: req.body.message || null,
    });

    // Return TwiML if needed (for call routing)
    res.json({
      success: true,
      enquiryId: result.enquiry.id,
      autoResponse: result.response,
    });
  } catch (err) {
    console.error('[webhooks] Error handling missed call:', err.message);
    res.status(500).json({ error: 'Failed to process missed call' });
  }
});

// ─── Twilio: Incoming SMS ────────────────────────────────────────────────────

router.post('/twilio/sms', async (req, res) => {
  try {
    console.log('[webhooks] Received incoming SMS');

    const fromNumber = req.body.From || req.body.from;
    const body = req.body.Body || req.body.body;
    const businessId = req.body.businessId || req.query.businessId;

    if (!businessId) {
      return res.status(400).json({ error: 'Missing businessId' });
    }

    // Check if this is a reply to an existing enquiry
    const enquiries = await db.getEnquiries(businessId);
    const existingEnquiry = enquiries.find(e => e.phone === fromNumber && e.status !== 'closed');

    if (existingEnquiry) {
      // This is a reply — log the interaction and unpause follow-ups
      await db.createInteraction({
        enquiryId: existingEnquiry.id,
        direction: 'received',
        channel: 'sms',
        content: body,
      });

      // Check if they want to book
      const bookingIntent = /book|schedule|yes|please|when|available/i.test(body);
      if (bookingIntent) {
        await db.updateEnquiry(existingEnquiry.id, { status: 'booked', follow_up_paused: true });
      } else {
        await db.updateEnquiry(existingEnquiry.id, { follow_up_paused: false });
      }

      return res.json({ success: true, reply: true, enquiryId: existingEnquiry.id });
    }

    // New enquiry from SMS
    const result = await processEnquiry(businessId, 'sms', {
      phone: fromNumber,
      message: body,
      contactName: req.body.contactName || fromNumber,
    });

    res.json({
      success: true,
      enquiryId: result.enquiry.id,
    });
  } catch (err) {
    console.error('[webhooks] Error handling SMS:', err.message);
    res.status(500).json({ error: 'Failed to process SMS' });
  }
});

// ─── SendGrid: Incoming Email ────────────────────────────────────────────────

router.post('/sendgrid', async (req, res) => {
  try {
    console.log('[webhooks] Received incoming email');

    // SendGrid inbound parse sends: from, to, subject, text, html, etc.
    const from = req.body.from || req.body.From;
    const subject = req.body.subject || req.body.Subject;
    const text = req.body.text || req.body.Text || req.body['body-plain'] || '';
    const businessId = req.body.businessId || req.query.businessId;

    if (!businessId) {
      return res.status(400).json({ error: 'Missing businessId' });
    }

    const result = await processEnquiry(businessId, 'email', {
      contactName: from ? from.split('<')[0].trim() || from : 'Unknown',
      email: from ? (from.match(/<([^>]+)>/) || [null, from])[1] : null,
      message: `${subject ? `Subject: ${subject}\n\n` : ''}${text}`,
    });

    res.json({
      success: true,
      enquiryId: result.enquiry.id,
    });
  } catch (err) {
    console.error('[webhooks] Error handling email:', err.message);
    res.status(500).json({ error: 'Failed to process email' });
  }
});

// ─── Contact Form ────────────────────────────────────────────────────────────

router.post('/contact-form', async (req, res) => {
  try {
    console.log('[webhooks] Received web form submission');

    const {
      businessId,
      name,
      email,
      phone,
      message,
    } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: 'Missing businessId' });
    }

    const result = await processEnquiry(businessId, 'web_form', {
      contactName: name || email || phone || 'Website Visitor',
      phone: phone,
      email: email,
      message: message || 'No message provided',
    });

    res.json({
      success: true,
      enquiryId: result.enquiry.id,
    });
  } catch (err) {
    console.error('[webhooks] Error handling contact form:', err.message);
    res.status(500).json({ error: 'Failed to process contact form' });
  }
});

module.exports = router;