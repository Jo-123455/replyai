/**
 * ReplyAI Backend — Main Application Entry Point
 *
 * AI-powered lead follow-up agent for tradesmen.
 * Handles missed calls, SMS, email, and web form enquiries
 * with intelligent AI follow-up sequencing.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhooks');
const scheduler = require('./services/scheduler');

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: '*', // In production, restrict to your frontend domain
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies (for API and web form webhooks)
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded bodies (for Twilio webhooks)
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ─── Serve Frontend Dashboard ────────────────────────────────────────────────

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// ─── Routes ──────────────────────────────────────────────────────────────────

// API routes (dashboard backend)
app.use('/api', apiRoutes);

// Webhook routes (external integrations)
app.use('/webhooks', webhookRoutes);

// Root serves the React dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// ─── Error Handler ───────────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error(`[error] ${err.message}`);
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: config.isDev ? err.message : 'Internal server error',
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────

app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n  ⚡ ReplyAI Backend v1.0.0`);
  console.log(`  🚀 Server running on http://0.0.0.0:${config.port}`);
  console.log(`  📋 Environment: ${config.nodeEnv}`);

  if (config.isDev) {
    console.log(`  🧪 Demo mode available: npm run demo`);
  }

  // Start the follow-up scheduler
  if (config.supabaseUrl && config.supabaseServiceKey) {
    scheduler.start();
    console.log(`  ⏰ Follow-up scheduler active`);
  } else {
    console.log(`  ℹ️  Scheduler inactive — no Supabase credentials`);
  }

  console.log('');
});

module.exports = app;