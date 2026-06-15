/**
 * API client for ReplyAI
 * All API calls go through here — handles auth headers, error handling, and 401 redirects.
 * Matches the Express backend routes in routes/api.js
 */

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('replyai_token');
}

function getBusinessId() {
  return localStorage.getItem('replyai_business_id');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('replyai_token');
    localStorage.removeItem('replyai_business_id');
    localStorage.removeItem('replyai_business_name');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Something went wrong');
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────

/**
 * POST /api/businesses — Signup
 */
export async function signup(data) {
  const result = await request('/businesses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  localStorage.setItem('replyai_token', result.token);
  localStorage.setItem('replyai_business_id', result.business.id);
  localStorage.setItem('replyai_business_name', result.business.businessName);
  return result;
}

/**
 * POST /api/businesses/auth — Login
 */
export async function login(email, password) {
  const result = await request('/businesses/auth', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('replyai_token', result.token);
  localStorage.setItem('replyai_business_id', result.business.id);
  localStorage.setItem('replyai_business_name', result.business.businessName);
  return result;
}

export function logout() {
  localStorage.removeItem('replyai_token');
  localStorage.removeItem('replyai_business_id');
  localStorage.removeItem('replyai_business_name');
  window.location.href = '/';
}

export function isAuthenticated() {
  return !!getToken();
}

// ─── Business / Settings ────────────────────────────────────────────────────

/**
 * GET /api/businesses/:id — Get business profile
 */
export async function getBusiness() {
  const id = getBusinessId();
  if (!id) throw new Error('Not authenticated');
  return request(`/businesses/${id}`);
}

/**
 * PATCH /api/businesses/:id — Update business settings
 */
export async function updateBusiness(data) {
  const id = getBusinessId();
  if (!id) throw new Error('Not authenticated');
  const result = await request(`/businesses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (data.businessName) {
    localStorage.setItem('replyai_business_name', data.businessName);
  }
  return result;
}

// ─── Enquiries ──────────────────────────────────────────────────────────────

/**
 * GET /api/enquiries?business_id=xxx — List enquiries
 */
export async function getEnquiries() {
  const id = getBusinessId();
  if (!id) throw new Error('Not authenticated');
  const result = await request(`/enquiries?business_id=${id}`);
  return result.enquiries || [];
}

/**
 * GET /api/enquiries/:id — Get single enquiry with interactions
 */
export async function getEnquiry(id) {
  return request(`/enquiries/${id}`);
}

/**
 * PATCH /api/enquiries/:id — Update enquiry (status, contact info, etc.)
 */
export async function updateEnquiry(id, data) {
  return request(`/enquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/enquiries/:id — Toggle follow-up paused state
 */
export async function toggleFollowUp(id, paused) {
  return request(`/enquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ follow_up_paused: paused }),
  });
}

// ─── Stats ──────────────────────────────────────────────────────────────────

/**
 * GET /api/stats?business_id=xxx — Get dashboard stats
 */
export async function getStats() {
  const id = getBusinessId();
  if (!id) throw new Error('Not authenticated');
  return request(`/stats?business_id=${id}`);
}

// ─── Admin ──────────────────────────────────────────────────────────────────

/**
 * GET /api/businesses — (Admin) list all businesses
 * Backend route: GET /api/admin/businesses would need to be added.
 * For now, this is a placeholder that returns empty.
 */
export async function getAllBusinesses() {
  // Note: Backend doesn't have an admin routes file yet.
  // This will work once the backend adds GET /api/businesses (no filter)
  try {
    return request('/businesses');
  } catch {
    return [];
  }
}