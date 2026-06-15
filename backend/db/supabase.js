/**
 * Supabase database client
 * Central point for all database queries.
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

let supabase = null;

/**
 * Get (or create) the Supabase client instance.
 * Returns null if credentials are missing (e.g. in demo mode).
 */
function getClient() {
  if (supabase) return supabase;

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — running without DB');
    return null;
  }

  supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  return supabase;
}

// ─── Businesses ──────────────────────────────────────────────────────────────

async function createBusiness(data) {
  const client = getClient();
  if (!client) return mockCreate('businesses', data);

  const { data: result, error } = await client
    .from('businesses')
    .insert([{
      business_name: data.businessName,
      service_type: data.serviceType,
      tone_of_voice: data.toneOfVoice || 'professional',
      business_hours: data.businessHours || null,
      phone: data.phone,
      email: data.email,
      calendly_link: data.calendlyLink || null,
      password_hash: data.passwordHash,
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create business: ${error.message}`);
  return result;
}

async function getBusiness(id) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

async function getBusinessByEmail(email) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('businesses')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return null;
  return data;
}

async function updateBusiness(id, updates) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update business: ${error.message}`);
  return data;
}

// ─── Enquiries ───────────────────────────────────────────────────────────────

async function createEnquiry(data) {
  const client = getClient();
  if (!client) return mockCreate('enquiries', data);

  const { data: result, error } = await client
    .from('enquiries')
    .insert([{
      business_id: data.businessId,
      source: data.source,
      contact_name: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      message: data.message || null,
      urgency: data.urgency || 'low',
      status: 'new',
      follow_up_day: 0,
      follow_up_paused: false,
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create enquiry: ${error.message}`);
  return result;
}

async function getEnquiries(businessId, limit = 50, offset = 0) {
  const client = getClient();
  if (!client) return [];

  let query = client
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get enquiries: ${error.message}`);
  return data || [];
}

async function getEnquiry(id) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('enquiries')
    .select('*, interactions(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

async function updateEnquiry(id, updates) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('enquiries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update enquiry: ${error.message}`);
  return data;
}

// ─── Interactions ────────────────────────────────────────────────────────────

async function createInteraction(data) {
  const client = getClient();
  if (!client) return mockCreate('interactions', data);

  const { data: result, error } = await client
    .from('interactions')
    .insert([{
      enquiry_id: data.enquiryId,
      direction: data.direction,
      channel: data.channel,
      content: data.content,
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create interaction: ${error.message}`);
  return result;
}

async function getInteractions(enquiryId) {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('interactions')
    .select('*')
    .eq('enquiry_id', enquiryId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to get interactions: ${error.message}`);
  return data || [];
}

// ─── Stats ───────────────────────────────────────────────────────────────────

async function getStats(businessId) {
  const client = getClient();
  if (!client) return getMockStats();

  const { data: enquiries, error } = await client
    .from('enquiries')
    .select('*')
    .eq('business_id', businessId);

  if (error) return getMockStats();

  const total = enquiries.length;
  const booked = enquiries.filter(e => e.status === 'booked').length;
  const inProgress = enquiries.filter(e => e.status === 'in_progress').length;
  const closed = enquiries.filter(e => e.status === 'closed').length;
  const newCount = enquiries.filter(e => e.status === 'new').length;

  return { total, booked, inProgress, closed, new: newCount };
}

// ─── Mock helpers (for demo mode) ────────────────────────────────────────────

let mockIdCounter = 0;

function mockCreate(table, data) {
  mockIdCounter++;
  const id = `mock-${table}-${mockIdCounter}-${Date.now()}`;
  console.log(`[mock-db] Created ${table}:`, JSON.stringify({ id, ...data }).slice(0, 200));
  return { id, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

function getMockStats() {
  return { total: 0, booked: 0, inProgress: 0, closed: 0, new: 0 };
}

module.exports = {
  getClient,
  createBusiness,
  getBusiness,
  getBusinessByEmail,
  updateBusiness,
  createEnquiry,
  getEnquiries,
  getEnquiry,
  updateEnquiry,
  createInteraction,
  getInteractions,
  getStats,
};