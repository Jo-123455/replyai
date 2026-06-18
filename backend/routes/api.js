/**
 * API Routes
 * RESTful endpoints for the dashboard frontend.
 * Handles business management, enquiry CRUD, stats, and auth.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/supabase');

// Simple in-memory token store for demo/dev auth
// In production, use proper JWT
const tokens = new Map();

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * POST /api/businesses/auth
 * Simple password-based login (demo-ready, use proper auth in production).
 * Body: { email, password }
 */
router.post('/businesses/auth', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const business = await db.getBusinessByEmail(email);
    if (!business) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple SHA-256 hash comparison (use bcrypt in production)
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (business.password_hash !== hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a simple token
    const token = crypto.randomBytes(32).toString('hex');
    tokens.set(token, business.id);

    res.json({
      token,
      business: {
        id: business.id,
        businessName: business.business_name,
        serviceType: business.service_type,
        email: business.email,
        phone: business.phone,
      },
    });
  } catch (err) {
    console.error('[api] Auth error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ─── Businesses ──────────────────────────────────────────────────────────────

/**
 * POST /api/businesses
 * Create a new business (signup).
 */
router.post('/businesses', async (req, res) => {
  try {
    const {
      businessName,
      serviceType,
      toneOfVoice,
      phone,
      email,
      password,
      calendlyLink,
    } = req.body;

    if (!businessName || !serviceType) {
      return res.status(400).json({ error: 'Business name and service type are required' });
    }

    // Hash the password
    const passwordHash = password
      ? crypto.createHash('sha256').update(password).digest('hex')
      : null;

    const business = await db.createBusiness({
      businessName,
      serviceType,
      toneOfVoice,
      phone,
      email,
      passwordHash,
      calendlyLink,
    });

    // Generate auth token
    const token = crypto.randomBytes(32).toString('hex');
    tokens.set(token, business.id);

    res.status(201).json({
      success: true,
      business: {
        id: business.id,
        businessName: business.business_name,
        serviceType: business.service_type,
      },
      token,
    });
  } catch (err) {
    console.error('[api] Create business error:', err.message);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

/**
 * GET /api/businesses/:id
 * Get business settings.
 */
router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await db.getBusiness(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      id: business.id,
      businessName: business.business_name,
      serviceType: business.service_type,
      toneOfVoice: business.tone_of_voice,
      businessHours: business.business_hours,
      phone: business.phone,
      email: business.email,
      calendlyLink: business.calendly_link,
      avgJobValue: business.avg_job_value,
    });
  } catch (err) {
    console.error('[api] Get business error:', err.message);
    res.status(500).json({ error: 'Failed to get business' });
  }
});

/**
 * PATCH /api/businesses/:id
 * Update business settings.
 */
router.patch('/businesses/:id', async (req, res) => {
  try {
    const allowedFields = [
      'business_name', 'service_type', 'tone_of_voice',
      'business_hours', 'phone', 'email', 'calendly_link',
      'avg_job_value',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Map camelCase from frontend to snake_case DB fields
    if (req.body.businessName !== undefined) updates.business_name = req.body.businessName;
    if (req.body.serviceType !== undefined) updates.service_type = req.body.serviceType;
    if (req.body.toneOfVoice !== undefined) updates.tone_of_voice = req.body.toneOfVoice;
    if (req.body.businessHours !== undefined) updates.business_hours = req.body.businessHours;
    if (req.body.calendlyLink !== undefined) updates.calendly_link = req.body.calendlyLink;
    if (req.body.avgJobValue !== undefined) updates.avg_job_value = req.body.avgJobValue;

    const business = await db.updateBusiness(req.params.id, updates);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({ success: true, business });
  } catch (err) {
    console.error('[api] Update business error:', err.message);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

// ─── Enquiries ───────────────────────────────────────────────────────────────

/**
 * GET /api/enquiries
 * List enquiries, optionally filtered by business_id.
 */
router.get('/enquiries', async (req, res) => {
  try {
    const { business_id, limit, offset } = req.query;

    if (!business_id) {
      return res.status(400).json({ error: 'business_id query parameter required' });
    }

    const enquiries = await db.getEnquiries(
      business_id,
      parseInt(limit, 10) || 50,
      parseInt(offset, 10) || 0
    );

    res.json({ enquiries, total: enquiries.length });
  } catch (err) {
    console.error('[api] List enquiries error:', err.message);
    res.status(500).json({ error: 'Failed to list enquiries' });
  }
});

/**
 * GET /api/enquiries/:id
 * Get single enquiry with interactions.
 */
router.get('/enquiries/:id', async (req, res) => {
  try {
    const enquiry = await db.getEnquiry(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json(enquiry);
  } catch (err) {
    console.error('[api] Get enquiry error:', err.message);
    res.status(500).json({ error: 'Failed to get enquiry' });
  }
});

/**
 * PATCH /api/enquiries/:id
 * Update enquiry status, pause/unpause follow-ups.
 */
router.patch('/enquiries/:id', async (req, res) => {
  try {
    const allowedUpdates = ['status', 'follow_up_paused', 'contact_name', 'phone', 'email'];
    const updates = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Map camelCase
    if (req.body.followUpPaused !== undefined) updates.follow_up_paused = req.body.followUpPaused;
    if (req.body.contactName !== undefined) updates.contact_name = req.body.contactName;

    const enquiry = await db.updateEnquiry(req.params.id, updates);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // If marking as booked, pause follow-ups
    if (updates.status === 'booked') {
      await db.updateEnquiry(enquiry.id, { follow_up_paused: true });
    }

    res.json({ success: true, enquiry });
  } catch (err) {
    console.error('[api] Update enquiry error:', err.message);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// ─── Stats ───────────────────────────────────────────────────────────────────

/**
 * GET /api/stats
 * Get business stats — total enquiries, booked, replied, avg response time.
 */
router.get('/stats', async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({ error: 'business_id query parameter required' });
    }

    const stats = await db.getStats(business_id);

    res.json(stats);
  } catch (err) {
    console.error('[api] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ─── Health Check ────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;