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
const forumModerationLimiter = useLimiter(
  createSensitiveLimiter({
    windowMs: 30 * 60 * 1000,
    max: 40,
    message: 'Too many moderation actions. Please slow down.',
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

// In-memory store for users
// Each user object will now be more detailed as per the new requirements
const users = []; 
const saltRounds = 10;

// In-memory store for messages
const messages = [];

// In-memory store for events
const events = [];

// In-memory store for RSVPs
const rsvps = [];

// --- Forums ---
const forumCategories = [
  { id: 'cat1', name: 'General Discussion', description: 'Talk about anything cars.' },
  { id: 'cat2', name: 'Builds & Projects', description: 'Share your build logs and progress.' },
  { id: 'cat3', name: 'Events & Meetups', description: 'Plan or recap community events.' },
  { id: 'cat4', name: 'Tech & Tuning', description: 'Ask questions, share tips, tuning talk.' },
];

const isForumModerator = (user = {}) => Boolean(user.developerOverride || user.role === 'admin' || user.role === 'moderator');

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

// Seed a few demo users and basic events in-memory so the app "feels real"
const seedDemoData = () => {
  if (users.length > 0) return; // already seeded
  try {
    const demoUsers = [
      { username: 'demo', password: 'password123', name: 'Demo User', displayTag: 'Demo', gender: 'other', city: 'Los Angeles', state: 'CA' },
      { username: 'jane', password: 'password123', name: 'Jane Smith', displayTag: 'JSpeed', gender: 'female', city: 'San Francisco', state: 'CA' },
      { username: 'mike', password: 'password123', name: 'Mike Davis', displayTag: 'MDrives', gender: 'male', city: 'San Diego', state: 'CA' },
    ];
    demoUsers.forEach((u) => {
      const hashed = bcrypt.hashSync(u.password, 10);
      users.push({
        id: users.length + 1,
        username: u.username,
        password: hashed,
        name: u.name,
        displayTag: u.displayTag,
        gender: u.gender,
        location: { city: u.city, state: u.state, geoCoordinates: { lat: (Math.random()*180-90), lon: (Math.random()*360-180) } },
        interests: [], biography: '', profileImage: '', lastLoginTimestamp: null,
        premiumStatus: u.username === 'jane',
        developerOverride: u.username === 'demo',
        role: u.username === 'demo' ? 'admin' : 'user',
        activityMetadata: { messageCountToday: 0, lastMessageDate: null },
        tierSpecificHistory: {}, createdAt: new Date().toISOString()
      });
    });

    // Basic sample events to show if frontend switches to real events
    const now = new Date();
    const fmt = (d) => d.toISOString().slice(0,10);
    events.push(
      { id: 1, name: 'Demo Cars & Coffee', description: 'Meet local enthusiasts.', date: fmt(new Date(now.getTime()+7*86400000)), location: 'Los Angeles, CA', createdByUserId: '1', createdByUsername: 'demo', rsvps: [] },
      { id: 2, name: 'Track Day Intro', description: 'Beginner-friendly track event.', date: fmt(new Date(now.getTime()+14*86400000)), location: 'San Francisco, CA', createdByUserId: '2', createdByUsername: 'jane', rsvps: [] }
    );
  } catch (e) {
    logger.error('Seed demo data failed', { error: e });
  }
};
seedDemoData();

const syncInMemoryUsersWithDatabase = async () => {
  if (mongoose.connection.readyState !== 1 || !UserModel) return;
  for (let i = 0; i < users.length; i += 1) {
    const memUser = users[i];
    if (!memUser) continue;
    const loginUsername = memUser.username;
    const query = { username: loginUsername };
    let dbUser = await UserModel.findOne(query);
    if (!dbUser) {
      dbUser = await UserModel.create({
        mockId: String(memUser.id || i + 1),
        username: loginUsername,
        email: `${loginUsername}@example.com`,
        password: memUser.password,
        name: memUser.name,
        displayTag: memUser.displayTag,
        gender: memUser.gender,
        location: memUser.location,
        premiumStatus: memUser.premiumStatus,
        developerOverride: memUser.developerOverride,
        role: memUser.role || 'user',
        activityMetadata: memUser.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
        biography: memUser.biography || '',
        profileImage: memUser.profileImage || '',
        carInterests: memUser.interests || [],
      });
    }
    const canonicalId = dbUser._id.toString();
    users[i] = {
      ...memUser,
      id: canonicalId,
      password: dbUser.password,
      premiumStatus: !!dbUser.premiumStatus,
      developerOverride: !!dbUser.developerOverride,
      role: dbUser.role || memUser.role || 'user',
      activityMetadata: dbUser.activityMetadata || memUser.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
      tierSpecificHistory: dbUser.tierSpecificHistory || memUser.tierSpecificHistory || {},
    };
  }
  const userByUsername = new Map(users.map(u => [u.username, u]));
  events.forEach((event) => {
    if (event.createdByUsername && userByUsername.has(event.createdByUsername)) {
      event.createdByUserId = userByUsername.get(event.createdByUsername).id;
    }
  });
};

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
      await syncInMemoryUsersWithDatabase();

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
      if (String(e.createdByUserId || '') !== ownerId) set.createdByUserId = new mongoose.Types.ObjectId(ownerId);
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
    if (needRsvpUpdate) {
      set.rsvps = newRsvps.map((uid) => new mongoose.Types.ObjectId(uid));
      rsvpFixed++;
    }

    if (Array.isArray(e.comments)) {
      const updatedComments = e.comments.map((comment) => {
        const mappedUserId = comment.userId ? String(comment.userId) : comment.user ? String(comment.user) : null;
        let normalizedUserId = mappedUserId;
        if (mappedUserId && !byId.has(mappedUserId)) {
          const maybeUser = byUsername.get(mappedUserId);
          if (maybeUser) normalizedUserId = String(maybeUser._id);
        }
        return {
          ...comment,
          userId: normalizedUserId ? new mongoose.Types.ObjectId(normalizedUserId) : comment.userId,
        };
      });
      set.comments = updatedComments;
    }

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
    if (mongoose.connection.readyState !== 1) {
      return res.json({ users: 0, threads: 0, posts: 0, events: events.length });
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

app.patch('/forums/threads/:threadId/pin', forumModerationLimiter, authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { pinned } = req.body;
  try {
    if (mongoose.connection.readyState === 1) {
      const threadDoc = await ForumThread.findById(threadId);
      if (!threadDoc) return res.status(404).json({ message: 'Thread not found' });
      // If thread belongs to an event, only event owner or devOverride may pin
      const ev = await EventModel.findOne({ threadId: threadDoc._id });
      const isMod = isForumModerator(req.user);
      if (ev) {
        const uid = String(req.user.id || req.user.userId);
        const can = isMod || String(ev.createdByUserId) === uid;
        if (!can) return res.status(403).json({ message: 'Forbidden' });
      } else if (!isMod) {
        return res.status(403).json({ message: 'Moderator role required' });
      }
      threadDoc.pinned = !!pinned;
      await threadDoc.save();
      securityEvent('Thread pinned status changed', {
        requestId: req.requestId,
        threadId,
        userId: req.user.id,
        role: req.user.role,
        pinned: !!pinned,
      });
      return res.json({ ok: true, thread: threadDoc.toObject() });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    logger.error('Pin thread error', { error: e, requestId: req.requestId, params: { threadId } });
    res.status(500).json({ message: 'Error pinning thread' });
  }
});

app.patch('/forums/threads/:threadId/lock', forumModerationLimiter, authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { locked } = req.body;
  try {
    if (mongoose.connection.readyState === 1) {
      const threadDoc = await ForumThread.findById(threadId);
      if (!threadDoc) return res.status(404).json({ message: 'Thread not found' });
      const ev = await EventModel.findOne({ threadId: threadDoc._id });
      const isMod = isForumModerator(req.user);
      if (ev) {
        const uid = String(req.user.id || req.user.userId);
        const can = isMod || String(ev.createdByUserId) === uid;
        if (!can) return res.status(403).json({ message: 'Forbidden' });
      } else if (!isMod) {
        return res.status(403).json({ message: 'Moderator role required' });
      }
      threadDoc.locked = !!locked;
      await threadDoc.save();
      securityEvent('Thread lock status changed', {
        requestId: req.requestId,
        threadId,
        userId: req.user.id,
        role: req.user.role,
        locked: !!locked,
      });
      return res.json({ ok: true, thread: threadDoc.toObject() });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    logger.error('Lock thread error', { error: e, requestId: req.requestId, params: { threadId } });
    res.status(500).json({ message: 'Error locking thread' });
  }
});

app.delete('/forums/threads/:threadId', forumModerationLimiter, authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  try {
    if (mongoose.connection.readyState === 1) {
      const thread = await ForumThread.findById(threadId);
      if (!thread) return res.status(404).json({ message: 'Thread not found' });
      const ev = await EventModel.findOne({ threadId: thread._id });
      const isMod = isForumModerator(req.user);
      if (ev) {
        const uid = String(req.user.id || req.user.userId);
        const can = isMod || String(ev.createdByUserId) === uid;
        if (!can) return res.status(403).json({ message: 'Forbidden' });
      } else if (!isMod) {
        return res.status(403).json({ message: 'Moderator role required' });
      }
      await ForumThread.deleteOne({ _id: thread._id });
      await ForumPost.deleteMany({ threadId: thread._id });
      securityEvent('Thread deleted', {
        requestId: req.requestId,
        threadId,
        userId: req.user.id,
        role: req.user.role,
      });
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
    const { 
      username, 
      password, 
      name, 
      displayTag, 
      gender, 
      city, 
      state,
      email: rawEmail,
      // Other fields like orientation, interests, bio, profileImage can be added later or made optional
    } = req.body;

    if (!username || !password || !name || !displayTag || !gender || !city || !state) {
      return res.status(400).json({ message: 'Username, password, name, displayTag, gender, city, and state are required' });
    }

    // Check if user already exists (in-memory)
    let existingUser = users.find(user => user.username === username);
    // Also check Mongo if available
    if (!existingUser && mongoose.connection.readyState === 1 && UserModel) {
      const email = rawEmail || (username.includes('@') ? username : undefined);
      existingUser = await UserModel.findOne({ $or: [ { username }, ...(email?[{ email }]:[]) ] }).lean();
    }
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const nextInMemoryId = users.length + 1;
    const baseUser = {
      username,
      password: hashedPassword,
      name,
      displayTag,
      gender,
      location: {
        city,
        state,
        geoCoordinates: { lat: (Math.random() * 180 - 90), lon: (Math.random() * 360 - 180) },
      },
      interests: [],
      biography: "",
      profileImage: "",
      lastLoginTimestamp: null,
      premiumStatus: false,
      developerOverride: false,
      role: 'user',
      activityMetadata: { messageCountToday: 0, lastMessageDate: null },
      tierSpecificHistory: {},
      createdAt: new Date().toISOString(),
    };

    let persistentId = String(nextInMemoryId);
    if (mongoose.connection.readyState === 1 && UserModel) {
      const created = await UserModel.create({
        mockId: String(nextInMemoryId),
        username: baseUser.username,
        email: rawEmail || (username.includes('@') ? username : undefined) || `${baseUser.username}@example.com`,
        password: baseUser.password,
        name: baseUser.name,
        displayTag: baseUser.displayTag,
        gender: baseUser.gender,
        location: baseUser.location,
        premiumStatus: baseUser.premiumStatus,
        developerOverride: baseUser.developerOverride,
        role: baseUser.role,
        activityMetadata: baseUser.activityMetadata,
        biography: baseUser.biography,
        profileImage: baseUser.profileImage,
        carInterests: baseUser.interests,
      });
      persistentId = created._id.toString();
    }

    const newUser = {
      id: persistentId,
      ...baseUser,
    };
    if (mongoose.connection.readyState === 1 && UserModel && mongoose.Types.ObjectId.isValid(persistentId)) {
      newUser._id = new mongoose.Types.ObjectId(persistentId);
    }
    users.push(newUser);

    logger.info('User registered', { requestId: req.requestId, userId: newUser.id, username: newUser.username });
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (error) {
    logger.error('Registration error', { error, requestId: req.requestId, body: { username: req.body?.username } });
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login endpoint
app.post('/login', authLimiterMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const loginId = String(username || '').trim();
    let authenticatedUser = null;

    if (mongoose.connection.readyState === 1 && UserModel) {
      const query = loginId.includes('@') ? { email: loginId } : { username: loginId };
      const dbUser = await UserModel.findOne(query).lean();
      if (dbUser) {
        const ok = await bcrypt.compare(password, dbUser.password);
        if (!ok) {
          securityEvent('Login failed (password mismatch)', { username: loginId, requestId: req.requestId, ip: req.ip });
          return res.status(401).json({ message: 'Invalid credentials (password mismatch)' });
        }
        authenticatedUser = {
          id: dbUser._id.toString(),
          username: dbUser.username,
          name: dbUser.name || dbUser.username,
          displayTag: dbUser.displayTag || dbUser.username,
          gender: dbUser.gender,
          location: dbUser.location || {},
          interests: dbUser.carInterests || [],
          biography: dbUser.biography || '',
          profileImage: dbUser.profileImage || '',
          lastLoginTimestamp: new Date().toISOString(),
          premiumStatus: !!dbUser.premiumStatus,
          developerOverride: !!dbUser.developerOverride,
          role: dbUser.role || 'user',
          activityMetadata: dbUser.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
          tierSpecificHistory: dbUser.tierSpecificHistory || {},
          createdAt: (dbUser.createdAt instanceof Date ? dbUser.createdAt : new Date()).toISOString(),
        };

        const idx = users.findIndex(u => u.username === dbUser.username);
        const cachePayload = {
          id: authenticatedUser.id,
          username: authenticatedUser.username,
          password: dbUser.password,
          name: authenticatedUser.name,
          displayTag: authenticatedUser.displayTag,
          gender: authenticatedUser.gender,
          location: authenticatedUser.location,
          interests: authenticatedUser.interests,
          biography: authenticatedUser.biography,
          profileImage: authenticatedUser.profileImage,
          lastLoginTimestamp: authenticatedUser.lastLoginTimestamp,
          premiumStatus: authenticatedUser.premiumStatus,
          developerOverride: authenticatedUser.developerOverride,
          role: authenticatedUser.role,
          activityMetadata: authenticatedUser.activityMetadata,
          tierSpecificHistory: authenticatedUser.tierSpecificHistory,
          createdAt: authenticatedUser.createdAt,
        };
        if (idx > -1) {
          users[idx] = cachePayload;
        } else {
          users.push(cachePayload);
        }
      }
    }

    if (!authenticatedUser) {
      const cachedUser = users.find(u => u.username === loginId);
      if (!cachedUser) {
        securityEvent('Login failed (user not found)', { username: loginId, requestId: req.requestId, ip: req.ip });
        return res.status(401).json({ message: 'Invalid credentials (user not found)' });
      }
      const isMatch = await bcrypt.compare(password, cachedUser.password);
      if (!isMatch) {
        securityEvent('Login failed (password mismatch)', { username: cachedUser.username, requestId: req.requestId, ip: req.ip });
        return res.status(401).json({ message: 'Invalid credentials (password mismatch)' });
      }
      const canonicalId = mongoose.Types.ObjectId.isValid(cachedUser.id) ? cachedUser.id : String(cachedUser.id);
      cachedUser.id = canonicalId;
      cachedUser.lastLoginTimestamp = new Date().toISOString();
      authenticatedUser = {
        id: canonicalId,
        username: cachedUser.username,
        name: cachedUser.name,
        displayTag: cachedUser.displayTag,
        gender: cachedUser.gender,
        location: cachedUser.location,
        interests: cachedUser.interests,
        biography: cachedUser.biography,
        profileImage: cachedUser.profileImage,
        lastLoginTimestamp: cachedUser.lastLoginTimestamp,
        premiumStatus: cachedUser.premiumStatus,
        developerOverride: cachedUser.developerOverride,
        role: cachedUser.role || 'user',
        activityMetadata: cachedUser.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
        tierSpecificHistory: cachedUser.tierSpecificHistory || {},
        createdAt: cachedUser.createdAt || new Date().toISOString(),
      };
    }

    const tokenPayload = { 
      userId: String(authenticatedUser.id), 
      username: authenticatedUser.username, 
      premiumStatus: authenticatedUser.premiumStatus,
      developerOverride: authenticatedUser.developerOverride,
      role: authenticatedUser.role || 'user'
    };
    tokenPayload.tokenVersion = TOKEN_VERSION;
    const token = jwt.sign(tokenPayload, JWT_SECRET || 'dev-insecure-secret', { expiresIn: '1h' });

    securityEvent('Login success', { userId: tokenPayload.userId, username: authenticatedUser.username, requestId: req.requestId, ip: req.ip });
    res.json({ 
      token, 
      userId: tokenPayload.userId, 
      username: authenticatedUser.username,
      name: authenticatedUser.name,
      displayTag: authenticatedUser.displayTag,
      premiumStatus: authenticatedUser.premiumStatus,
      developerOverride: authenticatedUser.developerOverride,
      role: authenticatedUser.role || 'user'
    });
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
    // Find the full user object to get the most up-to-date status, including developerOverride
    const payloadUserId = decodedPayload.userId ? String(decodedPayload.userId) : null;
    let fullUser = users.find(u => String(u.id) === payloadUserId || u.username === decodedPayload.username);
    if (!fullUser && mongoose.connection.readyState === 1 && UserModel) {
      const orClauses = [];
      if (payloadUserId && mongoose.Types.ObjectId.isValid(payloadUserId)) {
        orClauses.push({ _id: new mongoose.Types.ObjectId(payloadUserId) });
      }
      if (decodedPayload.username) {
        orClauses.push({ username: decodedPayload.username });
      }
      const dbUser = orClauses.length ? await UserModel.findOne({ $or: orClauses }).lean() : null;
      if (dbUser) {
        fullUser = {
          id: dbUser._id.toString(),
          username: dbUser.username,
          premiumStatus: !!dbUser.premiumStatus,
          developerOverride: !!dbUser.developerOverride,
          role: dbUser.role || 'user',
          activityMetadata: dbUser.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
          location: dbUser.location || {},
          gender: dbUser.gender || 'other',
          name: dbUser.name || dbUser.username
        };
        const idx = users.findIndex(u => u.username === dbUser.username);
        const cachePayload = {
          id: fullUser.id,
          username: dbUser.username,
          password: dbUser.password,
          name: dbUser.name || dbUser.username,
          displayTag: dbUser.displayTag || dbUser.username,
          gender: dbUser.gender,
          location: dbUser.location || {},
          interests: dbUser.carInterests || [],
          biography: dbUser.biography || '',
          profileImage: dbUser.profileImage || '',
          lastLoginTimestamp: new Date().toISOString(),
          premiumStatus: !!dbUser.premiumStatus,
          developerOverride: !!dbUser.developerOverride,
          role: dbUser.role || 'user',
          activityMetadata: dbUser.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
          tierSpecificHistory: dbUser.tierSpecificHistory || {},
          createdAt: (dbUser.createdAt instanceof Date ? dbUser.createdAt : new Date()).toISOString(),
        };
        if (idx > -1) users[idx] = cachePayload; else users.push(cachePayload);
      }
    }
    if (!fullUser) {
      securityEvent('Authenticated user not found', { requestId: req.requestId, userId: decodedPayload.userId, username: decodedPayload.username });
      return res.sendStatus(401);
    }
    const canonicalId = fullUser.id ? String(fullUser.id) : payloadUserId;
    req.user = {
      ...fullUser,
      id: canonicalId,
      role: fullUser.role || decodedPayload.role || 'user',
    };
    next(); // proceed to the protected route
  });
}

// Endpoint to simulate upgrading a user to premium
app.put('/users/:userId/upgrade-to-premium', authenticateToken, (req, res) => {
  // In a real app, only an admin or a payment success callback would hit this.
  // For simulation, any authenticated user can call this on THEMSELVES if they are an admin, or if it's for dev testing.
  // For simplicity here, we'll allow an admin (or dev override user) to upgrade anyone.
  // Or a user to upgrade themselves.
  
  const targetUserId = String(req.params.userId);
  const actingUser = req.user; // User performing the action

  // Basic check: allow self-upgrade or admin/dev override to upgrade others
  if (String(actingUser.id || actingUser.userId) !== targetUserId && !(actingUser.premiumStatus || actingUser.developerOverride)) {
      return res.status(403).json({ message: "Forbidden: You can only upgrade yourself or an admin/dev can upgrade others." });
  }

  const userToUpgrade = users.find(u => String(u.id) === targetUserId);
  if (!userToUpgrade) {
    return res.status(404).json({ message: 'User to upgrade not found' });
  }

  userToUpgrade.premiumStatus = true;
  securityEvent('User upgraded to premium', {
    requestId: req.requestId,
    targetUserId,
    actingUserId: actingUser.id,
    actingUsername: actingUser.username,
  });
  res.json({ message: `User ${userToUpgrade.username} is now premium. Please re-login to update JWT if needed.`, user: {id: userToUpgrade.id, username: userToUpgrade.username, premiumStatus: userToUpgrade.premiumStatus} });
});

// Endpoint to toggle developer override for a user
app.put('/users/:userId/toggle-dev-override', authenticateToken, (req, res) => {
  // Similar authorization logic as above, typically admin-only
  const targetUserId = String(req.params.userId);
  const actingUser = req.user;

  if (String(actingUser.id || actingUser.userId) !== targetUserId && !(actingUser.premiumStatus || actingUser.developerOverride)) { // Simplistic admin check
      return res.status(403).json({ message: "Forbidden: Only admins/devs can toggle override for others." });
  }

  const userToToggle = users.find(u => String(u.id) === targetUserId);
  if (!userToToggle) {
    return res.status(404).json({ message: 'User to toggle not found' });
  }

  userToToggle.developerOverride = !userToToggle.developerOverride;
  securityEvent('Developer override toggled', {
    requestId: req.requestId,
    targetUserId,
    actingUserId: actingUser.id,
    actingUsername: actingUser.username,
    newValue: userToToggle.developerOverride,
  });
  res.json({ message: `User ${userToToggle.username} developer override is now ${userToToggle.developerOverride}. Please re-login to update JWT.`, user: {id: userToToggle.id, username: userToToggle.username, developerOverride: userToToggle.developerOverride }});
});

// Assign role (admin/moderator) endpoint
app.put('/admin/users/:userId/role', authenticateToken, async (req, res) => {
  try {
    if (!(req.user.developerOverride || req.user.role === 'admin')) {
      return res.status(403).json({ message: 'Forbidden: Admin or developer access required.' });
    }

    const targetUserId = String(req.params.userId);
    const { role } = req.body || {};
    const allowedRoles = ['user', 'moderator', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const memIdx = users.findIndex(u => String(u.id) === targetUserId || String(u._id || u.id) === targetUserId);
    if (memIdx > -1) {
      users[memIdx] = { ...users[memIdx], role };
    }

    if (mongoose.connection.readyState === 1 && UserModel) {
      await UserModel.updateOne({ _id: targetUserId }, { $set: { role } });
    }

    securityEvent('User role updated', {
      requestId: req.requestId,
      targetUserId,
      actingUserId: req.user.id,
      actingUsername: req.user.username,
      newRole: role,
    });

    res.json({ ok: true, userId: targetUserId, role });
  } catch (error) {
    logger.error('Assign role error', { error, requestId: req.requestId, targetUserId: req.params.userId });
    res.status(500).json({ message: 'Error assigning role' });
  }
});


// Example protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: {
      id: req.user.id,
      username: req.user.username,
      premium: req.user.premiumStatus,
      devOverride: req.user.developerOverride,
      role: req.user.role || 'user',
    },
  });
});

// Get current user (normalized) with preferences
app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    let user = req.user;
    if (mongoose.connection.readyState === 1 && UserModel) {
      const dbUser = await UserModel.findOne({ _id: req.user.id }).lean();
      if (dbUser) user = { ...user, ...dbUser, id: dbUser._id.toString() };
    }
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching user' });
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
    const set = {};
    const allow = ['name','displayTag','gender','biography','profileImage'];
    allow.forEach(k => { if (b[k] !== undefined) set[k] = b[k]; });
    if (b.carInterests) set.carInterests = Array.isArray(b.carInterests) ? b.carInterests : [];
    if (b.location) {
      set.location = { ...req.user.location, ...b.location };
    }
    if (b.preferences) {
      const p = b.preferences;
      if (p.notifications) set['preferences.notifications'] = p.notifications;
      if (p.privacy) set['preferences.privacy'] = p.privacy;
      if (p.display) set['preferences.display'] = p.display;
      if (p.connections) set['preferences.connections'] = p.connections;
    }

    // Update in-memory if exists
    const memIdx = users.findIndex(u => String(u.id) === userId);
    if (memIdx > -1) {
      users[memIdx] = { ...users[memIdx], ...set, preferences: { ...(users[memIdx].preferences||{}), ...(set.preferences||{}) } };
    }
    // Update Mongo if connected
    let updated;
    if (mongoose.connection.readyState === 1 && UserModel) {
      await UserModel.updateOne({ _id: userId }, { $set: set });
      updated = await UserModel.findById(userId).lean();
    }
    const responseUser = updated ? { ...updated, id: updated._id.toString() } : users[memIdx] || { id: userId, ...set };
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
    // Remove from memory
    const idx = users.findIndex(u => String(u.id) === userId);
    if (idx > -1) users.splice(idx, 1);
    // Remove from DB
    if (mongoose.connection.readyState === 1 && UserModel) await UserModel.deleteOne({ _id: userId });
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
    const { recipientUsername, text } = req.body;
    // req.user.username is the sender's username from the JWT
    const senderUsername = req.user.username; 

    if (!recipientUsername || !text) {
      return res.status(400).json({ message: 'Recipient username and text are required' });
    }

    let recipientUser = users.find(user => user.username === recipientUsername);
    if (!recipientUser && mongoose.connection.readyState === 1 && UserModel) {
      const dbUser = await UserModel.findOne({ username: recipientUsername }).lean();
      if (dbUser) {
        recipientUser = { id: dbUser._id.toString(), username: dbUser.username, premiumStatus: !!dbUser.premiumStatus, developerOverride: !!dbUser.developerOverride };
      }
    }
    if (!recipientUser) return res.status(404).json({ message: 'Recipient not found' });

    // req.user is now the full sender object from authenticateToken
    const senderUser = req.user; 

    // Premium Logic for sending messages
    // Effective premium status considers both actual premium and dev override
    const isSenderEffectivelyPremium = senderUser.premiumStatus || senderUser.developerOverride;
    const dailyMessageLimit = 5; // Example limit for free users

    // Reset daily count if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (senderUser.activityMetadata.lastMessageDate !== today) {
      senderUser.activityMetadata.messageCountToday = 0;
      senderUser.activityMetadata.lastMessageDate = today;
    }

    if (!isSenderEffectivelyPremium && senderUser.activityMetadata.messageCountToday >= dailyMessageLimit) {
      return res.status(403).json({ 
        message: `Free users are limited to ${dailyMessageLimit} new messages per day. Upgrade to premium for unlimited messaging.`,
        action: "upgradeRequired" // For frontend to trigger paywall UI
      });
    }
    
    // Reply Gating: Free user cannot reply to premium-initiated messages
    // This requires checking if the message is a reply and the original sender's status.
    // For now, we'll focus on the daily limit and message blurring.
    // A more complex implementation would check `req.body.replyToMessageId`

    const isRecipientEffectivelyPremium = recipientUser.premiumStatus || recipientUser.developerOverride;

    const newMessage = {
      id: messages.length + 1,
      senderId: senderUser.id,
      senderUsername: senderUsername,
      senderEffectivePremiumStatus: isSenderEffectivelyPremium, 
      recipientId: recipientUser.id,
      recipientUsername: recipientUsername,
      recipientEffectivePremiumStatus: isRecipientEffectivelyPremium,
      text,
      timestamp: new Date().toISOString(),
      read: false,
      category: 'Inbox', // Default category, can be adjusted by recipient's view
      systemMessage: false, // Flag for system messages
      // replyEligibility, expiration can be added
    };
    messages.push(newMessage);

    if (mongoose.connection.readyState === 1 && MessageModel) {
      await MessageModel.create(newMessage);
    }

    if (!isSenderEffectivelyPremium) {
      senderUser.activityMetadata.messageCountToday += 1;
    }

    securityEvent('Direct message sent', {
      requestId: req.requestId,
      fromUserId: senderUser.id,
      toUserId: recipientUser.id,
      toUsername: recipientUser.username,
    });
    logger.debug('Message queue size', { count: messages.length });
    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
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
const toObjectId = (value) => {
  if (value == null) return null;
  const str = String(value);
  return mongoose.Types.ObjectId.isValid(str) ? new mongoose.Types.ObjectId(str) : null;
};

const computeNextEventId = async () => {
  let nextId = events.length + 1;
  if (mongoose.connection.readyState === 1 && EventModel) {
    try {
      const latest = await EventModel.findOne({}).sort({ id: -1 }).lean();
      if (latest && typeof latest.id !== 'undefined') {
        const numeric = Number(latest.id);
        if (!Number.isNaN(numeric)) {
          nextId = numeric + 1;
        } else {
          nextId = Date.now();
        }
      } else {
        nextId = Math.max(nextId, 1);
      }
    } catch (e) {
      logger.warn('Unable to compute next event id from Mongo', { error: e });
      nextId = Math.max(nextId, Date.now());
    }
  }
  return nextId;
};

const syncEventCache = (normalizedEvent) => {
  if (!normalizedEvent || typeof normalizedEvent.id === 'undefined') return;
  const key = String(normalizedEvent.id);
  const index = events.findIndex((e) => String(e.id) === key);
  if (index > -1) {
    events[index] = {
      ...events[index],
      ...normalizedEvent,
    };
  } else {
    events.push({ ...normalizedEvent });
  }
};
async function findEventByParam(eventIdParam) {
  // Prefer persistent DB if available
  const n = Number(eventIdParam);
  if (!Number.isNaN(n) && mongoose.connection.readyState === 1 && EventModel) {
    let doc = await EventModel.findOne({ id: n });
    if (!doc) {
      doc = await EventModel.findOne({ id: String(eventIdParam) });
    }
    if (doc) return { ev: doc, source: 'db' };
  }
  if (mongoose.connection.readyState === 1 && EventModel && isObjectIdLike(eventIdParam)) {
    const doc = await EventModel.findById(eventIdParam);
    if (doc) return { ev: doc, source: 'db' };
  }
  // Fallback to in-memory
  if (!Number.isNaN(n)) {
    const evMem = events.find(e => e.id === n);
    if (evMem) return { ev: evMem, source: 'mem' };
  }
  return { ev: null, source: null };
}

function normalizeEventRecord(raw) {
  if (!raw) return null;
  const doc = raw.toObject ? raw.toObject() : raw;
  const normalizedRsvps = Array.isArray(doc.rsvps)
    ? doc.rsvps.map((entry) => (entry && entry.toString ? entry.toString() : String(entry)))
    : [];
  const normalizedComments = Array.isArray(doc.comments)
    ? doc.comments.map((comment) => ({
        ...comment,
        userId: comment?.userId ? comment.userId.toString() : undefined,
      }))
    : [];

  const createdByUserId = doc.createdByUserId ? doc.createdByUserId.toString() : undefined;

  return {
    id: doc.id != null ? String(doc.id) : doc._id ? doc._id.toString() : undefined,
    title: doc.title || doc.name,
    name: doc.name || doc.title,
    date: doc.date,
    location: doc.location,
    description: doc.description,
    image: doc.image,
    thumbnail: doc.thumbnail,
    schedule: doc.schedule || [],
    comments: normalizedComments,
    rsvps: normalizedRsvps,
    rsvpCount: normalizedRsvps.length,
    createdByUserId,
    createdByUsername: doc.createdByUsername,
    tags: doc.tags || [],
    threadId: doc.threadId,
  };
}

// Inbox endpoint to fetch messages for the logged-in user
app.get('/messages/inbox', authenticateToken, async (req, res) => {
  try {
    const loggedInUser = req.user; 
    const isUserEffectivelyPremium = loggedInUser.premiumStatus || loggedInUser.developerOverride;

    let allUserRelatedMessages = [];
    if (mongoose.connection.readyState === 1 && MessageModel) {
      allUserRelatedMessages = await MessageModel.find({ $or: [ { recipientId: loggedInUser.id }, { senderId: loggedInUser.id } ] }).lean();
    } else {
      allUserRelatedMessages = messages.filter(msg => msg.recipientId === loggedInUser.id || msg.senderId === loggedInUser.id);
    }

    // Apply premium visibility rules and categorize messages
    let processedMessages = [];
    for (const msg of allUserRelatedMessages) {
      let displayMessage = { ...msg }; // Create a copy to modify for display

      // Determine effective premium status of the other party in the conversation
      const otherPartyIsPremium = (msg.senderId === loggedInUser.id) ? msg.recipientEffectivePremiumStatus : msg.senderEffectivePremiumStatus;

      displayMessage.category = 'Inbox'; // Default
      if (msg.senderId === loggedInUser.id) {
        displayMessage.category = 'Sent';
      } else if (msg.recipientId === loggedInUser.id && !msg.read) {
        displayMessage.category = 'Unread'; // Also Inbox, but specifically unread
      }


      // Rule: Free users see blurred/truncated content from premium members if they are the recipient
      if (msg.recipientId === loggedInUser.id && !isUserEffectivelyPremium && otherPartyIsPremium) {
        displayMessage.text = msg.text.substring(0, 20) + "... (Upgrade to premium to read full message)";
        displayMessage.category = 'Locked'; 
        displayMessage.isLocked = true; // Flag for UI
      } else {
        displayMessage.isLocked = false;
      }
      
      // Mark as read if recipient is viewing and it's unread (persisting the change)
      if (msg.recipientId === loggedInUser.id && !msg.read) {
        const originalMessageIndex = messages.findIndex(m => m.id === msg.id);
        if (originalMessageIndex !== -1) messages[originalMessageIndex].read = true;
        if (mongoose.connection.readyState === 1 && MessageModel && msg._id) {
          await MessageModel.updateOne({ _id: msg._id }, { $set: { read: true } });
        }
        displayMessage.read = true; // Reflect in the copy being sent
      }
      processedMessages.push(displayMessage);
    }
    
    // Filtering by category query parameter
    const queryCategory = req.query.category;
    const filterGender = req.query.filterGender; // e.g., ?filterGender=male
    const filterRadius = req.query.filterRadius ? parseInt(req.query.filterRadius, 10) : null; // e.g., ?filterRadius=10 (in miles)

    if (queryCategory) {
      // Category filtering logic (as before)
      switch (queryCategory.toLowerCase()) {
        case 'inbox': 
          processedMessages = processedMessages.filter(msg => msg.recipientId === loggedInUser.id);
          break;
        case 'unread':
          processedMessages = processedMessages.filter(msg => msg.recipientId === loggedInUser.id && !msg.read && !msg.isLocked);
          break;
        case 'sent':
          processedMessages = processedMessages.filter(msg => msg.senderId === loggedInUser.id);
          break;
        case 'locked': 
          processedMessages = processedMessages.filter(msg => msg.recipientId === loggedInUser.id && msg.isLocked);
          break;
        default:
          break;
      }
    }

    // Apply premium filters only if the user is effectively premium
    if (isUserEffectivelyPremium) {
      if (filterGender) {
        processedMessages = processedMessages.filter(msg => {
          // We need sender's gender. Fetch sender user object.
          const sender = users.find(u => u.id === msg.senderId);
          return sender && sender.gender.toLowerCase() === filterGender.toLowerCase();
        });
      }

      if (filterRadius && loggedInUser.location && loggedInUser.location.geoCoordinates) {
        const userLat = loggedInUser.location.geoCoordinates.lat;
        const userLon = loggedInUser.location.geoCoordinates.lon;
        
        processedMessages = processedMessages.filter(msg => {
          const sender = users.find(u => u.id === msg.senderId);
          if (sender && sender.location && sender.location.geoCoordinates) {
            const senderLat = sender.location.geoCoordinates.lat;
            const senderLon = sender.location.geoCoordinates.lon;
            const distance = getDistanceInMiles(userLat, userLon, senderLat, senderLon);
            return distance <= filterRadius;
          }
          return false; // Don't include if sender location is missing
        });
      }
    } else {
      // Optionally, if a non-premium user tries to use these filters, inform them.
      if (filterGender || filterRadius) {
         // Could add a header or a field in the response indicating filters were ignored.
         // For now, filters are silently ignored for non-premium.
      }
    }

    // Sort messages by timestamp, newest first (or by proximity if requested and premium)
    const sortBy = req.query.sortBy;
    if (isUserEffectivelyPremium && sortBy === 'proximity' && loggedInUser.location && loggedInUser.location.geoCoordinates) {
        const userLat = loggedInUser.location.geoCoordinates.lat;
        const userLon = loggedInUser.location.geoCoordinates.lon;
        processedMessages.sort((a, b) => {
            const senderA = users.find(u => u.id === a.senderId);
            const senderB = users.find(u => u.id === b.senderId);
            if (senderA && senderA.location && senderA.location.geoCoordinates && senderB && senderB.location && senderB.location.geoCoordinates) {
                const distA = getDistanceInMiles(userLat, userLon, senderA.location.geoCoordinates.lat, senderA.location.geoCoordinates.lon);
                const distB = getDistanceInMiles(userLat, userLon, senderB.location.geoCoordinates.lat, senderB.location.geoCoordinates.lon);
                return distA - distB;
            }
            return 0; // Default if location data is missing for sorting
        });
    } else {
        processedMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Default sort
    }
    
    res.json(processedMessages);
  } catch (error) {
    logger.error('Inbox error', { error: error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Event creation endpoint
app.post('/events', eventWriteLimiter, authenticateToken, async (req, res) => {
  try {
    const { name, description, date, location, image, thumbnail, schedule = [], tags = [] } = req.body;
    const creatorRawId = req.user.id || req.user.userId;
    const ownerObjectId = toObjectId(creatorRawId);
    if (mongoose.connection.readyState === 1 && EventModel && !ownerObjectId) {
      return res.status(400).json({ message: 'Authenticated user is missing a persistent identifier' });
    }
    const createdByUserId = ownerObjectId ? ownerObjectId.toString() : String(creatorRawId);
    const createdByUsername = req.user.username;

    if (!name || !description || !date || !location) {
      return res.status(400).json({ message: 'Name, description, date, and location are required for an event' });
    }

    const nextId = await computeNextEventId();
    const newEvent = {
      id: nextId,
      name,
      title: name,
      description,
      date,
      location,
      image,
      thumbnail,
      schedule,
      tags,
      createdByUserId,
      createdByUsername,
      rsvps: [],
      comments: [],
    };
    const existingIdx = events.findIndex((e) => String(e.id) === String(nextId));
    if (existingIdx > -1) events.splice(existingIdx, 1);
    events.push({ ...newEvent });
    let saved = newEvent;
    if (mongoose.connection.readyState === 1 && EventModel) {
      saved = await EventModel.create({
        id: nextId,
        name,
        title: name,
        description,
        date,
        location,
        image,
        thumbnail,
        schedule,
        tags,
        createdByUserId: ownerObjectId,
        createdByUsername,
        rsvps: [],
        comments: [],
      });
      // Auto-create forum thread for event under Events & Meetups (cat3)
      try {
        const thread = await ForumThread.create({ categoryId: 'cat3', title: name, authorId: createdByUserId, authorUsername: createdByUsername });
        await EventModel.updateOne({ _id: saved._id }, { $set: { threadId: thread._id } });
        saved.threadId = thread._id;
        // Introductory forum post
        const intro = `Event: ${name}\nDate: ${date}\nLocation: ${newEvent.location}\n\n${newEvent.description || ''}`;
        await ForumPost.create({ threadId: thread._id, authorId: createdByUserId, authorUsername: createdByUsername, body: intro });
      } catch (e) {
        logger.warn('Auto thread create failed', { error: e, requestId: req.requestId, eventId: saved?._id || newEvent.id });
      }
    }
    const normalized = normalizeEventRecord(saved);
    syncEventCache(normalized);
    securityEvent('Event created', { requestId: req.requestId, eventId: normalized?.id, createdByUserId });
    res.status(201).json({ message: 'Event created successfully', data: normalized });
  } catch (error) {
    logger.error('Create event error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error creating event' });
  }
});

// RSVP to an event endpoint
app.post('/events/:eventId/rsvp', rsvpLimiter, authenticateToken, async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const rsvpUserId = String(req.user.id || req.user.userId);
    const rsvpObjectId = toObjectId(rsvpUserId);
    if (mongoose.connection.readyState === 1 && EventModel && !rsvpObjectId) {
      return res.status(400).json({ message: 'Authenticated user is missing a persistent identifier' });
    }
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    if (source === 'db' && mongoose.connection.readyState === 1 && EventModel) {
      const ownerId = ev.createdByUserId ? ev.createdByUserId.toString() : undefined;
      if (ownerId && ownerId === rsvpUserId) {
        return res.status(409).json({ message: 'Organizers are automatically listed for their event.' });
      }

      const hasRsvp = Array.isArray(ev.rsvps) && ev.rsvps.map((r) => r?.toString?.() || String(r)).includes(rsvpUserId);
      if (hasRsvp) {
        return res.status(409).json({ message: 'Already RSVPed to this event' });
      }

      await EventModel.updateOne({ _id: ev._id }, { $addToSet: { rsvps: rsvpObjectId } });
      const updated = await EventModel.findById(ev._id).lean();
      securityEvent('Event RSVP added', {
        requestId: req.requestId,
        eventId: updated?._id?.toString() || eventIdParam,
        userId: rsvpUserId,
      });
      return res.status(201).json({ message: 'RSVP successful', data: normalizeEventRecord(updated) });
    }

    // Fallback in-memory operation
    const event = ev;
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (Array.isArray(event.rsvps) && event.rsvps.includes(rsvpUserId)) {
      return res.status(409).json({ message: 'Already RSVPed to this event' });
    }
    event.rsvps = Array.isArray(event.rsvps) ? [...event.rsvps, rsvpUserId] : [rsvpUserId];
    rsvps.push({ id: rsvps.length + 1, eventId: event.id, userId: rsvpUserId, timestamp: new Date().toISOString() });
    return res.status(201).json({ message: 'RSVP successful', data: event });
  } catch (error) {
    logger.error('RSVP error', { error, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error RSVPing to event' });
  }
});

// Cancel RSVP (toggle off)
app.delete('/events/:eventId/rsvp', authenticateToken, async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const rsvpUserId = String(req.user.id || req.user.userId);
    const rsvpObjectId = toObjectId(rsvpUserId);
    if (mongoose.connection.readyState === 1 && EventModel && !rsvpObjectId) {
      return res.status(400).json({ message: 'Authenticated user is missing a persistent identifier' });
    }
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    if (source === 'db' && mongoose.connection.readyState === 1 && EventModel) {
      await EventModel.updateOne({ _id: ev._id }, { $pull: { rsvps: rsvpObjectId } });
      const updated = await EventModel.findById(ev._id).lean();
      securityEvent('Event RSVP removed', {
        requestId: req.requestId,
        eventId: updated?._id?.toString() || eventIdParam,
        userId: rsvpUserId,
      });
      return res.json({ message: 'RSVP removed', data: normalizeEventRecord(updated) });
    }

    const event = ev;
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (Array.isArray(event.rsvps)) {
      event.rsvps = event.rsvps.filter((v) => String(v) !== rsvpUserId);
    }
    const index = rsvps.findIndex((entry) => String(entry.eventId) === String(event.id) && String(entry.userId) === rsvpUserId);
    if (index > -1) rsvps.splice(index, 1);
    return res.json({ message: 'RSVP removed', data: event });
  } catch (error) {
    logger.error('Cancel RSVP error', { error, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error cancelling RSVP' });
  }
});

// Get all events endpoint
app.get('/events', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && EventModel) {
      const docs = await EventModel.find({}).lean();
      const items = docs.map(normalizeEventRecord);
      return res.json(items);
    }
    res.json(events.map(normalizeEventRecord));
  } catch (error) {
    logger.error('Get events error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Get single event (by numeric id or ObjectId)
app.get('/events/:eventId', async (req, res) => {
  try {
    const { ev, source } = await findEventByParam(req.params.eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    const payload = normalizeEventRecord(ev);
    res.json(payload);
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
    return res.json(normalizeEventRecord(doc));
  } catch (e) {
    logger.error('Ensure thread error', { error: e, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error ensuring thread' });
  }
});

// Get user's RSVPs endpoint
app.get('/my-rsvps', authenticateToken, async (req, res) => {
  try {
    const rsvpUserId = String(req.user.id || req.user.userId);
    const rsvpObjectId = toObjectId(rsvpUserId);
    if (mongoose.connection.readyState === 1 && EventModel) {
      if (!rsvpObjectId) {
        return res.status(400).json({ message: 'Authenticated user is missing a persistent identifier' });
      }
      const docs = await EventModel.find({ rsvps: rsvpObjectId }).lean();
      return res.json(docs.map(normalizeEventRecord));
    }

    // Fallback: derive from in-memory events
    const inMemory = events
      .filter((event) => Array.isArray(event.rsvps) && event.rsvps.includes(rsvpUserId))
      .map((event) => normalizeEventRecord(event));
    res.json(inMemory);
  } catch (error) {
    logger.error('Get my RSVPs error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching your RSVPs' });
  }
});

// Event comments
app.post('/events/:eventId/comments', eventWriteLimiter, authenticateToken, async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text required' });
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    if (source === 'db') {
      const doc = await EventModel.findById(ev._id);
      const commentUserId = new mongoose.Types.ObjectId(req.user.id || req.user.userId);
      const comment = { id: Date.now(), user: req.user.username, userId: commentUserId, text, timestamp: new Date().toISOString() };
      // Mirror to forum thread if available
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
      return res.status(201).json({ ...comment, userId: commentUserId.toString() });
    }
    const comment = { id: Date.now(), user: req.user.username, userId: req.user.id || req.user.userId, text, timestamp: new Date().toISOString() };
    ev.comments = ev.comments || [];
    ev.comments.push(comment);
    securityEvent('Event comment added', { requestId: req.requestId, eventId: eventIdParam, userId: comment.userId });
    res.status(201).json(comment);
  } catch (e) {
    logger.error('Add comment error', { error: e, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error adding comment' });
  }
});

app.put('/events/:eventId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const commentId = parseInt(req.params.commentId, 10);
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text required' });
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    const userId = String(req.user.id || req.user.userId);
    if (source === 'db') {
      const doc = await EventModel.findById(ev._id);
      const c = (doc.comments || []).find(x => x.id === commentId);
      if (!c) return res.status(404).json({ message: 'Comment not found' });
      const can = String(c.userId) === userId || String(doc.createdByUserId) === userId || req.user.developerOverride;
      if (!can) return res.status(403).json({ message: 'Forbidden' });
      c.text = text;
      // Mirror to forum post if present
      if (c.forumPostId) {
        try { await ForumPost.updateOne({ _id: c.forumPostId }, { $set: { body: text } }); } catch (e) { logger.warn('Forum mirror edit failed', { error: e, requestId: req.requestId, eventId: eventIdParam }); }
      }
      await doc.save();
      securityEvent('Event comment edited', { requestId: req.requestId, eventId: eventIdParam, commentId, userId });
      return res.json({ ...c, userId: c.userId ? c.userId.toString() : undefined });
    }
    const c = (ev.comments || []).find(x => x.id === commentId);
    if (!c) return res.status(404).json({ message: 'Comment not found' });
    const can = String(c.userId) === userId || req.user.developerOverride;
    if (!can) return res.status(403).json({ message: 'Forbidden' });
    c.text = text;
    securityEvent('Event comment edited', { requestId: req.requestId, eventId: eventIdParam, commentId, userId });
    res.json(c);
  } catch (e) {
    logger.error('Edit comment error', { error: e, requestId: req.requestId, eventId: req.params.eventId, commentId: req.params.commentId });
    res.status(500).json({ message: 'Error editing comment' });
  }
});

app.delete('/events/:eventId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const commentId = parseInt(req.params.commentId, 10);
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    const userId = String(req.user.id || req.user.userId);
    if (source === 'db') {
      const doc = await EventModel.findById(ev._id);
      const idx = (doc.comments || []).findIndex(x => x.id === commentId);
      if (idx === -1) return res.status(404).json({ message: 'Comment not found' });
      const c = doc.comments[idx];
      const can = String(c.userId) === userId || String(doc.createdByUserId) === userId || req.user.developerOverride;
      if (!can) return res.status(403).json({ message: 'Forbidden' });
      const removed = doc.comments.splice(idx, 1)[0];
      if (removed && removed.forumPostId) {
        try { await ForumPost.deleteOne({ _id: removed.forumPostId }); } catch (e) { logger.warn('Forum mirror delete failed', { error: e, requestId: req.requestId, eventId: eventIdParam }); }
      }
      await doc.save();
      securityEvent('Event comment deleted', { requestId: req.requestId, eventId: eventIdParam, commentId, userId });
      return res.json({ ok: true });
    }
    const idx = (ev.comments || []).findIndex(x => x.id === commentId);
    if (idx === -1) return res.status(404).json({ message: 'Comment not found' });
    const c = ev.comments[idx];
    const can = String(c.userId) === userId || req.user.developerOverride;
    if (!can) return res.status(403).json({ message: 'Forbidden' });
    ev.comments.splice(idx, 1);
    securityEvent('Event comment deleted', { requestId: req.requestId, eventId: eventIdParam, commentId, userId });
    res.json({ ok: true });
  } catch (e) {
    logger.error('Delete comment error', { error: e, requestId: req.requestId, eventId: req.params.eventId, commentId: req.params.commentId });
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

app.delete('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    const userId = String(req.user.id || req.user.userId);
    if (source === 'db') {
      const doc = await EventModel.findById(ev._id);
      const can = String(doc.createdByUserId) === userId || req.user.developerOverride;
      if (!can) return res.status(403).json({ message: 'Forbidden' });
      // Delete associated thread and posts if any
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
      events.splice(events.findIndex((e) => String(e.id) === String(eventIdParam)), 1);
      return res.json({ ok: true });
    }
    // Memory fallback
    const idx = events.findIndex(e => String(e.id) === String(eventIdParam));
    if (idx > -1) events.splice(idx, 1);
    securityEvent('Event deleted', { requestId: req.requestId, eventId: eventIdParam, userId });
    res.json({ ok: true });
  } catch (e) {
    logger.error('Delete event error', { error: e, requestId: req.requestId, eventId: req.params.eventId });
    res.status(500).json({ message: 'Error deleting event' });
  }
});

app.put('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const eventIdParam = req.params.eventId;
    const { ev, source } = await findEventByParam(eventIdParam);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    const userId = String(req.user.id || req.user.userId);
    if (source === 'db') {
      const doc = await EventModel.findById(ev._id);
      const can = String(doc.createdByUserId) === userId || req.user.developerOverride;
      if (!can) return res.status(403).json({ message: 'Forbidden' });
      const allowed = ((f) => ({ name: f.name, description: f.description, date: f.date, location: f.location, image: f.image, thumbnail: f.thumbnail, schedule: f.schedule, tags: f.tags }))(req.body || {});
      const oldName = doc.name || doc.title;
      Object.assign(doc, allowed);
      await doc.save();
      // If name changed, update thread title; if description changed, add a system post
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
      const normalized = normalizeEventRecord(doc);
      syncEventCache(normalized);
      return res.json({ message: 'Event updated successfully', data: normalized });
    }
    // Memory fallback
    const idx = events.findIndex(e => String(e.id) === String(eventIdParam));
    if (idx === -1) return res.status(404).json({ message: 'Event not found' });
    Object.assign(events[idx], req.body || {});
    securityEvent('Event updated', { requestId: req.requestId, eventId: eventIdParam, userId });
    res.json({ message: 'Event updated successfully', data: normalizeEventRecord(events[idx]) });
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
