// Production REST client that talks to the live backend (Render + Mongo Atlas)
// Falls back to localhost in development when no base URL override is provided.

const API_BASE_URL = (
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL)
  || (typeof window !== 'undefined' && window.location?.hostname && (
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
    try {
      const e = await resp.json();
      if (e && e.message) msg = e.message;
    } catch {}
    throw new Error(msg);
  }
  return resp;
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
const jsonHeader = { 'Content-Type': 'application/json' };

const getStoredToken = () => {
  if (typeof localStorage !== 'undefined') return localStorage.getItem('authToken');
  return null;
};
const getStoredUser = () => {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
  }
  return null;
};

const ensureString = (value) => (value == null ? undefined : String(value));

const normalizeEvent = (raw = {}) => {
  const createdByUserId = raw.createdByUserId != null
    ? ensureString(raw.createdByUserId)
    : raw.organizerId != null
      ? ensureString(raw.organizerId)
      : undefined;
  const comments = Array.isArray(raw.comments)
    ? raw.comments.map((comment) => ({
        ...comment,
        userId: comment?.userId != null ? ensureString(comment.userId) : ensureString(comment?.userId?.id || comment?.user),
      }))
    : [];
  const rsvps = Array.isArray(raw.rsvps)
    ? raw.rsvps.map((entry) => (entry && typeof entry === 'object' && 'toString' in entry ? entry.toString() : ensureString(entry)))
    : [];
  return {
    id: raw.id != null ? ensureString(raw.id) : ensureString(raw._id),
    title: raw.title || raw.name,
    name: raw.name || raw.title,
    date: raw.date,
    location: raw.location,
    description: raw.description,
    image: raw.image,
    thumbnail: raw.thumbnail,
    schedule: raw.schedule || [],
    comments,
    rsvps,
    rsvpCount: rsvps.length || raw.rsvpCount || 0,
    createdByUserId,
    createdByUsername: raw.createdByUsername || raw.organizerUsername,
    tags: raw.tags || [],
    threadId: raw.threadId ? ensureString(raw.threadId) : undefined,
  };
};

const normalizeUser = (raw = {}) => {
  const baseId = raw.id ?? raw._id ?? raw.userId;
  const developerOverride = !!raw.developerOverride;
  const inferredRole = raw.role || (developerOverride ? 'admin' : 'user');
  return {
    id: ensureString(baseId),
    username: raw.username || '',
    name: raw.name || raw.displayTag || raw.username || '',
    displayTag: raw.displayTag || raw.name || raw.username || '',
    email: raw.email || '',
    premiumStatus: !!raw.premiumStatus,
    developerOverride,
    role: inferredRole,
    location: raw.location || {},
    biography: raw.biography || '',
    profileImage: raw.profileImage || '',
    preferences: raw.preferences || {},
  };
};

const combineEventResponse = (payload) => {
  if (!payload) return payload;
  if (Array.isArray(payload)) return payload.map((event) => ({ ...normalizeEvent(event), eventId: ensureString(event.id ?? event._id) }));
  if (payload.data) {
    return { ...payload, data: normalizeEvent(payload.data) };
  }
  return normalizeEvent(payload);
};

const api = {
  // --- Auth ---
  registerUser: async (userData) =>
    ok(await fetch(`${API_BASE_URL}/register`, { method: 'POST', headers: jsonHeader, body: JSON.stringify(userData) })).then(json),

  loginUser: async (username, password) => {
    const data = await ok(await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: jsonHeader,
      body: JSON.stringify({ username, password }),
    })).then(json);
    return {
      token: data.token,
      user: normalizeUser({
        id: data.userId,
        userId: data.userId,
        username: data.username,
        name: data.name,
        displayTag: data.displayTag,
        premiumStatus: data.premiumStatus,
        developerOverride: data.developerOverride,
        role: data.role,
      }),
    };
  },

  getCurrentUser: async () => {
    const token = getStoredToken();
    if (!token) throw new Error('Not authenticated');
    const data = await ok(await fetch(`${API_BASE_URL}/users/me`, { headers: authHeader(token) })).then(json);
    return normalizeUser(data?.user || {});
  },

  // --- Messages ---
  fetchMessages: async (token, category, filters = {}) => {
    let qs = `?category=${encodeURIComponent(category || 'inbox')}`;
    if (filters.filterGender) qs += `&filterGender=${encodeURIComponent(filters.filterGender)}`;
    if (filters.filterRadius) qs += `&filterRadius=${encodeURIComponent(filters.filterRadius)}`;
    if (filters.sortBy) qs += `&sortBy=${encodeURIComponent(filters.sortBy)}`;
    return ok(await fetch(`${API_BASE_URL}/messages/inbox${qs}`, { headers: { ...jsonHeader, ...authHeader(token) } })).then(json);
  },

  sendMessage: async (...args) => {
    if (typeof args[0] === 'string') {
      const [token, recipientUsername, text] = args;
      return ok(await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { ...jsonHeader, ...authHeader(token) },
        body: JSON.stringify({ recipientUsername, text }),
      })).then(json);
    }
    return Promise.reject(new Error('sendMessage requires auth token'));
  },

  // --- Events ---
  getEvents: async () => {
    const events = await ok(await fetch(`${API_BASE_URL}/events`)).then(json);
    return Array.isArray(events) ? events.map(normalizeEvent) : [];
  },

  getEvent: async (eventId) => combineEventResponse(await ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}`)).then(json)),

  ensureEventThread: async (eventId) => combineEventResponse(await ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/ensure-thread`, { method: 'POST' })).then(json)),

  createEvent: async (token, payload) => combineEventResponse(await ok(await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: { ...jsonHeader, ...authHeader(token) },
    body: JSON.stringify(payload),
  })).then(json)),

  updateEvent: async (token, eventId, payload) => combineEventResponse(await ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: { ...jsonHeader, ...authHeader(token) },
    body: JSON.stringify(payload),
  })).then(json)),

  deleteEvent: async (token, eventId) =>
    ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),

  rsvpToEvent: async (token, eventId) => combineEventResponse(await ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/rsvp`, {
    method: 'POST',
    headers: { ...jsonHeader, ...authHeader(token) },
  })).then(json)),

  cancelRsvp: async (token, eventId) => combineEventResponse(await ok(await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/rsvp`, {
    method: 'DELETE',
    headers: { ...authHeader(token) },
  })).then(json)),

  getMyRsvps: async (token) => {
    const events = await ok(await fetch(`${API_BASE_URL}/my-rsvps`, { headers: { ...jsonHeader, ...authHeader(token) } })).then(json);
    return combineEventResponse(events);
  },

  getUserEvents: async (userId) => {
    const token = getStoredToken();
    let uid = userId != null ? ensureString(userId) : undefined;
    if (!uid && token) {
      try {
        const me = await api.getCurrentUser();
        uid = me?.id ? ensureString(me.id) : undefined;
      } catch {}
    }
    const [all, mine] = await Promise.all([
      api.getEvents(),
      token ? api.getMyRsvps(token) : Promise.resolve([]),
    ]);
    const rsvpIds = new Set((mine || []).map((event) => ensureString(event.eventId || event.id)));
    return (all || []).filter((event) => {
      const eid = ensureString(event.id);
      const ownerId = ensureString(event.createdByUserId);
      return (uid && ownerId && ownerId === uid) || (eid && rsvpIds.has(eid));
    });
  },

  // --- Forums ---
  getForumCategories: async () => ok(await fetch(`${API_BASE_URL}/forums/categories`)).then(json),
  getForumStats: async () => ok(await fetch(`${API_BASE_URL}/forums/stats`)).then(json),
  getSiteStats: async () => ok(await fetch(`${API_BASE_URL}/stats/site`)).then(json),

  getThreadsByCategory: async (categoryId, { search = '', page = 1, pageSize = 20 } = {}) => {
    const qs = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) }).toString();
    return ok(await fetch(`${API_BASE_URL}/forums/categories/${encodeURIComponent(categoryId)}/threads?${qs}`)).then(json);
  },

  getThreadById: async (threadId) => {
    const data = await ok(await fetch(`${API_BASE_URL}/forums/threads/${encodeURIComponent(threadId)}`)).then(json);
    if (data && data.event) {
      return { ...data, event: normalizeEvent(data.event) };
    }
    return data;
  },

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
    ok(await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/upgrade-to-premium`, { method: 'PUT', headers: { ...jsonHeader, ...authHeader(token) } })).then(json),

  toggleDevOverride: async (token, userId) =>
    ok(await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/toggle-dev-override`, { method: 'PUT', headers: { ...jsonHeader, ...authHeader(token) } })).then(json),

  // --- Account / Settings ---
  getMe: async (token) => ok(await fetch(`${API_BASE_URL}/users/me`, { headers: { ...authHeader(token) } })).then(json),
  updateUser: async (token, userId, data) =>
    ok(await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}`, { method: 'PATCH', headers: { ...jsonHeader, ...authHeader(token) }, body: JSON.stringify(data) })).then(json),
  deleteUser: async (token, userId) =>
    ok(await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}`, { method: 'DELETE', headers: { ...authHeader(token) } })).then(json),

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
    const cur = getStoredUser() || {};
    const next = { ...cur, ...data };
    if (typeof localStorage !== 'undefined') localStorage.setItem('currentUser', JSON.stringify(next));
    return next;
  },
};

export default api;
