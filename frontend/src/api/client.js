// Thin client for the real backend API (no mock data)
// Uses REACT_APP_API_BASE_URL; in dev, falls back to http://localhost:3001

const API_BASE_URL = (
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL)
  || (typeof window !== 'undefined' && window.location?.hostname && (
      // If running on GitHub Pages and no env var, default to Render backend
      /github\.io$/.test(window.location.hostname)
        ? 'https://car-match-h2gw.onrender.com'
        : `${window.location.protocol}//${window.location.hostname}:3001`
     ))
  || ''
);

const json = (resp) => resp.json();
const ok = async (resp) => {
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try { const e = await resp.json(); if (e && e.message) msg = e.message; } catch {}
    throw new Error(msg);
  }
  return resp;
};

const authHeader = (token) => ({ 'Authorization': `Bearer ${token}` });
const jsonHeader = { 'Content-Type': 'application/json' };

const getStoredToken = () => {
  if (typeof localStorage !== 'undefined') return localStorage.getItem('authToken');
  return null;
};

const normalizeEvent = (e = {}) => {
  const id = e.id != null ? String(e.id) : (e._id ? String(e._id) : undefined);
  return {
    id,
    title: e.name || e.title,
    name: e.name || e.title,
    date: e.date,
    location: e.location,
    description: e.description,
    rsvpCount: Array.isArray(e.rsvps) ? e.rsvps.length : (e.rsvpCount || 0),
    schedule: e.schedule || [],
    comments: e.comments || [],
    image: e.image || e.thumbnail || 'https://via.placeholder.com/600x300.png?text=Event',
    thumbnail: e.thumbnail,
    createdByUserId: e.createdByUserId != null ? String(e.createdByUserId) : undefined,
    createdByUsername: e.createdByUsername,
    rsvps: e.rsvps || [],
    threadId: e.threadId,
    tags: e.tags || [],
  };
};

const api = {
  // --- Auth ---
  registerUser: async (userData) =>
    ok(await fetch(`${API_BASE_URL}/register`, { method: 'POST', headers: jsonHeader, body: JSON.stringify(userData) })).then(json),

  loginUser: async (username, password) =>
    ok(await fetch(`${API_BASE_URL}/login`, { method: 'POST', headers: jsonHeader, body: JSON.stringify({ username, password }) })).then(json),

  getCurrentUser: async () => {
    const token = getStoredToken();
    if (!token) throw new Error('Not authenticated');
    const data = await api.getMe(token);
    return data.user;
  },

  // --- Messages ---
  fetchMessages: async (token, category, filters = {}) => {
    let qs = `?category=${encodeURIComponent(category||'inbox')}`;
    if (filters.filterGender) qs += `&filterGender=${encodeURIComponent(filters.filterGender)}`;
    if (filters.filterRadius) qs += `&filterRadius=${encodeURIComponent(filters.filterRadius)}`;
    if (filters.sortBy) qs += `&sortBy=${encodeURIComponent(filters.sortBy)}`;
    return ok(await fetch(`${API_BASE_URL}/messages/inbox${qs}`, { headers: { ...jsonHeader, ...authHeader(token) } })).then(json);
  },

  sendMessage: async (...args) => {
    // Support legacy signature sendMessage(token, recipient, text)
    // and older experimental sendMessage({ senderId, text }) -> no-op
    if (typeof args[0] === 'string') {
      const [token, recipientUsername, text] = args;
      return ok(await fetch(`${API_BASE_URL}/messages`, { method: 'POST', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ recipientUsername, text }) })).then(json);
    }
    // Legacy shim: not supported without auth
    return Promise.reject(new Error('sendMessage requires auth token'));
  },

  // --- Events ---
  getEvents: async () => {
    const events = await ok(await fetch(`${API_BASE_URL}/events`)).then(json);
    return (events || []).map(normalizeEvent);
  },
  getEvent: async (eventId) => normalizeEvent(await ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}`)).then(json)),
  ensureEventThread: async (eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/ensure-thread`, { method: 'POST' })).then(json),

  createEvent: async (token, payload) => {
    const res = await ok(await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { ...jsonHeader, ...authHeader(token) },
      body: JSON.stringify(payload),
    })).then(json);
    return { ...res, data: normalizeEvent(res?.data) };
  },

  rsvpToEvent: async (token, eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'POST', headers: { ...jsonHeader, ...authHeader(token) } })).then(json),
  cancelRsvp: async (token, eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),

  getMyRsvps: async (token) =>
    ok(await fetch(`${API_BASE_URL}/my-rsvps`, { headers: { ...jsonHeader, ...authHeader(token) } })).then(json),

  // For profile page convenience
  getUserEvents: async () => {
    const token = getStoredToken();
    if (!token) throw new Error('Not authenticated');
    const data = await ok(await fetch(`${API_BASE_URL}/users/me/events`, { headers: { ...authHeader(token) } })).then(json);
    return (data.events || []).map(normalizeEvent);
  },

  // --- Forums ---
  getForumCategories: async () => ok(await fetch(`${API_BASE_URL}/forums/categories`)).then(json),
  getForumStats: async () => ok(await fetch(`${API_BASE_URL}/forums/stats`)).then(json),
  getSiteStats: async () => ok(await fetch(`${API_BASE_URL}/stats/site`)).then(json),

  getThreadsByCategory: async (categoryId, { search = '', page = 1, pageSize = 20 } = {}) => {
    const qs = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) }).toString();
    return ok(await fetch(`${API_BASE_URL}/forums/categories/${encodeURIComponent(categoryId)}/threads?${qs}`)).then(json);
  },

  getThreadById: async (threadId) => ok(await fetch(`${API_BASE_URL}/forums/threads/${encodeURIComponent(threadId)}`)).then(json),

  createThread: async (token, { categoryId, title }) =>
    ok(await fetch(`${API_BASE_URL}/forums/threads`, { method: 'POST', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ categoryId, title }) })).then(json),

  addPostToThread: async (token, { threadId, body }) =>
    ok(await fetch(`${API_BASE_URL}/forums/threads/${encodeURIComponent(threadId)}/posts`, { method: 'POST', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ body }) })).then(json),

  pinThread: async (token, threadId, pinned) =>
    ok(await fetch(`${API_BASE_URL}/forums/threads/${encodeURIComponent(threadId)}/pin`, { method: 'PATCH', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ pinned }) })).then(json),

  lockThread: async (token, threadId, locked) =>
    ok(await fetch(`${API_BASE_URL}/forums/threads/${encodeURIComponent(threadId)}/lock`, { method: 'PATCH', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ locked }) })).then(json),

  deleteThread: async (token, threadId) =>
    ok(await fetch(`${API_BASE_URL}/forums/threads/${encodeURIComponent(threadId)}`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),

  reportPost: async (token, postId, reason) =>
    ok(await fetch(`${API_BASE_URL}/forums/posts/${encodeURIComponent(postId)}/report`, { method: 'POST', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ reason }) })).then(json),

  // --- Account management ---
  upgradeToPremium: async (token, userId) =>
    ok(await fetch(`${API_BASE_URL}/users/${userId}/upgrade-to-premium`, { method: 'PUT', headers: { ...jsonHeader, ...authHeader(token) } })).then(json),

  toggleDevOverride: async (token, userId) =>
    ok(await fetch(`${API_BASE_URL}/users/${userId}/toggle-dev-override`, { method: 'PUT', headers: { ...jsonHeader, ...authHeader(token) } })).then(json),

  // --- Account / Settings ---
  getMe: async (token) => ok(await fetch(`${API_BASE_URL}/users/me`, { headers: { ...authHeader(token) } })).then(json),
  updateUser: async (token, userId, data) =>
    ok(await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}`, { method: 'PATCH', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify(data) })).then(json),
  deleteUser: async (token, userId) =>
    ok(await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),
  addEventComment: async (token, eventId, text) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/comments`, { method: 'POST', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ text }) })).then(json),
  editEventComment: async (token, eventId, commentId, text) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/comments/${encodeURIComponent(commentId)}`, { method: 'PUT', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ text }) })).then(json),
  deleteEventComment: async (token, eventId, commentId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),
  updateEvent: async (token, eventId, data) => {
    const res = await ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}`, {
      method: 'PUT',
      headers: { ...jsonHeader, ...authHeader(token) },
      body: JSON.stringify(data),
    })).then(json);
    return normalizeEvent(res);
  },
  deleteEvent: async (token, eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),
};

export default api;
