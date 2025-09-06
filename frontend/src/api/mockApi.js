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

const getStoredUser = () => {
  if (typeof localStorage !== 'undefined') {
    const s = localStorage.getItem('currentUser');
    if (s) try { return JSON.parse(s); } catch {}
  }
  return null;
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
    const data = await ok(await fetch(`${API_BASE_URL}/protected`, { headers: authHeader(token) })).then(json);
    // Normalize to match existing UI expectations
    const stored = getStoredUser();
    return { id: data?.user?.id, username: data?.user?.username, name: stored?.name || data?.user?.username, premiumStatus: data?.user?.premium, developerOverride: data?.user?.devOverride, location: stored?.location || {}, carInterests: stored?.carInterests || [], profileImage: stored?.profileImage };
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
    // Normalize shape for existing UI
    return events.map(e => ({
      id: e.id,
      title: e.name || e.title,
      date: e.date,
      location: e.location,
      description: e.description,
      rsvpCount: Array.isArray(e.rsvps) ? e.rsvps.length : (e.rsvpCount || 0),
      schedule: e.schedule || [],
      comments: e.comments || [],
      image: e.image || e.thumbnail || 'https://via.placeholder.com/600x300.png?text=Event',
      thumbnail: e.thumbnail,
      createdByUserId: e.createdByUserId,
      createdByUsername: e.createdByUsername,
      rsvps: e.rsvps || [],
    }));
  },
  getEvent: async (eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}`)).then(json),
  ensureEventThread: async (eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/ensure-thread`, { method: 'POST' })).then(json),

  rsvpToEvent: async (token, eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'POST', headers: { ...jsonHeader, ...authHeader(token) } })).then(json),
  cancelRsvp: async (token, eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),

  getMyRsvps: async (token) =>
    ok(await fetch(`${API_BASE_URL}/my-rsvps`, { headers: { ...jsonHeader, ...authHeader(token) } })).then(json),

  // For profile page convenience
  getUserEvents: async (userId) => {
    const token = getStoredToken();
    const [all, mine] = await Promise.all([
      api.getEvents(),
      token ? api.getMyRsvps(token) : Promise.resolve([]),
    ]);
    const rsvpIds = new Set(mine.map(r => r.eventId));
    return all.filter(e => e.createdByUserId === userId || rsvpIds.has(e.id));
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

  // --- Legacy shims (no mocks) ---
  initMockData: () => Promise.resolve(),
  getMessages: async () => [],
  addEventComment: async (token, eventId, text) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/comments`, { method: 'POST', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ text }) })).then(json),
  editEventComment: async (token, eventId, commentId, text) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/comments/${encodeURIComponent(commentId)}`, { method: 'PUT', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify({ text }) })).then(json),
  deleteEventComment: async (token, eventId, commentId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),
  updateProfile: async (data) => {
    // Persist locally so the UI reflects changes; real backend endpoint not implemented yet
    const cur = getStoredUser() || {};
    const next = { ...cur, ...data };
    if (typeof localStorage !== 'undefined') localStorage.setItem('currentUser', JSON.stringify(next));
    return next;
  },
};

export default api;
