require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import cors
const mongoose = require('mongoose');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { randomUUID } = require('crypto');
const { logger, securityEvent } = require('./logger');
const { createRateLimits } = require('./middleware/rateLimits');
const { ForumThread, ForumPost } = require('./models/forum');
let UserModel, EventModel, MessageModel; // loaded only when Mongo is configured
const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const devHttpsEnabled = /^true|1|yes$/i.test(String(process.env.DEV_HTTPS || '')) && process.env.NODE_ENV !== 'production';
const parsedDevHttpsPort = parseInt(process.env.DEV_HTTPS_PORT, 10);
const devHttpsPort = Number.isFinite(parsedDevHttpsPort) ? parsedDevHttpsPort : 3443;
const devHttpsCertPath = process.env.DEV_HTTPS_CERT || process.env.SSL_CRT_FILE;
const devHttpsKeyPath = process.env.DEV_HTTPS_KEY || process.env.SSL_KEY_FILE;
const disableRateLimiting = /^true|1|yes$/i.test(String(process.env.DISABLE_RATE_LIMIT || ''));

const { generalLimiter, authLimiter, createSensitiveLimiter } = createRateLimits();
const noopMiddleware = (_req, _res, next) => next();
const useLimiter = (limiter) => (disableRateLimiting ? noopMiddleware : limiter);

const generalLimiterMiddleware = useLimiter(generalLimiter);
const authLimiterMiddleware = useLimiter(authLimiter);
const adminLimiterMiddleware = useLimiter(
  createSensitiveLimiter({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Too many administrative actions. Please slow down.',
  })
);
const forumWriteLimiter = useLimiter(
  createSensitiveLimiter({
    windowMs: 60 * 60 * 1000,
    max: 80,
    message: 'Too many forum actions from this IP. Please try again later.',
  })
);
const messageWriteLimiter = useLimiter(
  createSensitiveLimiter({
    windowMs: 15 * 60 * 1000,
    max: 120,
    message: 'Too many messages sent from this IP. Please slow down.',
  })
);
const eventWriteLimiter = useLimiter(
  createSensitiveLimiter({
    windowMs: 60 * 60 * 1000,
    max: 40,
    message: 'Too many event actions from this IP. Please wait before trying again.',
  })
);
const rsvpLimiter = useLimiter(
  createSensitiveLimiter({
    windowMs: 10 * 60 * 1000,
    max: 80,
    message: 'Too many RSVP attempts from this IP. Please wait and retry.',
  })
);

// JWT: require secret in non-dev, allow fallback only in development
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_VERSION = process.env.TOKEN_VERSION || '1';
if (!JWT_SECRET) {
  if (process.env.NODE_ENV !== 'development') {
    logger.fatal('JWT_SECRET is required in production.');
    process.exit(1);
  } else {
    logger.warn('Using insecure development JWT secret');
  }
}

// CORS hardening: allow only configured origins (comma-separated). Allow localhost in dev.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
// Always include GitHub Pages host for this project unless explicitly disabled
const defaultPagesHost = 'https://bradleymatera.github.io';
if (!allowedOrigins.includes(defaultPagesHost)) allowedOrigins.push(defaultPagesHost);

const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const ghUser = process.env.GITHUB_PAGES_USER && String(process.env.GITHUB_PAGES_USER).trim();
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl/postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow exact GitHub Pages user if configured
    if (ghUser && origin === `https://${ghUser}.github.io`) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && localhostRegex.test(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
};
app.use(cors(corsOptions));
const devConnectSources = [];
if (process.env.NODE_ENV !== 'production') {
  devConnectSources.push('http://localhost:3000', 'https://localhost:3000');
}
if (devHttpsEnabled) {
  devConnectSources.push(`https://localhost:${devHttpsPort}`);
}
const cspConnectSrc = Array.from(new Set([...allowedOrigins, ...devConnectSources]));

const requestContextMiddleware = (req, res, next) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    if (req.originalUrl === '/healthz') return;
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const meta = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
    };
    if (req.user?.id) meta.userId = String(req.user.id);
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
    logger.log(level, 'Request completed', meta);
    if (res.statusCode === 401 || res.statusCode === 403) {
      securityEvent('Unauthorized request', meta);
    }
  });

  next();
};

app.use(requestContextMiddleware);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...cspConnectSrc],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);
app.use(express.json());
app.use(generalLimiterMiddleware);

const saltRounds = 10;

// --- Forums ---
const forumCategories = [
  { id: 'cat1', name: 'General Discussion', description: 'Talk about anything cars.' },
  { id: 'cat2', name: 'Builds & Projects', description: 'Share your build logs and progress.' },
  { id: 'cat3', name: 'Events & Meetups', description: 'Plan or recap community events.' },
  { id: 'cat4', name: 'Tech & Tuning', description: 'Ask questions, share tips, tuning talk.' },
];

const defaultPreferences = Object.freeze({
  notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
  privacy: { showProfile: true, showEmail: false, searchable: true },
  display: { theme: 'system', textSize: 'normal' },
  connections: { instagram: '', twitter: '', website: '' },
});

const ensurePreferencesShape = (prefs = {}) => ({
  notifications: { ...defaultPreferences.notifications, ...(prefs.notifications || {}) },
  privacy: { ...defaultPreferences.privacy, ...(prefs.privacy || {}) },
  display: { ...defaultPreferences.display, ...(prefs.display || {}) },
  connections: { ...defaultPreferences.connections, ...(prefs.connections || {}) },
});

const sanitizeUser = (doc) => {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : doc;
  const id = raw._id ? raw._id.toString() : raw.id;
  return {
    id,
    username: raw.username,
    email: raw.email,
    name: raw.name,
    displayTag: raw.displayTag,
    gender: raw.gender,
    location: raw.location || null,
    biography: raw.biography || raw.bio || '',
    profileImage: raw.profileImage || '',
    carInterests: Array.isArray(raw.carInterests) ? raw.carInterests : [],
    cars: Array.isArray(raw.cars) ? raw.cars : [],
    premiumStatus: !!raw.premiumStatus,
    developerOverride: !!raw.developerOverride,
    preferences: ensurePreferencesShape(raw.preferences),
    activityMetadata: raw.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
};

const normalizeEvent = (doc) => {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : doc;
  const id = raw._id ? raw._id.toString() : raw.id != null ? String(raw.id) : undefined;
  return {
    id,
    title: raw.title || raw.name,
    name: raw.name || raw.title,
    date: raw.date,
    location: raw.location,
    description: raw.description,
    image: raw.image,
    thumbnail: raw.thumbnail,
    schedule: raw.schedule || [],
    comments: raw.comments || [],
    rsvps: raw.rsvps || [],
    rsvpCount: Array.isArray(raw.rsvps) ? raw.rsvps.length : (raw.rsvpCount || 0),
    createdByUserId: raw.createdByUserId ? String(raw.createdByUserId) : undefined,
    createdByUsername: raw.createdByUsername,
    tags: raw.tags || [],
    threadId: raw.threadId,
  };
};

const normalizeMessage = (doc) => {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : doc;
  const id = raw._id ? raw._id.toString() : raw.id;
  return {
    id,
    senderId: raw.senderId ? String(raw.senderId) : undefined,
    senderUsername: raw.senderUsername,
    senderEffectivePremiumStatus: !!raw.senderEffectivePremiumStatus,
    recipientId: raw.recipientId ? String(raw.recipientId) : undefined,
    recipientUsername: raw.recipientUsername,
    recipientEffectivePremiumStatus: !!raw.recipientEffectivePremiumStatus,
    text: raw.text,
    timestamp: raw.timestamp || raw.createdAt,
    read: !!raw.read,
    category: raw.category,
    systemMessage: !!raw.systemMessage,
    isLocked: !!raw.isLocked,
  };
};

app.get('/', (req, res) => {
  res.send('Hello from the Car Match backend!');
});

// Simple health and readiness endpoint for Render/monitoring
app.get('/healthz', (req, res) => {
  const readyState = mongoose.connection?.readyState ?? 0; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    db: {
      configured: Boolean(process.env.MONGODB_URI),
      readyState,
      connected: readyState === 1,
    },
  });
});

// Legacy forum categories retained for compatibility

// MongoDB connection (optional but recommended for persistence)
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      logger.info('Connected to MongoDB');
      // Load additional models now that a connection exists
      UserModel = require('./models/user');
      EventModel = require('./models/event');
      MessageModel = require('./models/message');
      // Seed demo forum threads if none
      const count = await ForumThread.countDocuments();
      if (count === 0) {
        await ForumThread.create([
          { categoryId: 'cat1', title: 'Welcome to CarMatch Forums!', authorUsername: 'car_lover', createdAt: new Date(), lastPostAt: new Date(), replies: 0 },
          { categoryId: 'cat2', title: '1968 Mustang Fastback Restoration Log', authorUsername: 'car_lover', createdAt: new Date(), lastPostAt: new Date(), replies: 0 },
        ]);
      }
      // Ensure events collection exists; if empty, leave seeding to a dedicated script
      await EventModel.init().catch(()=>{});
      await MessageModel.init().catch(()=>{});
      await UserModel.init().catch(()=>{});

      // Ensure every event has a forum thread under Events & Meetups (cat3)
      try {
        const evs = await EventModel.find({ $or: [ { threadId: { $exists: false } }, { threadId: null } ] }).lean();
        for (const e of evs) {
          const title = e.name || e.title || 'Event';
          const thread = await ForumThread.create({ categoryId: 'cat3', title, authorId: e.createdByUserId, authorUsername: e.createdByUsername });
          await EventModel.updateOne({ _id: e._id }, { $set: { threadId: thread._id } });
        }
      } catch (se) {
        logger.warn('Event-thread sync warning', { error: se });
      }
    })
    .catch(err => {
      logger.error('MongoDB connection failed', { error: err });
    });
} else {
  logger.warn('MONGODB_URI not set; forums will not persist across restarts.');
}

// --- Maintenance: backfill helpers ---
async function backfillEventsUsers({ dryRun = false } = {}) {
  if (mongoose.connection.readyState !== 1 || !EventModel || !UserModel) {
    throw new Error('Database not connected or models unavailable');
  }
  const byId = new Map();
  const byUsername = new Map();
  const users = await UserModel.find({}, { username: 1 }).lean();
  users.forEach(u => { byId.set(String(u._id), u); if (u.username) byUsername.set(String(u.username), u); });

  const events = await EventModel.find({}).lean();
  let updated = 0; let rsvpFixed = 0;
  for (const e of events) {
    const set = {}; const pushOps = {};
    // createdByUserId / createdByUsername
    let ownerId = e.createdByUserId != null ? String(e.createdByUserId) : null;
    let ownerUser = ownerId ? byId.get(ownerId) : null;
    if (!ownerUser && e.organizerId) { ownerId = String(e.organizerId); ownerUser = byId.get(ownerId); }
    if (!ownerUser && e.createdByUsername) { ownerUser = byUsername.get(String(e.createdByUsername)); ownerId = ownerUser ? String(ownerUser._id) : ownerId; }
    if (!ownerUser && e.organizerUsername) { ownerUser = byUsername.get(String(e.organizerUsername)); ownerId = ownerUser ? String(ownerUser._id) : ownerId; }
    // If still missing, pick a stable fallback (first user) to satisfy invariant
    if (!ownerUser && users[0]) { ownerUser = users[0]; ownerId = String(ownerUser._id); }
    if (ownerUser) {
      if (String(e.createdByUserId || '') !== ownerId) set.createdByUserId = ownerId;
      if ((e.createdByUsername || '') !== String(ownerUser.username || '')) set.createdByUsername = ownerUser.username || undefined;
    }

    // Normalize event id field (keep numeric id if present, else ensure .id mirrors string _id for frontend)
    if (e.id == null && e._id) set.id = e.id || undefined; // leave as-is to avoid collisions

    // Normalize RSVP list to user _id strings
    const newRsvps = [];
    const orig = Array.isArray(e.rsvps) ? e.rsvps : [];
    for (const v of orig) {
      let uid = null;
      if (v == null) continue;
      if (typeof v === 'object' && v.userId) uid = String(v.userId);
      else if (typeof v === 'string') uid = v;
      else if (typeof v === 'number') uid = String(v);
      // map username/mockId to _id if needed
      if (uid && !byId.has(uid)) {
        const maybeUser = byUsername.get(uid);
        if (maybeUser) uid = String(maybeUser._id);
      }
      if (uid && byId.has(uid)) newRsvps.push(uid);
    }
    const needRsvpUpdate = JSON.stringify(newRsvps) !== JSON.stringify(orig);
    if (needRsvpUpdate) set.rsvps = newRsvps, rsvpFixed++;

    if (Object.keys(set).length) {
      updated++;
      if (!dryRun) await EventModel.updateOne({ _id: e._id }, { $set: set });
    }
  }
  return { eventsChecked: events.length, eventsUpdated: updated, rsvpsNormalized: rsvpFixed };
}

// Admin endpoint: run backfill (requires developerOverride on user)
app.post('/admin/backfill-events-users', adminLimiterMiddleware, authenticateToken, async (req, res) => {
  try {
    if (!req.user?.developerOverride) return res.status(403).json({ message: 'Forbidden' });
    const result = await backfillEventsUsers({ dryRun: Boolean(req.query.dry) });
    res.json({ ok: true, ...result });
  } catch (e) {
    logger.error('Backfill events/users failed', { error: e, requestId: req.requestId, userId: req.user?.id });
    res.status(500).json({ message: e.message || 'Backfill failed' });
  }
});

// --- Forums API ---
app.get('/forums/categories', (req, res) => {
  res.json(forumCategories);
});

// Forum stats per category (threads/posts/latest)
app.get('/forums/stats', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // No DB: return categories with zero counts
      return res.json(forumCategories.map(c => ({
        id: c.id, name: c.name, description: c.description,
        threads: 0, posts: 0, latestThread: null,
      })));
    }
    const results = [];
    for (const c of forumCategories) {
      const threads = await ForumThread.find({ categoryId: c.id }).sort({ lastPostAt: -1 }).limit(1).lean();
      const threadCount = await ForumThread.countDocuments({ categoryId: c.id });
      // Count posts for this category via thread ids
      let postsCount = 0;
      const ids = await ForumThread.find({ categoryId: c.id }, { _id: 1 }).lean();
      if (ids.length) postsCount = await ForumPost.countDocuments({ threadId: { $in: ids.map(t => t._id) } });
      results.push({
        id: c.id, name: c.name, description: c.description,
        threads: threadCount, posts: postsCount,
        latestThread: threads[0] ? { id: threads[0]._id, title: threads[0].title, lastPostAt: threads[0].lastPostAt } : null,
      });
    }
    res.json(results);
  } catch (e) {
    logger.error('Forum stats error', { error: e, requestId: req.requestId });
    res.status(500).json({ message: 'Error computing forum stats' });
  }
});

// Site-wide snapshot metrics
app.get('/stats/site', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const [users, threads, posts, eventsCount] = await Promise.all([
      (async ()=> { try { const U = require('./models/user'); return await U.countDocuments({}); } catch { return 0; } })(),
      ForumThread.countDocuments({}),
      ForumPost.countDocuments({}),
      (async ()=> { try { return await EventModel.countDocuments({}); } catch { return 0; } })(),
    ]);
    res.json({ users, threads, posts, events: eventsCount });
  } catch (e) {
    logger.error('Site stats error', { error: e, requestId: req.requestId });
    res.status(500).json({ message: 'Error computing site stats' });
  }
});

app.get('/forums/categories/:categoryId/threads', async (req, res) => {
  const { categoryId } = req.params;
  const { search = '', page = '1', pageSize = '20' } = req.query;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  try {
    if (mongoose.connection.readyState === 1) {
      const filter = { categoryId };
      if (search) filter.title = { $regex: String(search), $options: 'i' };
      // Include auto-created event threads in this category (event sync above ensures presence)
      const total = await ForumThread.countDocuments(filter);
      const items = await ForumThread.find(filter)
        .sort({ pinned: -1, lastPostAt: -1 })
        .skip((p - 1) * ps)
        .limit(ps)
        .lean();
      return res.json({ items, page: p, pageSize: ps, total });
    }
    // Fallback (no DB): empty list
    return res.json({ items: [], page: p, pageSize: ps, total: 0 });
  } catch (e) {
    logger.error('List threads error', { error: e, requestId: req.requestId, params: { categoryId } });
    res.status(500).json({ message: 'Error fetching threads' });
  }
});

app.post('/forums/threads', forumWriteLimiter, authenticateToken, async (req, res) => {
  const { categoryId, title } = req.body;
  if (!categoryId || !title) return res.status(400).json({ message: 'categoryId and title required' });
  const cat = forumCategories.find(c => c.id === categoryId);
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  try {
    if (mongoose.connection.readyState === 1) {
      const doc = await ForumThread.create({ categoryId, title: String(title), authorId: req.user.id, authorUsername: req.user.username });
      return res.status(201).json(doc.toObject());
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    logger.error('Create thread error', { error: e, requestId: req.requestId, userId: req.user?.id, body: { categoryId } });
    res.status(500).json({ message: 'Error creating thread' });
  }
});

app.get('/forums/threads/:threadId', async (req, res) => {
  const { threadId } = req.params;
  try {
    if (mongoose.connection.readyState === 1) {
      const thread = await ForumThread.findById(threadId).lean();
      if (!thread) return res.status(404).json({ message: 'Thread not found' });
      const posts = await ForumPost.find({ threadId: thread._id }).sort({ createdAt: 1 }).lean();
      // If thread is tied to an event, include a hint for UI
      let event = null;
      if (EventModel) {
        event = await EventModel.findOne({ threadId: thread._id }).lean();
      }
      return res.json({ thread, posts, event });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    logger.error('Get thread error', { error: e, requestId: req.requestId, params: { threadId } });
    res.status(500).json({ message: 'Error fetching thread' });
  }
});

app.post('/forums/threads/:threadId/posts', forumWriteLimiter, authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ message: 'body required' });
  try {
    if (mongoose.connection.readyState === 1) {
      const thread = await ForumThread.findById(threadId);
      if (!thread) return res.status(404).json({ message: 'Thread not found' });
      if (thread.locked) return res.status(423).json({ message: 'Thread is locked' });
      const post = await ForumPost.create({ threadId: thread._id, authorId: req.user.id, authorUsername: req.user.username, body: String(body) });
      thread.replies = (thread.replies || 0) + 1;
      thread.lastPostAt = new Date();
      await thread.save();
      return res.status(201).json(post.toObject());
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    logger.error('Add post error', { error: e, requestId: req.requestId, params: { threadId } });
    res.status(500).json({ message: 'Error adding post' });
  }
});

app.patch('/forums/threads/:threadId/pin', authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { pinned } = req.body;
  try {
    if (mongoose.connection.readyState === 1) {
      const threadDoc = await ForumThread.findById(threadId);
      if (!threadDoc) return res.status(404).json({ message: 'Thread not found' });
      // If thread belongs to an event, only event owner or devOverride may pin
      const ev = await EventModel.findOne({ threadId: threadDoc._id });
      if (ev) {
        const uid = String(req.user.id || req.user.userId);
        const can = String(ev.createdByUserId) === uid || req.user.developerOverride;
        if (!can) return res.status(403).json({ message: 'Forbidden' });
      }
      threadDoc.pinned = !!pinned;
      await threadDoc.save();
      return res.json({ ok: true, thread: threadDoc.toObject() });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    logger.error('Pin thread error', { error: e, requestId: req.requestId, params: { threadId } });
    res.status(500).json({ message: 'Error pinning thread' });
  }
});

app.patch('/forums/threads/:threadId/lock', authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { locked } = req.body;
  try {
    if (mongoose.connection.readyState === 1) {
      const threadDoc = await ForumThread.findById(threadId);
      if (!threadDoc) return res.status(404).json({ message: 'Thread not found' });
      const ev = await EventModel.findOne({ threadId: threadDoc._id });
      if (ev) {
        const uid = String(req.user.id || req.user.userId);
        const can = String(ev.createdByUserId) === uid || req.user.developerOverride;
        if (!can) return res.status(403).json({ message: 'Forbidden' });
      }
      threadDoc.locked = !!locked;
      await threadDoc.save();
      return res.json({ ok: true, thread: threadDoc.toObject() });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    logger.error('Lock thread error', { error: e, requestId: req.requestId, params: { threadId } });
    res.status(500).json({ message: 'Error locking thread' });
  }
});

app.delete('/forums/threads/:threadId', authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  try {
    if (mongoose.connection.readyState === 1) {
      const thread = await ForumThread.findByIdAndDelete(threadId);
      if (!thread) return res.status(404).json({ message: 'Thread not found' });
      await ForumPost.deleteMany({ threadId: thread._id });
      return res.json({ ok: true });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    logger.error('Delete thread error', { error: e, requestId: req.requestId, params: { threadId } });
    res.status(500).json({ message: 'Error deleting thread' });
  }
});

app.post('/forums/posts/:postId/report', forumWriteLimiter, authenticateToken, (req, res) => {
  // Stub: accept report
  res.status(201).json({ ok: true });
});

// User registration endpoint
app.post('/register', authLimiterMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !UserModel) {
      return res.status(503).json({ message: 'Database connection required for registration' });
    }

    const {
      username,
      password,
      name,
      displayTag,
      gender,
      city,
      state,
      email: rawEmail,
    } = req.body;

    if (!username || !password || !name || !displayTag || !gender || !city || !state) {
      return res.status(400).json({ message: 'Username, password, name, displayTag, gender, city, and state are required' });
    }

    const email = rawEmail || (username.includes('@') ? username : undefined);
    const existingUser = await UserModel.findOne({
      $or: [
        { username: username.trim() },
        ...(email ? [{ email: email.trim().toLowerCase() }] : []),
      ],
    }).lean();

    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const location = {
      city,
      state,
      geoCoordinates: { lat: (Math.random() * 180 - 90), lon: (Math.random() * 360 - 180) },
    };

    const created = await UserModel.create({
      username: username.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      password: hashedPassword,
      name,
      displayTag,
      gender,
      location,
      biography: '',
      profileImage: '',
      carInterests: [],
      cars: [],
      premiumStatus: false,
      developerOverride: false,
      activityMetadata: { messageCountToday: 0, lastMessageDate: null },
      preferences: ensurePreferencesShape(),
    });

    const sanitized = sanitizeUser(created);
    logger.info('User registered', { requestId: req.requestId, userId: sanitized.id, username: sanitized.username });
    res.status(201).json({ user: sanitized });
  } catch (error) {
    logger.error('Registration error', { error, requestId: req.requestId, body: { username: req.body?.username } });
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login endpoint
app.post('/login', authLimiterMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !UserModel) {
      return res.status(503).json({ message: 'Database connection required for login' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const loginId = String(username || '').trim();
    const query = loginId.includes('@')
      ? { $or: [{ email: loginId.toLowerCase() }, { username: loginId }] }
      : { username: loginId };

    const dbUser = await UserModel.findOne(query).lean();
    if (!dbUser) {
      securityEvent('Login failed (user not found)', { username: loginId, requestId: req.requestId, ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, dbUser.password);
    if (!passwordMatches) {
      securityEvent('Login failed (password mismatch)', { username: loginId, requestId: req.requestId, ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const sanitized = sanitizeUser(dbUser);

    const tokenPayload = {
      userId: sanitized.id,
      username: sanitized.username,
      premiumStatus: sanitized.premiumStatus,
      developerOverride: sanitized.developerOverride,
      tokenVersion: TOKEN_VERSION,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET || 'dev-insecure-secret', { expiresIn: '1h' });

    await UserModel.updateOne({ _id: sanitized.id }, { $set: { lastLoginAt: new Date() } });

    securityEvent('Login success', { userId: sanitized.id, username: sanitized.username, requestId: req.requestId, ip: req.ip });
    res.json({ token, user: sanitized });
  } catch (error) {
    logger.error('Login error', { error, requestId: req.requestId, username: req.body?.username });
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Middleware to verify JWT
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    securityEvent('Missing bearer token', { requestId: req.requestId, path: req.originalUrl, ip: req.ip });
    return res.sendStatus(401); // if there isn't any token
  }

  jwt.verify(token, JWT_SECRET || 'dev-insecure-secret', async (err, decodedPayload) => { 
    if (err) {
      securityEvent('JWT verification error', { error: err.message, requestId: req.requestId, path: req.originalUrl, ip: req.ip });
      return res.sendStatus(403); // if token is no longer valid
    }
    if (decodedPayload && decodedPayload.tokenVersion && decodedPayload.tokenVersion !== TOKEN_VERSION) {
      securityEvent('Token version mismatch', { requestId: req.requestId, tokenVersion: decodedPayload.tokenVersion, expected: TOKEN_VERSION, ip: req.ip });
      return res.status(401).json({ message: 'Token version expired. Please re-login.' });
    }
    if (mongoose.connection.readyState !== 1 || !UserModel) {
      securityEvent('Authenticated user lookup failed (no DB connection)', { requestId: req.requestId, userId: decodedPayload.userId });
      return res.sendStatus(401);
    }

    const dbUser = await UserModel.findOne({
      $or: [
        { _id: decodedPayload.userId },
        { username: decodedPayload.username },
      ],
    }).lean();

    if (!dbUser) {
      securityEvent('Authenticated user not found', { requestId: req.requestId, userId: decodedPayload.userId, username: decodedPayload.username });
      return res.sendStatus(401);
    }

    req.user = sanitizeUser(dbUser);
    next(); // proceed to the protected route
  });
}

// Endpoint to simulate upgrading a user to premium
app.put('/users/:userId/upgrade-to-premium', authenticateToken, async (req, res) => {
  try {
    const targetUserId = String(req.params.userId);
    const actingUser = req.user;

    if (String(actingUser.id) !== targetUserId && !(actingUser.developerOverride || actingUser.premiumStatus)) {
      return res.status(403).json({ message: 'Forbidden: You can only upgrade yourself or have elevated permissions.' });
    }

    if (mongoose.connection.readyState !== 1 || !UserModel) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const updated = await UserModel.findByIdAndUpdate(
      targetUserId,
      { $set: { premiumStatus: true } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'User to upgrade not found' });

    const sanitized = sanitizeUser(updated);
    securityEvent('User upgraded to premium', {
      requestId: req.requestId,
      targetUserId,
      actingUserId: actingUser.id,
      actingUsername: actingUser.username,
    });
    res.json({ message: `User ${sanitized.username} is now premium.`, user: sanitized });
  } catch (e) {
    logger.error('Upgrade to premium error', { error: e, requestId: req.requestId, userId: req.params.userId });
    res.status(500).json({ message: 'Error upgrading user' });
  }
});

// Endpoint to toggle developer override for a user
app.put('/users/:userId/toggle-dev-override', authenticateToken, async (req, res) => {
  try {
    const targetUserId = String(req.params.userId);
    const actingUser = req.user;

    if (!actingUser.developerOverride) {
      return res.status(403).json({ message: 'Forbidden: Only developers can toggle override.' });
    }

    if (mongoose.connection.readyState !== 1 || !UserModel) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const updated = await UserModel.findById(targetUserId);
    if (!updated) return res.status(404).json({ message: 'User to toggle not found' });

    updated.developerOverride = !updated.developerOverride;
    await updated.save();

    const sanitized = sanitizeUser(updated);
    securityEvent('Developer override toggled', {
      requestId: req.requestId,
      targetUserId,
      actingUserId: actingUser.id,
      actingUsername: actingUser.username,
      newValue: sanitized.developerOverride,
    });
    res.json({ message: `User ${sanitized.username} developer override is now ${sanitized.developerOverride}.`, user: sanitized });
  } catch (e) {
    logger.error('Toggle dev override error', { error: e, requestId: req.requestId, userId: req.params.userId });
    res.status(500).json({ message: 'Error toggling developer override' });
  }
});


// Example protected route
app.get('/protected', authenticateToken, (req, res) => {
  // req.user is now the full user object
  res.json({ message: 'This is a protected route', user: { id: req.user.id, username: req.user.username, premium: req.user.premiumStatus, devOverride: req.user.developerOverride } });
});

// Get current user (normalized) with preferences
app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !UserModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const dbUser = await UserModel.findById(req.user.id).lean();
    if (!dbUser) return res.status(404).json({ message: 'User not found' });
    res.json({ user: sanitizeUser(dbUser) });
  } catch (e) {
    logger.error('Get current user error', { error: e, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching user' });
  }
});

app.get('/users/me/events', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const userId = req.user.id;
    const [createdDocs, attendingDocs] = await Promise.all([
      EventModel.find({ createdByUserId: userId }).lean(),
      EventModel.find({ rsvps: userId }).lean(),
    ]);
    const map = new Map();
    [...createdDocs, ...attendingDocs].forEach((doc) => {
      const normalized = normalizeEvent(doc);
      if (normalized?.id) map.set(normalized.id, normalized);
    });
    res.json({ events: Array.from(map.values()) });
  } catch (error) {
    logger.error('Get user events error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching user events' });
  }
});

// Update user profile/settings
app.patch('/users/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const acting = String(req.user.id || req.user.userId);
    if (acting !== userId && !req.user.developerOverride) return res.status(403).json({ message: 'Forbidden' });

    // Whitelist fields
    const b = req.body || {};
    if (mongoose.connection.readyState !== 1 || !UserModel) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const set = {};
    const allow = ['name', 'displayTag', 'gender', 'biography', 'profileImage', 'email'];
    allow.forEach((k) => {
      if (b[k] !== undefined) set[k] = b[k];
    });

    if (b.carInterests) set.carInterests = Array.isArray(b.carInterests) ? b.carInterests : [];
    if (b.cars) set.cars = Array.isArray(b.cars) ? b.cars : [];
    if (b.location) set.location = { ...(req.user.location || {}), ...b.location };

    const prefs = ensurePreferencesShape({ ...(req.user.preferences || {}), ...(b.preferences || {}) });
    if (b.preferences) set.preferences = prefs;

    if (Object.keys(set).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    await UserModel.updateOne({ _id: userId }, { $set: set });
    const updated = await UserModel.findById(userId).lean();
    const responseUser = sanitizeUser(updated);
    securityEvent('User profile updated', { requestId: req.requestId, userId, actingUserId: acting });
    res.json({ ok: true, user: responseUser });
  } catch (e) {
    logger.error('Update user error', { error: e, requestId: req.requestId, params: { userId } });
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete account (danger zone)
app.delete('/users/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const acting = String(req.user.id || req.user.userId);
    if (acting !== userId && !req.user.developerOverride) return res.status(403).json({ message: 'Forbidden' });
    if (mongoose.connection.readyState !== 1 || !UserModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    await UserModel.deleteOne({ _id: userId });
    securityEvent('User account deleted', { requestId: req.requestId, userId, actingUserId: acting });
    res.json({ ok: true });
  } catch (e) {
    logger.error('Delete user error', { error: e, requestId: req.requestId, params: { userId } });
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Message sending endpoint
app.post('/messages', messageWriteLimiter, authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !UserModel || !MessageModel) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { recipientUsername, text } = req.body;
    if (!recipientUsername || !text) {
      return res.status(400).json({ message: 'Recipient username and text are required' });
    }

    const senderUser = req.user;
    const senderUsername = senderUser.username;
    const recipientDoc = await UserModel.findOne({ username: recipientUsername.trim() }).lean();
    if (!recipientDoc) return res.status(404).json({ message: 'Recipient not found' });

    const recipientUser = sanitizeUser(recipientDoc);
    const isSenderEffectivelyPremium = senderUser.premiumStatus || senderUser.developerOverride;
    const isRecipientEffectivelyPremium = recipientUser.premiumStatus || recipientUser.developerOverride;

    const dailyMessageLimit = 5;
    const today = new Date().toISOString().split('T')[0];
    const activity = senderUser.activityMetadata || { messageCountToday: 0, lastMessageDate: null };
    if (activity.lastMessageDate !== today) {
      activity.messageCountToday = 0;
      activity.lastMessageDate = today;
    }

    if (!isSenderEffectivelyPremium && activity.messageCountToday >= dailyMessageLimit) {
      return res.status(403).json({
        message: `Free users are limited to ${dailyMessageLimit} new messages per day. Upgrade to premium for unlimited messaging.`,
        action: 'upgradeRequired',
      });
    }

    const created = await MessageModel.create({
      senderId: senderUser.id,
      senderUsername,
      senderEffectivePremiumStatus: isSenderEffectivelyPremium,
      recipientId: recipientUser.id,
      recipientUsername: recipientUser.username,
      recipientEffectivePremiumStatus: isRecipientEffectivelyPremium,
      text,
      timestamp: new Date(),
      read: false,
      category: 'Inbox',
      systemMessage: false,
    });

    if (!isSenderEffectivelyPremium) {
      activity.messageCountToday += 1;
      await UserModel.updateOne({ _id: senderUser.id }, { $set: { activityMetadata: activity } });
    }

    securityEvent('Direct message sent', {
      requestId: req.requestId,
      fromUserId: senderUser.id,
      toUserId: recipientUser.id,
      toUsername: recipientUser.username,
    });

    res.status(201).json({ message: 'Message sent successfully', data: normalizeMessage(created) });
  } catch (error) {
    logger.error('Send message error', { error, requestId: req.requestId, recipient: req.body?.recipientUsername });
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Helper function to calculate distance between two geo-coordinates (Haversine formula)
function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Helpers: Events ---
const isObjectIdLike = (v) => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
async function findEventByParam(eventIdParam) {
  if (mongoose.connection.readyState !== 1 || !EventModel) {
    return { ev: null, source: null };
  }

  const n = Number(eventIdParam);
  if (!Number.isNaN(n)) {
    const byNumeric = await EventModel.findOne({ id: n });
    if (byNumeric) return { ev: byNumeric, source: 'db' };
  }

  if (isObjectIdLike(eventIdParam)) {
    const byId = await EventModel.findById(eventIdParam);
    if (byId) return { ev: byId, source: 'db' };
  }

  // Attempt direct match on stringified _id or legacy id field
  const byStringId = await EventModel.findOne({ $or: [{ _id: eventIdParam }, { id: eventIdParam }] });
  if (byStringId) return { ev: byStringId, source: 'db' };

  return { ev: null, source: null };
}

// Inbox endpoint to fetch messages for the logged-in user
app.get('/messages/inbox', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !MessageModel || !UserModel) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const loggedInUser = req.user;
    const userId = String(loggedInUser.id);
    const isUserEffectivelyPremium = loggedInUser.premiumStatus || loggedInUser.developerOverride;

    const docs = await MessageModel.find({
      $or: [{ recipientId: userId }, { senderId: userId }],
    }).lean();

    const idCandidates = new Set();
    const usernameCandidates = new Set();

    docs.forEach((msg) => {
      if (msg.senderId) idCandidates.add(String(msg.senderId));
      if (msg.recipientId) idCandidates.add(String(msg.recipientId));
      if (msg.senderUsername) usernameCandidates.add(msg.senderUsername);
      if (msg.recipientUsername) usernameCandidates.add(msg.recipientUsername);
    });

    const objectIds = [...idCandidates].filter(isObjectIdLike).map((id) => new mongoose.Types.ObjectId(id));
    const usersById = objectIds.length ? await UserModel.find({ _id: { $in: objectIds } }).lean() : [];
    const userMapById = new Map();
    const userMapByUsername = new Map();
    usersById.forEach((doc) => {
      const sanitized = sanitizeUser(doc);
      userMapById.set(sanitized.id, sanitized);
      if (sanitized.username) userMapByUsername.set(sanitized.username, sanitized);
    });

    const remainingUsernames = [...usernameCandidates].filter((name) => !userMapByUsername.has(name));
    if (remainingUsernames.length) {
      const usersByUsername = await UserModel.find({ username: { $in: remainingUsernames } }).lean();
      usersByUsername.forEach((doc) => {
        const sanitized = sanitizeUser(doc);
        userMapById.set(sanitized.id, sanitized);
        if (sanitized.username) userMapByUsername.set(sanitized.username, sanitized);
      });
    }

    const resolveOtherUser = (msg) => {
      const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const otherUsername = msg.senderId === userId ? msg.recipientUsername : msg.senderUsername;
      return (otherId && userMapById.get(String(otherId)))
        || (otherUsername && userMapByUsername.get(otherUsername))
        || null;
    };

    const markReadIds = [];
    const processedMessages = docs.map((msg) => {
      const display = normalizeMessage(msg);
      const otherPartyIsPremium = display.senderId === userId
        ? display.recipientEffectivePremiumStatus
        : display.senderEffectivePremiumStatus;

      if (display.senderId === userId) display.category = 'Sent';
      else if (display.recipientId === userId && !display.read) display.category = 'Unread';
      else if (!display.category) display.category = 'Inbox';

      if (display.recipientId === userId && !isUserEffectivelyPremium && otherPartyIsPremium) {
        display.text = `${(display.text || '').slice(0, 20)}... (Upgrade to premium to read full message)`;
        display.category = 'Locked';
        display.isLocked = true;
      } else {
        display.isLocked = false;
      }

      if (display.recipientId === userId && !display.read && msg._id) {
        markReadIds.push(msg._id);
        display.read = true;
      }

      return display;
    });

    if (markReadIds.length) {
      await MessageModel.updateMany({ _id: { $in: markReadIds } }, { $set: { read: true } });
    }

    const queryCategory = req.query.category;
    const filterGender = req.query.filterGender;
    const filterRadius = req.query.filterRadius ? parseInt(req.query.filterRadius, 10) : null;
    let result = processedMessages;

    if (queryCategory) {
      switch (queryCategory.toLowerCase()) {
        case 'inbox':
          result = result.filter((msg) => msg.recipientId === userId && !msg.systemMessage);
          break;
        case 'unread':
          result = result.filter((msg) => msg.recipientId === userId && !msg.read && !msg.isLocked);
          break;
        case 'sent':
          result = result.filter((msg) => msg.senderId === userId);
          break;
        case 'system':
          result = result.filter((msg) => msg.systemMessage);
          break;
        case 'locked':
          result = result.filter((msg) => msg.isLocked);
          break;
        default:
          result = [];
          break;
      }
    }

    if ((filterGender || filterRadius) && !isUserEffectivelyPremium) {
      return res.status(403).json({
        message: 'Upgrade to premium to use advanced filters like gender or proximity.',
        action: 'upgradeRequired',
      });
    }

    if (filterGender && isUserEffectivelyPremium) {
      result = result.filter((msg) => {
        const other = resolveOtherUser(msg);
        return other && other.gender === filterGender;
      });
    }

    if (filterRadius && isUserEffectivelyPremium && loggedInUser.location?.geoCoordinates) {
      const { lat: userLat, lon: userLon } = loggedInUser.location.geoCoordinates;
      result = result.filter((msg) => {
        const other = resolveOtherUser(msg);
        if (!other?.location?.geoCoordinates) return false;
        const { lat, lon } = other.location.geoCoordinates;
        const distance = getDistanceInMiles(userLat, userLon, lat, lon);
        return distance <= filterRadius;
      });
    }

    const sortBy = req.query.sortBy;
    if (isUserEffectivelyPremium && sortBy === 'proximity' && loggedInUser.location?.geoCoordinates) {
      const { lat: userLat, lon: userLon } = loggedInUser.location.geoCoordinates;
      result.sort((a, b) => {
        const userA = resolveOtherUser(a);
        const userB = resolveOtherUser(b);
        if (!userA?.location?.geoCoordinates || !userB?.location?.geoCoordinates) return 0;
        const distA = getDistanceInMiles(userLat, userLon, userA.location.geoCoordinates.lat, userA.location.geoCoordinates.lon);
        const distB = getDistanceInMiles(userLat, userLon, userB.location.geoCoordinates.lat, userB.location.geoCoordinates.lon);
        return distA - distB;
      });
    } else {
      result.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    }

    res.json(result);
  } catch (error) {
    logger.error('Inbox error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Event creation endpoint
app.post('/events', eventWriteLimiter, authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { name, description, date, location, image, thumbnail, schedule, tags } = req.body;
    const createdByUserId = req.user.id;
    const createdByUsername = req.user.username;

    if (!name || !description || !date || !location) {
      return res.status(400).json({ message: 'Name, description, date, and location are required for an event' });
    }

    const created = await EventModel.create({
      name,
      title: name,
      description,
      date,
      location,
      image,
      thumbnail,
      schedule: schedule || [],
      tags: tags || [],
      createdByUserId,
      createdByUsername,
      rsvps: [],
    });

    let threadId = null;
    try {
      const thread = await ForumThread.create({ categoryId: 'cat3', title: name, authorId: createdByUserId, authorUsername: createdByUsername });
      await EventModel.updateOne({ _id: created._id }, { $set: { threadId: thread._id } });
      threadId = thread._id;
      const intro = `Event: ${name}\nDate: ${date}\nLocation: ${location}\n\n${description || ''}`;
      await ForumPost.create({ threadId, authorId: createdByUserId, authorUsername: createdByUsername, body: intro });
    } catch (e) {
      logger.warn('Auto thread create failed', { error: e, requestId: req.requestId, eventId: created._id });
    }

    const normalized = normalizeEvent({ ...created.toObject(), threadId });
    securityEvent('Event created', { requestId: req.requestId, eventId: normalized.id, createdByUserId });
    res.status(201).json({ message: 'Event created successfully', data: normalized });
  } catch (error) {
    logger.error('Create event error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error creating event' });
  }
});

// RSVP to an event endpoint
app.post('/events/:eventId/rsvp', rsvpLimiter, authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const eventIdParam = req.params.eventId;
    const rsvpUserId = req.user.id;
    const rsvpUsername = req.user.username;
    const { ev, source } = await findEventByParam(eventIdParam);
    const eventDoc = source === 'db' ? ev : null;
    if (!eventDoc) return res.status(404).json({ message: 'Event not found' });

    const eid = eventDoc._id.toString();
    if (Array.isArray(eventDoc.rsvps) && eventDoc.rsvps.map(String).includes(String(rsvpUserId))) {
      return res.status(409).json({ message: 'Already RSVPed to this event' });
    }

    await EventModel.updateOne({ _id: eventDoc._id }, { $addToSet: { rsvps: rsvpUserId } });
    securityEvent('Event RSVP added', {
      requestId: req.requestId,
      eventId: eid,
      userId: rsvpUserId,
    });
    res.status(201).json({ message: 'RSVP successful', eventId: eid, userId: rsvpUserId, username: rsvpUsername });
  } catch (error) {
    logger.error('RSVP error', { error, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error RSVPing to event' });
  }
});

// Cancel RSVP (toggle off)
app.delete('/events/:eventId/rsvp', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const eventIdParam = req.params.eventId;
    const rsvpUserId = req.user.id;
    const { ev, source } = await findEventByParam(eventIdParam);
    const eventDoc = source === 'db' ? ev : null;
    if (!eventDoc) return res.status(404).json({ message: 'Event not found' });
    const eid = eventDoc._id.toString();
    await EventModel.updateOne({ _id: eventDoc._id }, { $pull: { rsvps: rsvpUserId } });
    securityEvent('Event RSVP removed', {
      requestId: req.requestId,
      eventId: eid,
      userId: rsvpUserId,
    });
    res.json({ message: 'RSVP removed', eventId: eid });
  } catch (error) {
    logger.error('Cancel RSVP error', { error, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error cancelling RSVP' });
  }
});

// Get all events endpoint
app.get('/events', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const docs = await EventModel.find({}).lean();
    const items = docs.map(normalizeEvent);
    return res.json(items);
  } catch (error) {
    logger.error('Get events error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Get single event (by numeric id or ObjectId)
app.get('/events/:eventId', async (req, res) => {
  try {
    const { ev, source } = await findEventByParam(req.params.eventId);
    if (!ev || source !== 'db') return res.status(404).json({ message: 'Event not found' });
    res.json(normalizeEvent(ev));
  } catch (e) {
    logger.error('Get event error', { error: e, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error fetching event' });
  }
});

// Ensure an event has a linked forum thread; create if missing, return normalized event
app.post('/events/:eventId/ensure-thread', eventWriteLimiter, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) return res.status(503).json({ message: 'Database not available' });
    const { ev, source } = await findEventByParam(req.params.eventId);
    if (!ev || source !== 'db') return res.status(404).json({ message: 'Event not found' });
    const doc = await EventModel.findById(ev._id);
    if (!doc.threadId) {
      const title = doc.name || doc.title || 'Event';
      const thread = await ForumThread.create({ categoryId: 'cat3', title, authorId: doc.createdByUserId, authorUsername: doc.createdByUsername });
      doc.threadId = thread._id;
      await doc.save();
      // Post intro
      try {
        const intro = `Event: ${title}\nDate: ${doc.date}\nLocation: ${doc.location}\n\n${doc.description || ''}`;
        await ForumPost.create({ threadId: thread._id, authorId: doc.createdByUserId, authorUsername: doc.createdByUsername, body: intro });
      } catch (e) {
        logger.warn('Intro post failed', { error: e, requestId: req.requestId, eventId: req.params.eventId });
      }
    }
    return res.json({ id: doc.id || doc._id.toString(), name: doc.name, title: doc.title || doc.name, date: doc.date, location: doc.location, description: doc.description, image: doc.image, thumbnail: doc.thumbnail, schedule: doc.schedule || [], comments: doc.comments || [], rsvps: doc.rsvps || [], rsvpCount: Array.isArray(doc.rsvps) ? doc.rsvps.length : 0, createdByUserId: doc.createdByUserId, createdByUsername: doc.createdByUsername, threadId: doc.threadId });
  } catch (e) {
    logger.error('Ensure thread error', { error: e, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error ensuring thread' });
  }
});

// Get user's RSVPs endpoint
app.get('/my-rsvps', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const rsvpUserId = req.user.id;
    const docs = await EventModel.find({ rsvps: rsvpUserId }).lean();
    const mapped = docs.map((doc) => {
      const normalized = normalizeEvent(doc);
      return {
        eventId: normalized.id,
        userId: rsvpUserId,
        username: req.user.username,
        timestamp: new Date().toISOString(),
        eventName: normalized.name,
        eventDate: normalized.date,
      };
    });

    res.json(mapped);
  } catch (error) {
    logger.error('Get my RSVPs error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching your RSVPs' });
  }
});

// Event comments
app.post('/events/:eventId/comments', eventWriteLimiter, authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const eventIdParam = req.params.eventId;
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text required' });
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev || source !== 'db') return res.status(404).json({ message: 'Event not found' });
    const doc = await EventModel.findById(ev._id);
    const comment = { id: Date.now(), user: req.user.username, userId: req.user.id, text, timestamp: new Date().toISOString() };
    if (doc.threadId) {
      try {
        const fp = await ForumPost.create({ threadId: doc.threadId, authorId: comment.userId, authorUsername: comment.user, body: text });
        comment.forumPostId = fp._id;
      } catch (mir) {
        logger.warn('Forum mirror failed', { error: mir, requestId: req.requestId, eventId: eventIdParam });
      }
    }
    doc.comments = doc.comments || [];
    doc.comments.push(comment);
    await doc.save();
    securityEvent('Event comment added', { requestId: req.requestId, eventId: eventIdParam, userId: comment.userId });
    res.status(201).json(comment);
  } catch (e) {
    logger.error('Add comment error', { error: e, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error adding comment' });
  }
});

app.put('/events/:eventId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const eventIdParam = req.params.eventId;
    const commentId = parseInt(req.params.commentId, 10);
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text required' });
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev || source !== 'db') return res.status(404).json({ message: 'Event not found' });
    const doc = await EventModel.findById(ev._id);
    const userId = String(req.user.id);
    const c = (doc.comments || []).find((x) => x.id === commentId);
    if (!c) return res.status(404).json({ message: 'Comment not found' });
    const can = String(c.userId) === userId || String(doc.createdByUserId) === userId || req.user.developerOverride;
    if (!can) return res.status(403).json({ message: 'Forbidden' });
    c.text = text;
    if (c.forumPostId) {
      try { await ForumPost.updateOne({ _id: c.forumPostId }, { $set: { body: text } }); } catch (e) { logger.warn('Forum mirror edit failed', { error: e, requestId: req.requestId, eventId: eventIdParam }); }
    }
    await doc.save();
    securityEvent('Event comment edited', { requestId: req.requestId, eventId: eventIdParam, commentId, userId });
    res.json(c);
  } catch (e) {
    logger.error('Edit comment error', { error: e, requestId: req.requestId, eventId: req.params.eventId, commentId: req.params.commentId });
    res.status(500).json({ message: 'Error editing comment' });
  }
});

app.delete('/events/:eventId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const eventIdParam = req.params.eventId;
    const commentId = parseInt(req.params.commentId, 10);
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev || source !== 'db') return res.status(404).json({ message: 'Event not found' });
    const userId = String(req.user.id);
    const doc = await EventModel.findById(ev._id);
    const idx = (doc.comments || []).findIndex((x) => x.id === commentId);
    if (idx === -1) return res.status(404).json({ message: 'Comment not found' });
    const c = doc.comments[idx];
    const can = String(c.userId) === userId || String(doc.createdByUserId) === userId || req.user.developerOverride;
    if (!can) return res.status(403).json({ message: 'Forbidden' });
    const removed = doc.comments.splice(idx, 1)[0];
    if (removed?.forumPostId) {
      try { await ForumPost.deleteOne({ _id: removed.forumPostId }); } catch (e) { logger.warn('Forum mirror delete failed', { error: e, requestId: req.requestId, eventId: eventIdParam }); }
    }
    await doc.save();
    securityEvent('Event comment deleted', { requestId: req.requestId, eventId: eventIdParam, commentId, userId });
    res.json({ ok: true });
  } catch (e) {
    logger.error('Delete comment error', { error: e, requestId: req.requestId, eventId: req.params.eventId, commentId: req.params.commentId });
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

app.delete('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const eventIdParam = req.params.eventId;
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev || source !== 'db') return res.status(404).json({ message: 'Event not found' });
    const doc = await EventModel.findById(ev._id);
    const userId = String(req.user.id);
    const can = String(doc.createdByUserId) === userId || req.user.developerOverride;
    if (!can) return res.status(403).json({ message: 'Forbidden' });
    if (doc.threadId) {
      try {
        await ForumPost.deleteMany({ threadId: doc.threadId });
        await ForumThread.deleteOne({ _id: doc.threadId });
      } catch (e) {
        logger.warn('Delete thread cascade failed', { error: e, requestId: req.requestId, eventId: eventIdParam });
      }
    }
    await EventModel.deleteOne({ _id: ev._id });
    securityEvent('Event deleted', { requestId: req.requestId, eventId: eventIdParam, userId });
    res.json({ ok: true });
  } catch (e) {
    logger.error('Delete event error', { error: e, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error deleting event' });
  }
});

app.put('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !EventModel) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const eventIdParam = req.params.eventId;
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev || source !== 'db') return res.status(404).json({ message: 'Event not found' });
    const doc = await EventModel.findById(ev._id);
    const userId = String(req.user.id);
    const can = String(doc.createdByUserId) === userId || req.user.developerOverride;
    if (!can) return res.status(403).json({ message: 'Forbidden' });
    const allowed = ((f) => ({ name: f.name, description: f.description, date: f.date, location: f.location, image: f.image, thumbnail: f.thumbnail, schedule: f.schedule, tags: f.tags }))(req.body || {});
    const oldName = doc.name || doc.title;
    Object.assign(doc, allowed);
    await doc.save();
    if (doc.threadId) {
      try {
        if (allowed.name && allowed.name !== oldName) {
          await ForumThread.updateOne({ _id: doc.threadId }, { $set: { title: allowed.name } });
        }
        if (allowed.description) {
          const body = `Event details updated by organizer.\n\n${allowed.description}`;
          await ForumPost.create({ threadId: doc.threadId, authorId: userId, authorUsername: req.user.username, body });
        }
      } catch (e) {
        logger.warn('Thread update note failed', { error: e, requestId: req.requestId, eventId: eventIdParam });
      }
    }
    securityEvent('Event updated', { requestId: req.requestId, eventId: eventIdParam, userId });
    res.json(normalizeEvent(doc));
  } catch (e) {
    logger.error('Update event error', { error: e, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error updating event' });
  }
});

const httpServer = http.createServer(app);
httpServer.listen(port, () => {
  logger.info('HTTP server listening', { port });
});

if (devHttpsEnabled) {
  if (!devHttpsCertPath || !devHttpsKeyPath) {
    logger.warn('DEV_HTTPS enabled but DEV_HTTPS_CERT/DEV_HTTPS_KEY not provided. HTTPS server not started.');
  } else {
    try {
      const httpsOptions = {
        key: fs.readFileSync(devHttpsKeyPath),
        cert: fs.readFileSync(devHttpsCertPath),
      };
      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(devHttpsPort, () => {
        logger.info('HTTPS server listening', { port: devHttpsPort });
      });
    } catch (err) {
      logger.error('Failed to start HTTPS server', { error: err });
    }
  }
}
