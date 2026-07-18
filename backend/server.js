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
const { ForumThread, ForumPost, ForumCategory, ForumReport } = require('./models/forum');
let UserModel, EventModel, MessageModel; // loaded only when Mongo is configured
let BusinessModel, ReviewModel, MarketplaceModel; // Business Directory + Marketplace models
let DiscoveredEventModel; // SerpAPI-discovered real-world car events (cached)

// Geocode a city+state into lat/lon using OpenStreetMap Nominatim (free, no API key).
// Returns { lat, lon } or null on failure. Rate-limited to 1 req/sec by Nominatim fair-use policy.
const geocodeLocation = async (city, state) => {
  try {
    const query = encodeURIComponent(`${city}, ${state}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'CarMatch/1.0 (car-match-community)' } });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (e) {
    logger.warn('Geocoding failed', { error: e, city, state });
  }
  return null;
};
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
// SerpAPI key for Google Events discovery. Injected via Cloud Run --set-secrets from
// GCP Secret Manager. Optional — the /events/refresh-discovered endpoint returns 503
// when unset. See /events/refresh-discovered route for usage and budget notes.
const SERPAPI_KEY = process.env.SERPAPI_KEY;
// Shared secret for GitHub Actions cron to trigger discovered-events refresh
// without needing a JWT. Injected via Cloud Run --set-secrets.
const REFRESH_SECRET = process.env.REFRESH_SECRET;
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

// In-memory fallback stores for Business Directory + Marketplace (used when MongoDB is not connected)
const businesses = [];
const businessReviews = [];
const marketplaceListings = [];

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

// Strip sensitive fields (password hash, etc.) from a user object before returning it to clients.
// Handles both Mongoose lean() docs and plain in-memory user objects.
const SENSITIVE_USER_KEYS = ['password'];
const sanitizeUser = (user) => {
  if (!user || typeof user !== 'object') return user;
  const cleaned = { ...user };
  for (const key of SENSITIVE_USER_KEYS) delete cleaned[key];
  return cleaned;
};

app.get('/', (req, res) => {
  res.send('Hello from the Car Match backend!');
});

// Simple health and readiness endpoint for Render/monitoring
const healthHandler = (_req, res) => {
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
};
app.get('/healthz', healthHandler);
// Cloud Run's Google Front End reserves the exact path `/healthz` and intercepts it
// with its own 404 before user traffic reaches the container. `/health` is not reserved
// and is the path used by keep-warm pingers and monitoring.
app.get('/health', healthHandler);

// Geo coordinates for known cities (used by seed data)
const CITY_GEO = {
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'San Diego': { lat: 32.7157, lon: -117.1611 },
  'Chicago': { lat: 41.8781, lon: -87.6298 },
  'Milwaukee': { lat: 43.0389, lon: -87.9065 },
  'Madison': { lat: 43.0731, lon: -89.4012 },
  'Rockford': { lat: 42.2711, lon: -89.0940 },
  'Davis': { lat: 42.0575, lon: -89.4237 },
  'Freeport': { lat: 42.2967, lon: -89.6212 },
  'Galena': { lat: 42.4164, lon: -90.4290 },
  'Dubuque': { lat: 42.5006, lon: -90.6646 },
  'Cedar Rapids': { lat: 41.9778, lon: -91.6656 },
  'Aurora': { lat: 41.7606, lon: -88.3201 },
  'Naperville': { lat: 41.7508, lon: -88.1535 },
  'Indianapolis': { lat: 39.7684, lon: -86.1581 },
  'Detroit': { lat: 42.3314, lon: -83.0458 },
  'St. Louis': { lat: 38.6270, lon: -90.1994 },
  'Minneapolis': { lat: 44.9778, lon: -93.2650 },
};

// Seed demo users with rich, realistic data so the app "feels real"
const seedDemoData = () => {
  if (users.length > 0) return; // already seeded
  try {
    const demoUsers = [
      {
        username: 'demo', password: 'password123', name: 'Bradley Matera', displayTag: 'Demo',
        gender: 'male', city: 'Davis', state: 'IL',
        email: 'demo@carmatch.app',
        biography: 'Founder of CarMatch and lifelong car enthusiast. Started this community to connect drivers across the Midwest. Currently restoring a 1968 Mustang Fastback and tracking a 2023 GR Corolla. Always down to talk cars, meet up at shows, or help with build advice.',
        carInterests: ['Muscle Cars', 'JDM', 'Track Days', 'Restoration', 'Drag Racing', 'Car Shows'],
        profileImage: '',
        premiumStatus: false,
        developerOverride: true,
        role: 'admin',
        cars: [
          { id: 1, name: 'The Project', make: 'Ford', model: 'Mustang Fastback', year: 1968, description: 'Numbers-matching 289 V8 with a C4 auto trans. Frame-off restoration in progress — about 60% done. Original Wimbledon White, adding a subtle modern suspension upgrade while keeping the classic look.', photos: [] },
          { id: 2, name: 'Daily Driver', make: 'Toyota', model: 'GR Corolla Circuit Edition', year: 2023, description: 'Intake, cat-back exhaust, and E85 tune. 320whp on the dyno. Track day weapon that still gets 28 mpg on the highway. Heavy white with red accents.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'dark', textSize: 'normal' },
          connections: { instagram: '@carmatch.app', twitter: '@carmatchapp', website: 'https://bradleymatera.github.io/car-match/' },
        },
      },
      {
        username: 'jane', password: 'password123', name: 'Jane Smith', displayTag: 'JSpeed',
        gender: 'female', city: 'Chicago', state: 'IL',
        email: 'jane@carmatch.app',
        biography: 'Track instructor at Autobahn Country Club and HPDE coach. Been racing for 12 years — started in autocross, moved to time attack, now instructing. Big believer that seat time beats horsepower every time. My GT3 is my third 911 and I will never not own a flat-six.',
        carInterests: ['Track Days', 'Porsche', 'Autocross', 'Time Attack', 'HPDE', 'European'],
        profileImage: '',
        premiumStatus: true,
        developerOverride: false,
        role: 'moderator',
        cars: [
          { id: 1, name: 'Track Weapon', make: 'Porsche', model: '911 GT3', year: 2023, description: 'Spec: 992.1 GT3, 6-speed manual (yes, I chose the stick). Guards Red with black leather. PCS coilovers, Pagid RSL29 pads, Recaro buckets. 1:32.4 at Autobahn full course.', photos: [] },
          { id: 2, name: 'Winter Beater', make: 'Subaru', model: 'WRX', year: 2019, description: 'Base model WRX, 6MT. Winter setup with Blizzaks. It is not fast but it gets me to the track in January.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'dark', textSize: 'normal' },
          connections: { instagram: '@jspeed_racing', twitter: '@janesmith', website: '' },
        },
      },
      {
        username: 'mike', password: 'password123', name: 'Mike Davis', displayTag: 'MDrives',
        gender: 'male', city: 'Milwaukee', state: 'WI',
        email: 'mike@carmatch.app',
        biography: 'Diesel truck guy turned JDM convert. Started with a lifted F-250, then drove my buddy\'s STI and never looked back. Now building an EJ255 swapped GC8 Impreza coupe in my two-car garage. Welding, fabrication, and questionable wiring are my specialties.',
        carInterests: ['JDM', 'Subaru', 'Engine Swaps', 'Fabrication', 'Rally', 'Drift'],
        profileImage: '',
        premiumStatus: false,
        developerOverride: false,
        role: 'user',
        cars: [
          { id: 1, name: 'GC8 Swap Project', make: 'Subaru', model: 'Impreza Coupe', year: 1998, description: 'EJ255 from a 2008 WRX, 5-speed manual, R180 rear diff. Full weld-in roll cage, coilovers, two-tone paint (WRC blue and white). About 80% done — just need to finish wiring and interior.', photos: [] },
          { id: 2, name: 'The Tow Rig', make: 'Ford', model: 'F-250 Super Duty', year: 2014, description: '6.7 Power Stroke, deleted, tuned, straight piped. Hauls the Impreza to track days and pulls my buddy\'s drift car too. 200k miles and still going strong.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: false, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'system', textSize: 'normal' },
          connections: { instagram: '@mdrives_garage', twitter: '', website: '' },
        },
      },
      {
        username: 'tony', password: 'password123', name: 'Tony Reyes', displayTag: 'TReyes',
        gender: 'male', city: 'Rockford', state: 'IL',
        email: 'tony@carmatch.app',
        biography: 'Third-generation mechanic — my grandpa opened Reyes Auto Repair in 1962 and I took over in 2015. I work on everything but my passion is American muscle from the 60s and 70s. Currently own a numbers-matching 1970 Chevelle SS 396 and a 1965 GTO project.',
        carInterests: ['Muscle Cars', 'Classic Restoration', 'American V8', 'Car Shows', 'Drag Racing', 'Mechanic'],
        profileImage: '',
        premiumStatus: true,
        developerOverride: false,
        role: 'user',
        cars: [
          { id: 1, name: 'Big Block', make: 'Chevrolet', model: 'Chevelle SS 396', year: 1970, description: 'Numbers-matching L78 396/375hp, M22 rock crusher 4-speed, 3.73 Posi. Cortez Silver with black stripes. Show-quality restoration completed in 2021. Best of Show at Rockford Autofest 2022.', photos: [] },
          { id: 2, name: 'The Goat Project', make: 'Pontiac', model: 'GTO', year: 1965, description: '389 Tri-Power, 4-speed, basket case when I bought it for $4k. Slowly restoring it in the shop between customer cars. Maybe 2 years out from done.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'light', textSize: 'large' },
          connections: { instagram: '@reyesauto_rockford', twitter: '', website: 'https://reyesautorepair.com' },
        },
      },
      {
        username: 'sarah', password: 'password123', name: 'Sarah Chen', displayTag: 'SChen',
        gender: 'female', city: 'Madison', state: 'WI',
        email: 'sarah@carmatch.app',
        biography: 'Automotive photographer and content creator. I shoot for a few local dealerships and magazines, but my real love is grassroots car meets and track days. Currently building an E36 M3 track car with my boyfriend — first time doing a full build and documenting everything on YouTube.',
        carInterests: ['BMW', 'Track Days', 'Car Photography', 'E36', 'European', 'Content Creation'],
        profileImage: '',
        premiumStatus: false,
        developerOverride: false,
        role: 'user',
        cars: [
          { id: 1, name: 'Track Build', make: 'BMW', model: 'M3', year: 1997, description: 'E36 M3, S52 with Schrick cams, coilovers, big brakes, half-cage, Recaro Pole Positions. Dakar Yellow. Purpose-built for HPDE and time attack. 245whp on the dyno.', photos: [] },
          { id: 2, name: 'Camera Hauler', make: 'Volkswagen', model: 'Golf GTI', year: 2020, description: 'MK7.5 GTI, 6-speed. APR Stage 1, intake, and coilovers. Daily driver and gear hauler. Surprisingly quick and practical.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'dark', textSize: 'normal' },
          connections: { instagram: '@sarahchenphoto', twitter: '@sarahchenphoto', website: 'https://sarahchenphoto.com' },
        },
      },
      {
        username: 'derek', password: 'password123', name: 'Derek Johnson', displayTag: 'DJett',
        gender: 'male', city: 'Indianapolis', state: 'IN',
        email: 'derek@carmatch.app',
        biography: 'Drag racer through and through. Grew up at Muncie Dragway watching my dad run a 1969 Dart. Now I campaign a 2015 Mustang GT with a ProCharger in the 10-second index. Best pass: 10.43 at 131 mph. Looking to break into the 9s next season with a built bottom end.',
        carInterests: ['Drag Racing', 'Mustang', 'Forced Induction', 'American V8', 'Track Days', 'Engine Building'],
        profileImage: '',
        premiumStatus: false,
        developerOverride: false,
        role: 'user',
        cars: [
          { id: 1, name: 'Ten-Second Toy', make: 'Ford', model: 'Mustang GT', year: 2015, description: '5.0 Coyote with ProCharger D1SC, 10psi, ID1300 injectors, BAP, JLT intake, long tubes, off-road X-pipe, Magnaflow Competition. MT82-D4 trans, 4.10 gears, Mickey Thompson ET Street R. 10.43 @ 131 on pump gas.', photos: [] },
          { id: 2, name: 'Trailer Queen Hauler', make: 'Chevrolet', model: 'Silverado 2500HD', year: 2018, description: '6.0 LQ4, tow rig for the Mustang. Nothing fancy but it gets the job done. 130k miles of reliable hauling.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: false, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'dark', textSize: 'normal' },
          connections: { instagram: '@djett_racing', twitter: '', website: '' },
        },
      },
      {
        username: 'maria', password: 'password123', name: 'Maria Gonzalez', displayTag: 'MGonz',
        gender: 'female', city: 'Aurora', state: 'IL',
        email: 'maria@carmatch.app',
        biography: 'JDM all the way. My first car was a 1992 Civic Si and I never stopped loving Hondas. Currently building a K-swap EG hatch for autocross and dailying an FK8 Type R. I can talk about VTEC, camber, and tire pressures for hours. Also a huge fan of the local cars-and-coffee scene.',
        carInterests: ['JDM', 'Honda', 'Autocross', 'K-Swap', 'Cars & Coffee', 'VTEC'],
        profileImage: '',
        premiumStatus: true,
        developerOverride: false,
        role: 'user',
        cars: [
          { id: 1, name: 'K-Swap Hatch', make: 'Honda', model: 'Civic Hatchback Si', year: 1993, description: 'EG hatch with K24A2 swap, RBC intake, SSR headers, K-Tuned exhaust, Hondata FlashPro. 230whp. Coilovers, rear sway, 15x9 RPF1s with 225 RS4s. Autocross build in Street Touring class.', photos: [] },
          { id: 2, name: 'Daily Type R', make: 'Honda', model: 'Civic Type R', year: 2018, description: 'FK8, Championship White. Stock turbo, intake, and FlashPro tune. 320whp. Daily driver that also does track days. Best FWD car ever made, fight me.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'dark', textSize: 'normal' },
          connections: { instagram: '@mgonz_vtec', twitter: '@maria_gonzalez', website: '' },
        },
      },
      {
        username: 'kevin', password: 'password123', name: 'Kevin O\'Brien', displayTag: 'KOB',
        gender: 'male', city: 'Dubuque', state: 'IA',
        email: 'kevin@carmatch.app',
        biography: 'Truck guy, off-roader, and overland enthusiast. Built my Tacoma over 3 years and now it goes everywhere — Moab, Colorado, the UP. Also have a 1979 Bronco that is my forever project. If it has 4WD and a lift, I want to see it.',
        carInterests: ['Off-Road', 'Trucks', 'Overlanding', 'Toyota', 'Ford Bronco', 'Rock Crawling'],
        profileImage: '',
        premiumStatus: false,
        developerOverride: false,
        role: 'user',
        cars: [
          { id: 1, name: 'Overland Rig', make: 'Toyota', model: 'Tacoma TRD Off-Road', year: 2018, description: '3-inch lift, 33-inch BFG KO2s, C4 bumper, Warn Zeon 10-S, Total Chaos UCAs, skid plates, bed rack with RTT, dual battery, fridge. 80k miles of adventures and counting.', photos: [] },
          { id: 2, name: 'Forever Project', make: 'Ford', model: 'Bronco', year: 1979, description: '351M, C6 auto, 4-inch lift, 35s. Rust repair in progress — floors, rockers, and tailpan. Going to be a trail rig when done, not a show truck.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: false, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'system', textSize: 'large' },
          connections: { instagram: '@kob_overland', twitter: '', website: '' },
        },
      },
      {
        username: 'ashley', password: 'password123', name: 'Ashley Turner', displayTag: 'ATurn',
        gender: 'female', city: 'Naperville', state: 'IL',
        email: 'ashley@carmatch.app',
        biography: 'Newer to the car scene but all in. Started with a stock Mazda3 in 2021, now I have a lowered GR86 with full bolt-ons and I autocross monthly. Love the community aspect — everyone is so welcoming and willing to teach. Hoping to do my first track day this summer.',
        carInterests: ['Autocross', 'Toyota', 'GR86', 'Cars & Coffee', 'European', 'Track Days'],
        profileImage: '',
        premiumStatus: false,
        developerOverride: false,
        role: 'user',
        cars: [
          { id: 1, name: 'Autocross Toy', make: 'Toyota', model: 'GR86', year: 2023, description: 'Intake, cat-back, coilovers, 18x8.5 wheels with 245/40 RE71RS. Lowered 1.5 inches. Running CS class in autocross. Still learning but getting faster every event.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'dark', textSize: 'normal' },
          connections: { instagram: '@aturn_cars', twitter: '', website: '' },
        },
      },
      {
        username: 'jordan', password: 'password123', name: 'Jordan Bailey', displayTag: 'JBay',
        gender: 'other', city: 'Detroit', state: 'MI',
        email: 'jordan@carmatch.app',
        biography: 'I work at a supplier for the Big Three and I have gasoline in my veins. Grew up in the Motor City, currently daily a Hellcat and weekend a Fox Body Mustang. Big into cars and coffee, Woodward Dream Cruise, and anything with a V8. Also dabble in EV conversions — heresy, I know.',
        carInterests: ['Muscle Cars', 'Mopar', 'Hellcat', 'Fox Body', 'Woodward Cruise', 'EV Conversions'],
        profileImage: '',
        premiumStatus: false,
        developerOverride: false,
        role: 'user',
        cars: [
          { id: 1, name: 'The Hellcat', make: 'Dodge', model: 'Challenger R/T Scat Pack', year: 2020, description: '392 Hemi, 6-speed manual (yes I know the Hellcat is faster, I like the stick). Go Mango orange. Cat-back, intake, and a tune. 485hp at the crank, sounds like thunder.', photos: [] },
          { id: 2, name: 'Fox Body', make: 'Ford', model: 'Mustang LX 5.0', year: 1991, description: '302 HO, T5, 3.73s. Stock-ish with bolt-ons and a cam. Oxford White with pony wheels. My weekend cruiser and Woodward Dream Cruise car.', photos: [] },
        ],
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'dark', textSize: 'normal' },
          connections: { instagram: '@jbay_motorcity', twitter: '@jordanbailey', website: '' },
        },
      },
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
        email: u.email,
        location: { city: u.city, state: u.state, geoCoordinates: CITY_GEO[u.city] || { lat: 0, lon: 0 } },
        interests: u.carInterests || [], biography: u.biography || '', profileImage: u.profileImage || '', lastLoginTimestamp: null,
        premiumStatus: u.premiumStatus || false,
        developerOverride: u.developerOverride || false,
        role: u.role || 'user',
        cars: u.cars || [],
        preferences: u.preferences || {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'system', textSize: 'normal' },
          connections: { instagram: '', twitter: '', website: '' },
        },
        activityMetadata: { messageCountToday: 0, lastMessageDate: null },
        tierSpecificHistory: {}, createdAt: new Date().toISOString()
      });
    });

    // No fake/seed events — only real events from SerpAPI discovery
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
        email: memUser.email || `${loginUsername}@example.com`,
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
        cars: memUser.cars || [],
        preferences: memUser.preferences || {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'system', textSize: 'normal' },
          connections: { instagram: '', twitter: '', website: '' },
        },
      });
    } else {
      // Backfill rich seed data (cars, preferences, bio, interests) for existing DB users
      // that were created before the seed data was expanded. Only updates fields that are
      // empty/missing so we never overwrite user-made changes.
      const updates = {};
      if ((!dbUser.biography || dbUser.biography === '') && memUser.biography) updates.biography = memUser.biography;
      if ((!dbUser.carInterests || dbUser.carInterests.length === 0) && memUser.interests?.length) updates.carInterests = memUser.interests;
      if ((!dbUser.cars || dbUser.cars.length === 0) && memUser.cars?.length) updates.cars = memUser.cars;
      if (!dbUser.preferences && memUser.preferences) {
        updates.preferences = memUser.preferences;
      } else if (dbUser.preferences && memUser.preferences) {
        // Backfill individual preference sub-fields that are missing or empty
        const dbConn = dbUser.preferences.connections || {};
        const memConn = memUser.preferences.connections || {};
        if (!dbConn.instagram && !dbConn.twitter && !dbConn.website && (memConn.instagram || memConn.twitter || memConn.website)) {
          updates['preferences.connections'] = memConn;
        }
      }
      if ((!dbUser.email || dbUser.email === `${loginUsername}@example.com`) && memUser.email) updates.email = memUser.email;
      // Backfill name if it's still the generic "Demo User" placeholder
      if (dbUser.name === 'Demo User' && memUser.name && memUser.name !== 'Demo User') updates.name = memUser.name;
      if (Object.keys(updates).length > 0) {
        await UserModel.updateOne({ _id: dbUser._id }, { $set: updates });
        dbUser = await UserModel.findOne(query);
      }
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
      cars: dbUser.cars || memUser.cars || [],
      preferences: dbUser.preferences || memUser.preferences || {},
      biography: dbUser.biography || memUser.biography || '',
      profileImage: dbUser.profileImage || memUser.profileImage || '',
      interests: dbUser.carInterests || memUser.interests || [],
      email: dbUser.email || memUser.email || '',
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
      ({ BusinessModel, ReviewModel, MarketplaceModel } = require('./models/business'));
      ({ DiscoveredEventModel } = require('./models/discoveredEvent'));
      // Seed demo forum threads if none
      const count = await ForumThread.countDocuments();
      if (count === 0) {
        await ForumThread.create([
          { categoryId: 'cat1', title: 'Welcome to CarMatch Forums!', authorUsername: 'car_lover', createdAt: new Date(), lastPostAt: new Date(), replies: 0 },
          { categoryId: 'cat2', title: '1968 Mustang Fastback Restoration Log', authorUsername: 'car_lover', createdAt: new Date(), lastPostAt: new Date(), replies: 0 },
        ]);
      }
      // Seed dynamic forum categories if none exist
      try {
        const catCount = await ForumCategory.countDocuments();
        if (catCount === 0) {
          await ForumCategory.create(forumCategories.map((c, i) => ({
            id: c.id, name: c.name, description: c.description, order: i,
          })));
        }
      } catch (ce) {
        logger.warn('Forum category seed warning', { error: ce });
      }
      // Ensure events collection exists; if empty, leave seeding to a dedicated script
      await EventModel.init().catch(()=>{});
      await MessageModel.init().catch(()=>{});
      await UserModel.init().catch(()=>{});
      await syncInMemoryUsersWithDatabase().catch(e => logger.warn('syncInMemoryUsersWithDatabase failed', { error: e?.message || e }));

      // Delete all fake/seeded events — only keep real discovered events
      try {
        const fakeEvents = await EventModel.find({ tags: { $nin: ['discovered'] } }).lean();
        if (fakeEvents.length > 0) {
          // Delete associated forum threads and posts for fake events
          const fakeThreadIds = fakeEvents.filter(e => e.threadId).map(e => e.threadId);
          if (fakeThreadIds.length > 0) {
            await ForumPost.deleteMany({ threadId: { $in: fakeThreadIds } });
            await ForumThread.deleteMany({ _id: { $in: fakeThreadIds } });
          }
          await EventModel.deleteMany({ tags: { $nin: ['discovered'] } });
          // Also remove from in-memory cache
          for (let i = events.length - 1; i >= 0; i--) {
            if (!events[i].tags || !events[i].tags.includes('discovered')) {
              events.splice(i, 1);
            }
          }
          logger.info('Deleted fake/seeded events', { count: fakeEvents.length });
        }
      } catch (fe) {
        logger.warn('Fake event cleanup warning', { error: fe });
      }

      // Ensure every remaining (real) event has a forum thread under Events & Meetups (cat3)
      try {
        const evs = await EventModel.find({ $or: [ { threadId: { $exists: false } }, { threadId: null } ] }).lean();
        for (const e of evs) {
          const title = e.name || e.title || 'Event';
          const thread = await ForumThread.create({ categoryId: 'cat3', title, authorId: e.createdByUserId, authorUsername: e.createdByUsername });
          await EventModel.updateOne({ _id: e._id }, { $set: { threadId: thread._id } });
        }
        // Clean up orphaned threads in cat3 that no longer have a matching event
        const allEventThreadIds = (await EventModel.find({ threadId: { $exists: true } }).lean()).map(e => e.threadId.toString());
        const cat3Threads = await ForumThread.find({ categoryId: 'cat3' }).lean();
        const orphanedThreads = cat3Threads.filter(t => !allEventThreadIds.includes(t._id.toString()));
        if (orphanedThreads.length > 0) {
          const orphanIds = orphanedThreads.map(t => t._id);
          await ForumPost.deleteMany({ threadId: { $in: orphanIds } });
          await ForumThread.deleteMany({ _id: { $in: orphanIds } });
          logger.info('Deleted orphaned event threads', { count: orphanedThreads.length });
        }
      } catch (se) {
        logger.warn('Event-thread sync warning', { error: se });
      }

      // Delete all fake/seeded businesses — only keep real discovered businesses
      try {
        const fakeBusinesses = await BusinessModel.find({ tags: { $nin: ['discovered'] } }).lean();
        if (fakeBusinesses.length > 0) {
          const fakeIds = fakeBusinesses.map(b => b._id);
          await ReviewModel.deleteMany({ businessId: { $in: fakeIds } });
          await BusinessModel.deleteMany({ tags: { $nin: ['discovered'] } });
          logger.info('Deleted fake/seeded businesses', { count: fakeBusinesses.length });
        }
      } catch (be) {
        logger.warn('Fake business cleanup warning', { error: be });
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
app.get('/forums/categories', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cats = await ForumCategory.find({}).sort({ order: 1 }).lean();
      if (cats.length) {
        return res.json(cats.map(c => ({ id: c.id, name: c.name, description: c.description, order: c.order })));
      }
    }
    // Fallback to hardcoded array when DB not connected or empty
    return res.json(forumCategories);
  } catch (e) {
    logger.error('Forum categories error', { error: e, requestId: req.requestId });
    return res.json(forumCategories);
  }
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

app.post('/forums/posts/:postId/report', forumWriteLimiter, authenticateToken, async (req, res) => {
  // Store the report when DB is available; otherwise reject.
  const { postId } = req.params;
  const { reason } = req.body || {};
  try {
    if (!(mongoose.connection.readyState === 1 && ForumReport)) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const report = await ForumReport.create({
      postId,
      reportedBy: req.user.id,
      reportedByUsername: req.user.username,
      reason: reason ? String(reason) : '',
      createdAt: new Date(),
      status: 'pending',
    });
    securityEvent('Forum post reported', {
      requestId: req.requestId,
      postId,
      reportedBy: req.user.id,
      reportedByUsername: req.user.username,
    });
    return res.status(201).json({ ok: true, reportId: report._id });
  } catch (e) {
    logger.error('Forum post report error', { error: e, requestId: req.requestId, params: { postId } });
    res.status(500).json({ message: 'Error reporting post' });
  }
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
      bio,
      carInterests,
      profileImage,
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
        geoCoordinates: await geocodeLocation(city, state) || { lat: 0, lon: 0 },
      },
      interests: Array.isArray(carInterests) ? carInterests : [],
      biography: bio || "",
      profileImage: profileImage || "",
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
        cars: [],
        lastLoginTimestamp: null,
        preferences: {
          notifications: { messagesEmail: true, forumRepliesEmail: true, eventRemindersEmail: true },
          privacy: { showProfile: true, showEmail: false, searchable: true },
          display: { theme: 'system', textSize: 'normal' },
          connections: { instagram: '', twitter: '', website: '' },
        },
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
          cars: dbUser.cars || [],
          preferences: dbUser.preferences || {},
          email: dbUser.email || '',
          lastLoginTimestamp: new Date().toISOString(),
          premiumStatus: !!dbUser.premiumStatus,
          developerOverride: !!dbUser.developerOverride,
          role: dbUser.role || 'user',
          activityMetadata: dbUser.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
          tierSpecificHistory: dbUser.tierSpecificHistory || {},
          createdAt: (dbUser.createdAt instanceof Date ? dbUser.createdAt : new Date()).toISOString(),
        };

        // Persist lastLoginTimestamp to MongoDB
        try {
          await UserModel.updateOne({ _id: dbUser._id }, { $set: { lastLoginTimestamp: authenticatedUser.lastLoginTimestamp } });
        } catch (loginMetaErr) {
          logger.error('Failed to persist lastLoginTimestamp on DB login', { error: loginMetaErr, requestId: req.requestId });
        }

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
          cars: authenticatedUser.cars,
          preferences: authenticatedUser.preferences,
          email: authenticatedUser.email,
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
      // Persist lastLoginTimestamp to MongoDB so it survives restarts
      if (mongoose.connection.readyState === 1 && UserModel) {
        try {
          await UserModel.updateOne({ _id: canonicalId }, { $set: { lastLoginTimestamp: cachedUser.lastLoginTimestamp } });
        } catch (loginMetaErr) {
          logger.error('Failed to persist lastLoginTimestamp', { error: loginMetaErr, requestId: req.requestId });
        }
      }
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
        cars: cachedUser.cars || [],
        preferences: cachedUser.preferences || {},
        email: cachedUser.email || '',
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
          cars: dbUser.cars || [],
          preferences: dbUser.preferences || {},
          email: dbUser.email || '',
          lastLoginTimestamp: dbUser.lastLoginTimestamp || null,
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
app.put('/users/:userId/upgrade-to-premium', authenticateToken, async (req, res) => {
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
  // Persist premium upgrade to MongoDB when available
  try {
    if (mongoose.connection.readyState === 1 && UserModel) {
      await UserModel.updateOne({ _id: targetUserId }, { $set: { premiumStatus: true } });
    }
  } catch (dbErr) {
    logger.error('Premium upgrade DB persist error', { error: dbErr, requestId: req.requestId, targetUserId });
  }
  securityEvent('User upgraded to premium', {
    requestId: req.requestId,
    targetUserId,
    actingUserId: actingUser.id,
    actingUsername: actingUser.username,
  });
  res.json({ message: `User ${userToUpgrade.username} is now premium. Please re-login to update JWT if needed.`, user: sanitizeUser(userToUpgrade) });
});

// Endpoint to toggle developer override for a user
app.put('/users/:userId/toggle-dev-override', authenticateToken, async (req, res) => {
  // Similar authorization logic as above, typically admin-only
  const targetUserId = String(req.params.userId);
  const actingUser = req.user;

  // Only admin or existing dev-override users can toggle dev override (premium users cannot)
  if (String(actingUser.id || actingUser.userId) !== targetUserId && !(actingUser.developerOverride || actingUser.role === 'admin')) { // Simplistic admin check
      return res.status(403).json({ message: "Forbidden: Only admins/devs can toggle override for others." });
  }

  const userToToggle = users.find(u => String(u.id) === targetUserId);
  if (!userToToggle) {
    return res.status(404).json({ message: 'User to toggle not found' });
  }

  userToToggle.developerOverride = !userToToggle.developerOverride;
  const newValue = userToToggle.developerOverride;
  // Persist dev override toggle to MongoDB when available
  try {
    if (mongoose.connection.readyState === 1 && UserModel) {
      await UserModel.updateOne({ _id: targetUserId }, { $set: { developerOverride: newValue } });
    }
  } catch (dbErr) {
    logger.error('Dev override DB persist error', { error: dbErr, requestId: req.requestId, targetUserId });
  }
  securityEvent('Developer override toggled', {
    requestId: req.requestId,
    targetUserId,
    actingUserId: actingUser.id,
    actingUsername: actingUser.username,
    newValue,
  });
  res.json({ message: `User ${userToToggle.username} developer override is now ${newValue}. Please re-login to update JWT.`, user: sanitizeUser(userToToggle) });
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
    res.json({ user: sanitizeUser(user) });
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
    if (b.cars) set.cars = Array.isArray(b.cars) ? b.cars : [];
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
    res.json({ ok: true, user: sanitizeUser(responseUser) });
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
      // Persist activity metadata to MongoDB so daily limits survive restarts
      if (mongoose.connection.readyState === 1 && UserModel) {
        try {
          await UserModel.updateOne(
            { _id: senderUser.id },
            { $set: {
              'activityMetadata.messageCountToday': senderUser.activityMetadata.messageCountToday,
              'activityMetadata.lastMessageDate': senderUser.activityMetadata.lastMessageDate,
            } }
          );
        } catch (metaErr) {
          logger.error('Failed to persist activityMetadata', { error: metaErr, requestId: req.requestId });
        }
      }
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

// Mark a message as read or unread
app.patch('/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const readStatus = Boolean(req.body.read);
    const userId = String(req.user.id || req.user.userId);

    // Update in-memory if present
    const memIdx = messages.findIndex(m => String(m.id) === messageId || String(m._id) === messageId);
    if (memIdx !== -1) {
      if (messages[memIdx].recipientId !== userId && messages[memIdx].senderId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      messages[memIdx].read = readStatus;
    }

    // Update in MongoDB if connected
    if (mongoose.connection.readyState === 1 && MessageModel) {
      const msg = await MessageModel.findById(messageId);
      if (!msg) return res.status(404).json({ message: 'Message not found' });
      if (String(msg.recipientId) !== userId && String(msg.senderId) !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      msg.read = readStatus;
      await msg.save();
    }

    res.json({ ok: true, read: readStatus });
  } catch (e) {
    logger.error('Mark message read error', { error: e, requestId: req.requestId });
    res.status(500).json({ message: 'Error updating message' });
  }
});

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
      // Cache for sender details looked up from DB (avoids repeated queries)
      const senderDetailCache = new Map();
      const getSenderDetails = async (senderId) => {
        const key = String(senderId);
        if (senderDetailCache.has(key)) return senderDetailCache.get(key);
        // Try in-memory first
        let sender = users.find(u => String(u.id) === key);
        if (!sender && mongoose.connection.readyState === 1 && UserModel) {
          // Fall back to DB when sender isn't in the in-memory array
          try {
            const dbSender = await UserModel.findById(key).lean();
            if (dbSender) {
              sender = {
                id: dbSender._id ? dbSender._id.toString() : key,
                gender: dbSender.gender,
                location: dbSender.location,
              };
            }
          } catch (dbErr) {
            logger.warn('Sender DB lookup failed', { error: dbErr, requestId: req.requestId, senderId: key });
          }
        }
        senderDetailCache.set(key, sender || null);
        return sender || null;
      };

      if (filterGender) {
        const keepIds = new Set();
        for (const msg of processedMessages) {
          const sender = await getSenderDetails(msg.senderId);
          if (sender && sender.gender && String(sender.gender).toLowerCase() === String(filterGender).toLowerCase()) {
            keepIds.add(msg.id);
          }
        }
        processedMessages = processedMessages.filter(msg => keepIds.has(msg.id));
      }

      if (filterRadius && loggedInUser.location && loggedInUser.location.geoCoordinates) {
        const userLat = loggedInUser.location.geoCoordinates.lat;
        const userLon = loggedInUser.location.geoCoordinates.lon;
        
        const keepIds = new Set();
        for (const msg of processedMessages) {
          const sender = await getSenderDetails(msg.senderId);
          if (sender && sender.location && sender.location.geoCoordinates) {
            const senderLat = sender.location.geoCoordinates.lat;
            const senderLon = sender.location.geoCoordinates.lon;
            const distance = getDistanceInMiles(userLat, userLon, senderLat, senderLon);
            if (distance <= filterRadius) keepIds.add(msg.id);
          }
          // Don't include if sender location is missing
        }
        processedMessages = processedMessages.filter(msg => keepIds.has(msg.id));
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
        // Cache sender details for sort (avoids repeated queries)
        const sortSenderCache = new Map();
        const getSortSender = async (senderId) => {
          const key = String(senderId);
          if (sortSenderCache.has(key)) return sortSenderCache.get(key);
          let sender = users.find(u => String(u.id) === key);
          if (!sender && mongoose.connection.readyState === 1 && UserModel) {
            try {
              const dbSender = await UserModel.findById(key).lean();
              if (dbSender) {
                sender = {
                  id: dbSender._id ? dbSender._id.toString() : key,
                  location: dbSender.location,
                };
              }
            } catch (dbErr) {
              logger.warn('Sender DB lookup (sort) failed', { error: dbErr, requestId: req.requestId, senderId: key });
            }
          }
          sortSenderCache.set(key, sender || null);
          return sender || null;
        };
        // Pre-fetch senders for all messages to sort synchronously
        const senderMap = new Map();
        for (const msg of processedMessages) {
          const s = await getSortSender(msg.senderId);
          senderMap.set(String(msg.senderId), s);
        }
        processedMessages.sort((a, b) => {
            const senderA = senderMap.get(String(a.senderId));
            const senderB = senderMap.get(String(b.senderId));
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

// =============================================================
// NHTSA Vehicle Data Proxy Routes
// These are FREE, no-API-key endpoints provided by the US
// government (National Highway Traffic Safety Administration).
// The backend proxies them so the frontend can call our own API
// without running into browser CORS restrictions. No auth is
// required for these routes because the underlying data is public.
// =============================================================

// Simple in-memory cache (Map with 10-minute TTL) to avoid hammering NHTSA
// for repeated identical queries. Entries expire automatically on read.
const nhtsaCache = new Map();
const NHTSA_CACHE_TTL_MS = 10 * 60 * 1000;
const nhtsaCacheGet = (key) => {
  const entry = nhtsaCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > NHTSA_CACHE_TTL_MS) {
    nhtsaCache.delete(key);
    return undefined;
  }
  return entry.value;
};
const nhtsaCacheSet = (key, value) => {
  nhtsaCache.set(key, { ts: Date.now(), value });
};

// Dedicated rate limiter for vehicle data lookups (public, but external-bound).
const vehicleLimiter = useLimiter(
  createSensitiveLimiter({
    windowMs: 10 * 60 * 1000,
    max: 120,
    message: 'Too many vehicle data requests. Please slow down.',
  })
);

// Helper: fetch JSON from NHTSA with caching. Returns { ok, status, data }.
const nhtsaFetch = async (url) => {
  const cached = nhtsaCacheGet(url);
  if (cached !== undefined) return { ok: true, status: 200, data: cached, cached: true };
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'CarMatch/1.0 (car-match-community)' } });
    if (!resp.ok) return { ok: false, status: resp.status };
    const data = await resp.json();
    nhtsaCacheSet(url, data);
    return { ok: true, status: resp.status, data };
  } catch (e) {
    logger.warn('NHTSA fetch failed', { error: e, url });
    return { ok: false, status: 502 };
  }
};

// Route 1: GET /vehicle/decode-vin/:vin
// Proxy to vpic.nhtsa.dot.gov DecodeVin and flatten the Results array
// (which is a list of { Variable, Value } pairs) into a clean object.
app.get('/vehicle/decode-vin/:vin', vehicleLimiter, async (req, res) => {
  const vin = String(req.params.vin || '').trim().toUpperCase();
  if (!vin || vin.length !== 17) {
    return res.status(400).json({ message: 'Invalid VIN. A VIN must be exactly 17 characters.' });
  }
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`;
  const result = await nhtsaFetch(url);
  if (!result.ok) {
    return res.status(502).json({ message: 'NHTSA vehicle data service is unavailable. Please try again later.' });
  }
  const data = result.data || {};
  const results = Array.isArray(data.Results) ? data.Results : [];
  const byVariable = {};
  for (const row of results) {
    if (row && typeof row.Variable === 'string') {
      byVariable[row.Variable] = row.Value != null ? String(row.Value).trim() : '';
    }
  }
  const pick = (...names) => {
    for (const n of names) {
      const v = byVariable[n];
      if (v && v.length && !/error|not available|null/i.test(v)) return v;
    }
    return '';
  };
  const decoded = {
    make: pick('Make'),
    model: pick('Model'),
    modelYear: pick('Model Year', 'ModelYear'),
    bodyClass: pick('Body Class'),
    engineModel: pick('Engine Model', 'EngineModel'),
    displacementL: pick('Displacement (L)', 'DisplacementL'),
    fuelType: pick('Fuel Type - Primary', 'Fuel Type Primary', 'Fuel Type'),
    transmissionStyle: pick('Transmission Style', 'TransmissionStyle'),
    drivetrain: pick('Drive Type', 'DriveType', 'Drivetrain'),
    manufacturer: pick('Manufacturer Name', 'ManufacturerName', 'Manufacturer'),
    plant: pick('Plant City', 'Plant Company Name', 'PlantCompanyName', 'Plant'),
    vehicleType: pick('Vehicle Type', 'VehicleType'),
  };
  res.json({ vin, decoded });
});

// Route 2: GET /vehicle/recalls?make=&model=&year=
// Proxy to api.nhtsa.gov recallsByVehicle. NHTSA already returns clean JSON.
app.get('/vehicle/recalls', vehicleLimiter, async (req, res) => {
  const make = String(req.query.make || '').trim();
  const model = String(req.query.model || '').trim();
  const year = String(req.query.year || '').trim();
  if (!make || !model || !year) {
    return res.status(400).json({ message: 'make, model, and year query parameters are required.' });
  }
  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
  const result = await nhtsaFetch(url);
  if (!result.ok) {
    return res.status(502).json({ message: 'NHTSA recalls service is unavailable. Please try again later.' });
  }
  res.json(result.data);
});

// Route 3: GET /vehicle/safety-ratings?make=&model=&year=
// Two-step: resolve VehicleId from model/make/year, then fetch the ratings.
app.get('/vehicle/safety-ratings', vehicleLimiter, async (req, res) => {
  const make = String(req.query.make || '').trim();
  const model = String(req.query.model || '').trim();
  const year = String(req.query.year || '').trim();
  if (!make || !model || !year) {
    return res.status(400).json({ message: 'make, model, and year query parameters are required.' });
  }
  const listUrl = `https://api.nhtsa.gov/SafetyRatings/modelyear/${encodeURIComponent(year)}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}`;
  const listResult = await nhtsaFetch(listUrl);
  if (!listResult.ok) {
    return res.status(502).json({ message: 'NHTSA safety ratings service is unavailable. Please try again later.' });
  }
  const listData = listResult.data || {};
  const results = Array.isArray(listData.Results) ? listData.Results : [];
  const vehicleId = results.length > 0 ? results[0].VehicleId : null;
  if (!vehicleId) {
    return res.status(404).json({ message: 'No safety ratings found for this vehicle.' });
  }
  const detailUrl = `https://api.nhtsa.gov/SafetyRatings/VehicleId/${encodeURIComponent(vehicleId)}`;
  const detailResult = await nhtsaFetch(detailUrl);
  if (!detailResult.ok) {
    return res.status(502).json({ message: 'NHTSA safety ratings service is unavailable. Please try again later.' });
  }
  const detailData = detailResult.data || {};
  const detailResults = Array.isArray(detailData.Results) ? detailData.Results : [];
  const r = detailResults.length > 0 ? detailResults[0] : {};
  res.json({
    vehicleDescription: r.VehicleDescription || '',
    overallRating: r.OverallRating || '',
    overallFrontCrashRating: r.OverallFrontCrashRating || '',
    overallSideCrashRating: r.OverallSideCrashRating || '',
    rolloverRating: r.RolloverRating || '',
    recallsCount: r.RecallsCount != null ? r.RecallsCount : '',
    complaintsCount: r.ComplaintsCount != null ? r.ComplaintsCount : '',
    investigationCount: r.InvestigationCount != null ? r.InvestigationCount : '',
  });
});

// Route 4: GET /vehicle/complaints?make=&model=&year=
// Proxy to api.nhtsa.gov complaintsByVehicle, simplified + capped at 20.
app.get('/vehicle/complaints', vehicleLimiter, async (req, res) => {
  const make = String(req.query.make || '').trim();
  const model = String(req.query.model || '').trim();
  const year = String(req.query.year || '').trim();
  if (!make || !model || !year) {
    return res.status(400).json({ message: 'make, model, and year query parameters are required.' });
  }
  const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
  const result = await nhtsaFetch(url);
  if (!result.ok) {
    return res.status(502).json({ message: 'NHTSA complaints service is unavailable. Please try again later.' });
  }
  const data = result.data || {};
  const rawResults = Array.isArray(data.results) ? data.results : [];
  const simplified = rawResults.slice(0, 20).map((c) => ({
    odiNumber: c.odiNumber != null ? c.odiNumber : (c.ODINumber != null ? c.ODINumber : ''),
    components: c.components != null ? c.components : (c.Components != null ? c.Components : ''),
    summary: c.summary != null ? c.summary : (c.Summary != null ? c.Summary : ''),
    dateOfIncident: c.dateOfIncident != null ? c.dateOfIncident : (c.DateOfIncident != null ? c.DateOfIncident : ''),
    crash: c.crash != null ? c.crash : (c.Crash != null ? c.Crash : false),
    fire: c.fire != null ? c.fire : (c.Fire != null ? c.Fire : false),
    numberOfInjuries: c.numberOfInjuries != null ? c.numberOfInjuries : (c.NumberOfInjuries != null ? c.NumberOfInjuries : 0),
    numberOfDeaths: c.numberOfDeaths != null ? c.numberOfDeaths : (c.NumberOfDeaths != null ? c.NumberOfDeaths : 0),
  }));
  res.json({ count: simplified.length, results: simplified });
});

// ============================================================
// Business Directory + Marketplace features
// Routes for automotive business listings, reviews, and classifieds.
// Follows the same dual-mode pattern (Mongo when connected, in-memory
// fallback otherwise) as users/events/messages.
// ============================================================

// Escape a string for safe use inside a RegExp.
const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// --- Helpers: Business / Marketplace ---
const dbReady = () => mongoose.connection.readyState === 1;

const normalizeBusiness = (raw) => {
  if (!raw) return null;
  const doc = raw.toObject ? raw.toObject() : raw;
  return {
    id: doc._id ? doc._id.toString() : doc.id,
    ownerId: doc.ownerId,
    ownerUsername: doc.ownerUsername,
    businessName: doc.businessName,
    category: doc.category,
    description: doc.description,
    services: doc.services || [],
    address: doc.address,
    city: doc.city,
    state: doc.state,
    zipCode: doc.zipCode,
    geoCoordinates: doc.geoCoordinates || null,
    phone: doc.phone,
    email: doc.email,
    website: doc.website,
    hours: doc.hours,
    logo: doc.logo,
    photos: doc.photos || [],
    certifications: doc.certifications || [],
    verified: !!doc.verified,
    rating: doc.rating || 0,
    reviewCount: doc.reviewCount || 0,
    tags: doc.tags || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const normalizeReview = (raw) => {
  if (!raw) return null;
  const doc = raw.toObject ? raw.toObject() : raw;
  return {
    id: doc._id ? doc._id.toString() : doc.id,
    businessId: doc.businessId ? doc.businessId.toString() : doc.businessId,
    reviewerId: doc.reviewerId,
    reviewerUsername: doc.reviewerUsername,
    rating: doc.rating,
    text: doc.text,
    createdAt: doc.createdAt,
  };
};

const normalizeListing = (raw) => {
  if (!raw) return null;
  const doc = raw.toObject ? raw.toObject() : raw;
  return {
    id: doc._id ? doc._id.toString() : doc.id,
    sellerId: doc.sellerId,
    sellerUsername: doc.sellerUsername,
    sellerType: doc.sellerType,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    price: doc.price,
    condition: doc.condition,
    location: doc.location || {},
    photos: doc.photos || [],
    contactPhone: doc.contactPhone,
    contactEmail: doc.contactEmail,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

// --- Business Routes ---

// POST /businesses - create a business listing (auth required)
app.post('/businesses', authenticateToken, async (req, res) => {
  try {
    const {
      businessName, category, description, services = [], address, city, state,
      zipCode, phone, email, website, hours, logo, photos = [], certifications = [],
    } = req.body;

    if (!businessName || !category) {
      return res.status(400).json({ message: 'businessName and category are required' });
    }

    const ownerId = String(req.user.id || req.user.userId);
    const ownerUsername = req.user.username;

    // Geocode city+state when available
    let geoCoordinates = null;
    if (city && state) {
      geoCoordinates = await geocodeLocation(city, state);
    }

    const baseFields = {
      ownerId,
      ownerUsername,
      businessName,
      category,
      description,
      services,
      address,
      city,
      state,
      zipCode,
      geoCoordinates,
      phone,
      email,
      website,
      hours,
      logo,
      photos,
      certifications,
      verified: false,
      rating: 0,
      reviewCount: 0,
    };

    let saved;
    if (dbReady() && BusinessModel) {
      saved = await BusinessModel.create(baseFields);
    } else {
      saved = {
        id: `biz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...baseFields,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      businesses.push(saved);
    }

    res.status(201).json({ message: 'Business created successfully', data: normalizeBusiness(saved) });
  } catch (error) {
    logger.error('Create business error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error creating business' });
  }
});

// GET /businesses - list businesses with filters + pagination
app.get('/businesses', async (req, res) => {
  try {
    const { category, city, state, q, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    if (dbReady() && BusinessModel) {
      const filter = {};
      if (category) filter.category = category;
      if (city) filter.city = new RegExp(escapeRegExp(city), 'i');
      if (state) filter.state = new RegExp(escapeRegExp(state), 'i');
      if (q) {
        filter.$or = [
          { businessName: new RegExp(escapeRegExp(q), 'i') },
          { description: new RegExp(escapeRegExp(q), 'i') },
          { services: new RegExp(escapeRegExp(q), 'i') },
        ];
      }
      const skip = (pageNum - 1) * limitNum;
      const [docs, total] = await Promise.all([
        BusinessModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        BusinessModel.countDocuments(filter),
      ]);
      return res.json({
        data: docs.map(normalizeBusiness),
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    // In-memory fallback
    let results = businesses.slice();
    if (category) results = results.filter(b => b.category === category);
    if (city) results = results.filter(b => b.city && b.city.toLowerCase().includes(city.toLowerCase()));
    if (state) results = results.filter(b => b.state && b.state.toLowerCase().includes(state.toLowerCase()));
    if (q) {
      const ql = q.toLowerCase();
      results = results.filter(b =>
        (b.businessName && b.businessName.toLowerCase().includes(ql)) ||
        (b.description && b.description.toLowerCase().includes(ql)) ||
        (Array.isArray(b.services) && b.services.some(s => s.toLowerCase().includes(ql)))
      );
    }
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = results.length;
    const start = (pageNum - 1) * limitNum;
    return res.json({
      data: results.slice(start, start + limitNum).map(normalizeBusiness),
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Get businesses error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching businesses' });
  }
});

// GET /businesses/:id - single business with reviews
app.get('/businesses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let business = null;
    let reviews = [];

    if (dbReady() && BusinessModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Business not found' });
      business = await BusinessModel.findById(id).lean();
      if (!business) return res.status(404).json({ message: 'Business not found' });
      if (ReviewModel) {
        reviews = await ReviewModel.find({ businessId: business._id }).sort({ createdAt: -1 }).lean();
      }
      return res.json({ data: { ...normalizeBusiness(business), reviews: reviews.map(normalizeReview) } });
    }

    business = businesses.find(b => String(b.id) === String(id));
    if (!business) return res.status(404).json({ message: 'Business not found' });
    reviews = businessReviews.filter(r => String(r.businessId) === String(business.id));
    return res.json({ data: { ...normalizeBusiness(business), reviews: reviews.map(normalizeReview) } });
  } catch (error) {
    logger.error('Get business error', { error, requestId: req.requestId, businessId: req.params.id });
    res.status(500).json({ message: 'Error fetching business' });
  }
});

// PATCH /businesses/:id - update a business (owner or admin only)
app.patch('/businesses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user.id || req.user.userId);
    const isAdmin = req.user.role === 'admin';
    const allowed = ['businessName', 'category', 'description', 'services', 'address', 'city', 'state', 'zipCode', 'phone', 'email', 'website', 'hours', 'logo', 'photos', 'certifications'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    // Re-geocode if city/state changed
    if ((updates.city || updates.state) && (req.body.city || req.body.state)) {
      const city = updates.city || req.body.existingCity;
      const state = updates.state || req.body.existingState;
      if (city && state) {
        const geo = await geocodeLocation(city, state);
        if (geo) updates.geoCoordinates = geo;
      }
    }

    if (dbReady() && BusinessModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Business not found' });
      const doc = await BusinessModel.findById(id);
      if (!doc) return res.status(404).json({ message: 'Business not found' });
      if (String(doc.ownerId) !== userId && !isAdmin) {
        securityEvent('Unauthorized business update attempt', { requestId: req.requestId, businessId: id, userId });
        return res.status(403).json({ message: 'Forbidden' });
      }
      Object.keys(updates).forEach(k => { doc[k] = updates[k]; });
      doc.updatedAt = new Date();
      await doc.save();
      return res.json({ message: 'Business updated successfully', data: normalizeBusiness(doc) });
    }

    const idx = businesses.findIndex(b => String(b.id) === String(id));
    if (idx === -1) return res.status(404).json({ message: 'Business not found' });
    if (String(businesses[idx].ownerId) !== userId && !isAdmin) {
      securityEvent('Unauthorized business update attempt', { requestId: req.requestId, businessId: id, userId });
      return res.status(403).json({ message: 'Forbidden' });
    }
    businesses[idx] = { ...businesses[idx], ...updates, updatedAt: new Date() };
    return res.json({ message: 'Business updated successfully', data: normalizeBusiness(businesses[idx]) });
  } catch (error) {
    logger.error('Update business error', { error, requestId: req.requestId, businessId: req.params.id });
    res.status(500).json({ message: 'Error updating business' });
  }
});

// DELETE /businesses/:id - delete a business (owner or admin only)
app.delete('/businesses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user.id || req.user.userId);
    const isAdmin = req.user.role === 'admin';

    if (dbReady() && BusinessModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Business not found' });
      const doc = await BusinessModel.findById(id);
      if (!doc) return res.status(404).json({ message: 'Business not found' });
      if (String(doc.ownerId) !== userId && !isAdmin) {
        securityEvent('Unauthorized business delete attempt', { requestId: req.requestId, businessId: id, userId });
        return res.status(403).json({ message: 'Forbidden' });
      }
      await BusinessModel.deleteOne({ _id: doc._id });
      if (ReviewModel) await ReviewModel.deleteMany({ businessId: doc._id });
      return res.json({ message: 'Business deleted successfully' });
    }

    const idx = businesses.findIndex(b => String(b.id) === String(id));
    if (idx === -1) return res.status(404).json({ message: 'Business not found' });
    if (String(businesses[idx].ownerId) !== userId && !isAdmin) {
      securityEvent('Unauthorized business delete attempt', { requestId: req.requestId, businessId: id, userId });
      return res.status(403).json({ message: 'Forbidden' });
    }
    businesses.splice(idx, 1);
    for (let i = businessReviews.length - 1; i >= 0; i--) {
      if (String(businessReviews[i].businessId) === String(id)) businessReviews.splice(i, 1);
    }
    return res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    logger.error('Delete business error', { error, requestId: req.requestId, businessId: req.params.id });
    res.status(500).json({ message: 'Error deleting business' });
  }
});

// POST /businesses/:id/reviews - add a review (auth required)
app.post('/businesses/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, text } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating (1-5) is required' });
    }
    const reviewerId = String(req.user.id || req.user.userId);
    const reviewerUsername = req.user.username;

    if (dbReady() && BusinessModel && ReviewModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Business not found' });
      const business = await BusinessModel.findById(id);
      if (!business) return res.status(404).json({ message: 'Business not found' });
      const review = await ReviewModel.create({
        businessId: business._id,
        reviewerId,
        reviewerUsername,
        rating: Number(rating),
        text,
      });
      // Recompute average rating + count
      const agg = await ReviewModel.aggregate([
        { $match: { businessId: business._id } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      business.rating = agg.length ? Math.round(agg[0].avg * 10) / 10 : 0;
      business.reviewCount = agg.length ? agg[0].count : 0;
      business.updatedAt = new Date();
      await business.save();
      return res.status(201).json({ message: 'Review added successfully', data: normalizeReview(review) });
    }

    const business = businesses.find(b => String(b.id) === String(id));
    if (!business) return res.status(404).json({ message: 'Business not found' });
    const review = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      businessId: business.id,
      reviewerId,
      reviewerUsername,
      rating: Number(rating),
      text,
      createdAt: new Date(),
    };
    businessReviews.push(review);
    const all = businessReviews.filter(r => String(r.businessId) === String(business.id));
    business.reviewCount = all.length;
    business.rating = Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10;
    business.updatedAt = new Date();
    return res.status(201).json({ message: 'Review added successfully', data: normalizeReview(review) });
  } catch (error) {
    logger.error('Create business review error', { error, requestId: req.requestId, businessId: req.params.id });
    res.status(500).json({ message: 'Error creating review' });
  }
});

// GET /businesses/:id/reviews - list reviews for a business (paginated)
app.get('/businesses/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    if (dbReady() && ReviewModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Business not found' });
      const skip = (pageNum - 1) * limitNum;
      const [docs, total] = await Promise.all([
        ReviewModel.find({ businessId: id }).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        ReviewModel.countDocuments({ businessId: id }),
      ]);
      return res.json({
        data: docs.map(normalizeReview),
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    let results = businessReviews.filter(r => String(r.businessId) === String(id));
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = results.length;
    const start = (pageNum - 1) * limitNum;
    return res.json({
      data: results.slice(start, start + limitNum).map(normalizeReview),
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Get business reviews error', { error, requestId: req.requestId, businessId: req.params.id });
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// POST /businesses/refresh-discovered — auth required (admin JWT OR shared refresh secret).
// Uses SerpAPI Google Maps engine to find real automotive businesses near Davis, IL (50mi radius).
const BUSINESS_SEARCH_QUERIES = [
  { q: 'auto repair shop', category: 'repair-shop' },
  { q: 'auto parts store', category: 'parts-store' },
  { q: 'performance auto shop', category: 'performance-shop' },
  { q: 'car detailing', category: 'detailing' },
  { q: 'towing service', category: 'towing' },
  { q: 'tire shop', category: 'general-automotive' },
  { q: 'car dealership', category: 'general-automotive' },
  { q: 'auto body repair', category: 'repair-shop' },
  { q: 'oil change', category: 'general-automotive' },
  { q: 'transmission repair', category: 'repair-shop' },
];

app.post('/businesses/refresh-discovered', async (req, res) => {
  try {
    const hasRefreshSecret = REFRESH_SECRET && req.headers['x-refresh-secret'] === REFRESH_SECRET;
    if (!hasRefreshSecret) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        const isAdmin = decoded.role === 'admin' || decoded.developerOverride === true;
        if (!isAdmin) {
          return res.status(403).json({ message: 'Forbidden: admin only' });
        }
      } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }

    if (!SERPAPI_KEY) {
      return res.status(503).json({ message: 'SerpAPI key not configured' });
    }
    // Wait for MongoDB connection if still connecting (Cloud Run cold start)
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connection.asPromise();
      } catch (e) {
        return res.status(503).json({ message: 'Database not connected' });
      }
    }
    if (!BusinessModel) {
      // Models might not be loaded yet — try loading them
      try {
        ({ BusinessModel, ReviewModel, MarketplaceModel } = require('./models/business'));
      } catch (e) {
        return res.status(503).json({ message: 'Business models not available' });
      }
    }

    // Davis, IL coordinates (Lee County) — 50 mile radius
    // @41.8,-89.2,12z is roughly the center; we search with broader zoom for 50mi
    const ll = '@41.8,-89.2,11z';
    const searchUrl = (q) => `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(q)}&type=search&ll=${encodeURIComponent(ll)}&api_key=${encodeURIComponent(SERPAPI_KEY)}`;

    const fetchOne = async ({ q, category }) => {
      const url = searchUrl(q);
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) throw new Error(`SerpAPI HTTP ${resp.status} for "${q}"`);
      const json = await resp.json();
      return { q, category, json };
    };

    const settled = await Promise.allSettled(BUSINESS_SEARCH_QUERIES.map(fetchOne));

    // Collect all unique businesses (dedupe by place_id or title+address)
    const seen = new Set();
    const allDocs = [];
    const results = [];

    for (const r of settled) {
      if (r.status !== 'fulfilled') {
        const sq = BUSINESS_SEARCH_QUERIES[settled.indexOf(r)];
        results.push({ query: sq.q, found: 0, error: String(r.reason?.message || r.reason) });
        continue;
      }
      const { q, category, json } = r.value;
      const places = Array.isArray(json?.local_results) ? json.local_results : [];
      let count = 0;
      for (const p of places) {
        const dedupeKey = p.place_id || `${p.title}|${p.address}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        // Parse address to extract city, state, zip
        const addrParts = (p.address || '').split(',').map(s => s.trim());
        let city = '', state = '', zip = '', streetAddr = '';
        if (addrParts.length >= 3) {
          streetAddr = addrParts[0];
          city = addrParts[1];
          const stateZip = addrParts[2].match(/^([A-Z]{2})\s+(\d{5})/);
          if (stateZip) { state = stateZip[1]; zip = stateZip[2]; }
        } else if (addrParts.length === 2) {
          streetAddr = addrParts[0];
          const stateZip = addrParts[1].match(/^([A-Z]{2})\s+(\d{5})/);
          if (stateZip) { state = stateZip[1]; zip = stateZip[2]; }
        }

        allDocs.push({
          businessName: p.title || 'Unknown',
          category,
          description: p.description || `${p.type || q} in ${city || 'the area'}`,
          services: p.types ? p.types.filter(Boolean) : [p.type || q],
          address: p.address || '',
          city,
          state,
          zipCode: zip,
          geoCoordinates: p.gps_coordinates ? { lat: p.gps_coordinates.latitude, lon: p.gps_coordinates.longitude } : { lat: 0, lon: 0 },
          phone: p.phone || '',
          website: p.website || '',
          hours: p.open_state || '',
          logo: p.thumbnail || p.serpapi_thumbnail || '',
          photos: p.thumbnail ? [p.thumbnail] : [],
          rating: p.rating || 0,
          reviewCount: p.reviews || 0,
          verified: true,
          tags: ['discovered', category],
          ownerId: 'discovered-system',
          ownerUsername: 'CarMatch_Discovered',
        });
        count++;
      }
      results.push({ query: q, found: count });
    }

    // Delete previously discovered businesses and their reviews
    const oldDiscovered = await BusinessModel.find({ tags: 'discovered' }).lean();
    const oldIds = oldDiscovered.map(b => b._id);
    if (oldIds.length > 0) {
      await ReviewModel.deleteMany({ businessId: { $in: oldIds } });
      await BusinessModel.deleteMany({ tags: 'discovered' });
    }

    // Insert new discovered businesses
    let createdCount = 0;
    if (allDocs.length > 0) {
      const inserted = await BusinessModel.insertMany(allDocs, { ordered: false });
      createdCount = inserted.length;
    }

    logger.info('Discovered businesses refreshed', { count: createdCount, total: allDocs.length, requestId: req.requestId });
    return res.json({
      message: 'Discovered businesses refreshed',
      count: createdCount,
      total: allDocs.length,
      results,
    });
  } catch (error) {
    logger.error('POST /businesses/refresh-discovered error', { error: error?.message || error, requestId: req.requestId });
    return res.status(500).json({ message: 'Error refreshing discovered businesses' });
  }
});

// --- Marketplace Routes ---

// POST /marketplace - create a listing (auth required)
app.post('/marketplace', authenticateToken, async (req, res) => {
  try {
    const {
      sellerType = 'individual', title, description, category, price, condition,
      location = {}, photos = [], contactPhone, contactEmail,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'title, description, and category are required' });
    }

    const sellerId = String(req.user.id || req.user.userId);
    const sellerUsername = req.user.username;

    const baseFields = {
      sellerId,
      sellerUsername,
      sellerType,
      title,
      description,
      category,
      price: price != null ? Number(price) : undefined,
      condition,
      location,
      photos,
      contactPhone,
      contactEmail,
      status: 'active',
    };

    let saved;
    if (dbReady() && MarketplaceModel) {
      saved = await MarketplaceModel.create(baseFields);
    } else {
      saved = {
        id: `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...baseFields,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      marketplaceListings.push(saved);
    }

    res.status(201).json({ message: 'Listing created successfully', data: normalizeListing(saved) });
  } catch (error) {
    logger.error('Create marketplace listing error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error creating listing' });
  }
});

// GET /marketplace - list active listings with filters + pagination
app.get('/marketplace', async (req, res) => {
  try {
    const { category, q, condition, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    if (dbReady() && MarketplaceModel) {
      const filter = { status: 'active' };
      if (category) filter.category = category;
      if (condition) filter.condition = condition;
      if (minPrice != null || maxPrice != null) {
        filter.price = {};
        if (minPrice != null) filter.price.$gte = Number(minPrice);
        if (maxPrice != null) filter.price.$lte = Number(maxPrice);
      }
      if (q) {
        filter.$or = [
          { title: new RegExp(escapeRegExp(q), 'i') },
          { description: new RegExp(escapeRegExp(q), 'i') },
        ];
      }
      const skip = (pageNum - 1) * limitNum;
      const [docs, total] = await Promise.all([
        MarketplaceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        MarketplaceModel.countDocuments(filter),
      ]);
      return res.json({
        data: docs.map(normalizeListing),
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    let results = marketplaceListings.filter(l => l.status === 'active');
    if (category) results = results.filter(l => l.category === category);
    if (condition) results = results.filter(l => l.condition === condition);
    if (minPrice != null) results = results.filter(l => l.price != null && l.price >= Number(minPrice));
    if (maxPrice != null) results = results.filter(l => l.price != null && l.price <= Number(maxPrice));
    if (q) {
      const ql = q.toLowerCase();
      results = results.filter(l =>
        (l.title && l.title.toLowerCase().includes(ql)) ||
        (l.description && l.description.toLowerCase().includes(ql))
      );
    }
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = results.length;
    const start = (pageNum - 1) * limitNum;
    return res.json({
      data: results.slice(start, start + limitNum).map(normalizeListing),
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Get marketplace listings error', { error, requestId: req.requestId });
    res.status(500).json({ message: 'Error fetching listings' });
  }
});

// GET /marketplace/:id - single listing
app.get('/marketplace/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (dbReady() && MarketplaceModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Listing not found' });
      const doc = await MarketplaceModel.findById(id).lean();
      if (!doc) return res.status(404).json({ message: 'Listing not found' });
      return res.json({ data: normalizeListing(doc) });
    }
    const listing = marketplaceListings.find(l => String(l.id) === String(id));
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    return res.json({ data: normalizeListing(listing) });
  } catch (error) {
    logger.error('Get marketplace listing error', { error, requestId: req.requestId, listingId: req.params.id });
    res.status(500).json({ message: 'Error fetching listing' });
  }
});

// PATCH /marketplace/:id - update a listing (seller or admin only)
app.patch('/marketplace/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user.id || req.user.userId);
    const isAdmin = req.user.role === 'admin';
    const allowed = ['title', 'description', 'category', 'price', 'condition', 'location', 'photos', 'contactPhone', 'contactEmail'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    if (updates.price != null) updates.price = Number(updates.price);

    if (dbReady() && MarketplaceModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Listing not found' });
      const doc = await MarketplaceModel.findById(id);
      if (!doc) return res.status(404).json({ message: 'Listing not found' });
      if (String(doc.sellerId) !== userId && !isAdmin) {
        securityEvent('Unauthorized listing update attempt', { requestId: req.requestId, listingId: id, userId });
        return res.status(403).json({ message: 'Forbidden' });
      }
      Object.keys(updates).forEach(k => { doc[k] = updates[k]; });
      doc.updatedAt = new Date();
      await doc.save();
      return res.json({ message: 'Listing updated successfully', data: normalizeListing(doc) });
    }

    const idx = marketplaceListings.findIndex(l => String(l.id) === String(id));
    if (idx === -1) return res.status(404).json({ message: 'Listing not found' });
    if (String(marketplaceListings[idx].sellerId) !== userId && !isAdmin) {
      securityEvent('Unauthorized listing update attempt', { requestId: req.requestId, listingId: id, userId });
      return res.status(403).json({ message: 'Forbidden' });
    }
    marketplaceListings[idx] = { ...marketplaceListings[idx], ...updates, updatedAt: new Date() };
    return res.json({ message: 'Listing updated successfully', data: normalizeListing(marketplaceListings[idx]) });
  } catch (error) {
    logger.error('Update marketplace listing error', { error, requestId: req.requestId, listingId: req.params.id });
    res.status(500).json({ message: 'Error updating listing' });
  }
});

// DELETE /marketplace/:id - soft delete a listing (seller or admin only)
app.delete('/marketplace/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user.id || req.user.userId);
    const isAdmin = req.user.role === 'admin';

    if (dbReady() && MarketplaceModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Listing not found' });
      const doc = await MarketplaceModel.findById(id);
      if (!doc) return res.status(404).json({ message: 'Listing not found' });
      if (String(doc.sellerId) !== userId && !isAdmin) {
        securityEvent('Unauthorized listing delete attempt', { requestId: req.requestId, listingId: id, userId });
        return res.status(403).json({ message: 'Forbidden' });
      }
      doc.status = 'removed';
      doc.updatedAt = new Date();
      await doc.save();
      return res.json({ message: 'Listing removed successfully' });
    }

    const idx = marketplaceListings.findIndex(l => String(l.id) === String(id));
    if (idx === -1) return res.status(404).json({ message: 'Listing not found' });
    if (String(marketplaceListings[idx].sellerId) !== userId && !isAdmin) {
      securityEvent('Unauthorized listing delete attempt', { requestId: req.requestId, listingId: id, userId });
      return res.status(403).json({ message: 'Forbidden' });
    }
    marketplaceListings[idx].status = 'removed';
    marketplaceListings[idx].updatedAt = new Date();
    return res.json({ message: 'Listing removed successfully' });
  } catch (error) {
    logger.error('Delete marketplace listing error', { error, requestId: req.requestId, listingId: req.params.id });
    res.status(500).json({ message: 'Error removing listing' });
  }
});

// PATCH /marketplace/:id/sold - mark a listing as sold (seller or admin only)
app.patch('/marketplace/:id/sold', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user.id || req.user.userId);
    const isAdmin = req.user.role === 'admin';

    if (dbReady() && MarketplaceModel) {
      if (!isObjectIdLike(id)) return res.status(404).json({ message: 'Listing not found' });
      const doc = await MarketplaceModel.findById(id);
      if (!doc) return res.status(404).json({ message: 'Listing not found' });
      if (String(doc.sellerId) !== userId && !isAdmin) {
        securityEvent('Unauthorized listing sold attempt', { requestId: req.requestId, listingId: id, userId });
        return res.status(403).json({ message: 'Forbidden' });
      }
      doc.status = 'sold';
      doc.updatedAt = new Date();
      await doc.save();
      return res.json({ message: 'Listing marked as sold', data: normalizeListing(doc) });
    }

    const idx = marketplaceListings.findIndex(l => String(l.id) === String(id));
    if (idx === -1) return res.status(404).json({ message: 'Listing not found' });
    if (String(marketplaceListings[idx].sellerId) !== userId && !isAdmin) {
      securityEvent('Unauthorized listing sold attempt', { requestId: req.requestId, listingId: id, userId });
      return res.status(403).json({ message: 'Forbidden' });
    }
    marketplaceListings[idx].status = 'sold';
    marketplaceListings[idx].updatedAt = new Date();
    return res.json({ message: 'Listing marked as sold', data: normalizeListing(marketplaceListings[idx]) });
  } catch (error) {
    logger.error('Mark listing sold error', { error, requestId: req.requestId, listingId: req.params.id });
    res.status(500).json({ message: 'Error marking listing as sold' });
  }
});

// ---------------------------------------------------------------------------
// Discovered Events (SerpAPI integration)
//
// This uses SerpAPI (https://serpapi.com) to query Google Events for real-world
// car events (car shows, cars & coffee, auto shows, car meets, track days).
//
// Budget: SerpAPI free tier = 250 searches/month. Each refresh runs 5 searches,
// so a daily cron refresh = ~150 searches/month, well within the free budget.
//
// Caching: Results are stored in MongoDB (DiscoveredEvent collection). User
// traffic hits the cached GET /events/discovered endpoint and never touches
// SerpAPI directly. Refresh should be triggered once daily via a cron job
// (GitHub Actions) calling POST /events/refresh-discovered with an admin token.
//
// Secret: SERPAPI_KEY is loaded from the SERPAPI_KEY env var, which is injected
// via Cloud Run's --set-secrets flag (backed by GCP Secret Manager).
// ---------------------------------------------------------------------------

// GET /events/discovered is registered earlier (before /events/:eventId) to
// avoid the param route catching "discovered" as an event ID.

// Best-effort parser for SerpAPI Google Events date text into a JS Date.
// Handles "Today", "Tomorrow", "Yesterday", and common date formats. Returns
// null when the text can't be confidently parsed.
const parseSerpApiDateText = (text) => {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  const now = new Date();
  try {
    if (lower.startsWith('today')) {
      const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ap = timeMatch[3].toLowerCase();
        if (ap === 'pm' && h !== 12) h += 12;
        if (ap === 'am' && h === 12) h = 0;
        d.setHours(h, m, 0, 0);
      }
      return d;
    }
    if (lower.startsWith('tomorrow')) {
      const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ap = timeMatch[3].toLowerCase();
        if (ap === 'pm' && h !== 12) h += 12;
        if (ap === 'am' && h === 12) h = 0;
        d.setHours(h, m, 0, 0);
      }
      return d;
    }
    if (lower.startsWith('yesterday')) {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    // Try native Date parse for formats like "Mon, Jan 15, 2025" or "Jan 15, 2025"
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
      return parsed;
    }
    // Try extracting a full date "Jan 15, 2025"
    const dateSub = text.match(/[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/);
    if (dateSub) {
      const d2 = new Date(dateSub[0]);
      if (!Number.isNaN(d2.getTime())) return d2;
    }
    // Try "Jul 25" or "Jul 25 – Jul 26" (no year — assume current or next year)
    const monthDayMatch = text.match(/([A-Za-z]{3,9})\s+(\d{1,2})(?:\s*[–-]\s*(?:[A-Za-z]{3,9}\s+)?(\d{1,2}))?/);
    if (monthDayMatch) {
      const monthStr = monthDayMatch[1];
      const day = parseInt(monthDayMatch[2], 10);
      const endDay = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : day;
      // Use start day for the event date
      const yearGuess = now.getFullYear();
      const d3 = new Date(`${monthStr} ${day}, ${yearGuess}`);
      if (!Number.isNaN(d3.getTime())) {
        // If the date is in the past by more than 30 days, assume next year
        if (d3 < now && (now - d3) > 30 * 86400000) {
          d3.setFullYear(yearGuess + 1);
        }
        d3.setHours(0, 0, 0, 0);
        return d3;
      }
    }
    // Try day-of-week only "Sat, 10 AM – 3 PM" — find next occurrence of that weekday
    const dowMatch = text.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/i);
    if (dowMatch) {
      const dows = ['sun','mon','tue','wed','thu','fri','sat'];
      const targetDow = dows.indexOf(dowMatch[1].toLowerCase());
      if (targetDow >= 0) {
        const d4 = new Date(now);
        d4.setHours(0, 0, 0, 0);
        let diff = (targetDow - d4.getDay() + 7) % 7;
        if (diff === 0) diff = 7; // If today is that day, use next week
        d4.setDate(d4.getDate() + diff);
        return d4;
      }
    }
  } catch (e) {
    // best-effort; leave null
  }
  return null;
};

// POST /events/refresh-discovered — auth required (admin JWT OR shared refresh secret).
// Runs SerpAPI Google Events searches for car-event keywords and caches results.
app.post('/events/refresh-discovered', async (req, res) => {
  try {
    // Allow shared secret (for GitHub Actions cron) as alternative to JWT
    const hasRefreshSecret = REFRESH_SECRET && req.headers['x-refresh-secret'] === REFRESH_SECRET;
    if (!hasRefreshSecret) {
      // Fall back to JWT auth — need to manually verify since we're not using the middleware
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        const isAdmin = decoded.role === 'admin' || decoded.developerOverride === true;
        if (!isAdmin) {
          securityEvent('Unauthorized discovered-events refresh attempt', { requestId: req.requestId, userId: decoded.id || decoded.userId, ip: req.ip });
          return res.status(403).json({ message: 'Forbidden: admin only' });
        }
      } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }

    if (!SERPAPI_KEY) {
      return res.status(503).json({ message: 'SerpAPI key not configured' });
    }

    // Core queries run daily (5 searches = 150/month, within free tier)
    // Extended queries run weekly or on-demand to fill the calendar
    const coreQueries = ['car show', 'cars and coffee', 'auto show', 'car meet', 'track day'];
    const extendedQueries = [
      'cruise night', 'car cruise', 'car rally', 'drag racing', 'drift event',
      'car auction', 'swap meet', 'car corral', 'concours d elegance',
      'hot rod show', 'classic car show', 'vintage car show', 'antique car show',
      'car show Illinois', 'car show Chicago', 'car show Rockford IL',
      'cars and coffee Chicago', 'car meet Wisconsin', 'car show Iowa',
      'car show Indiana', 'car show Missouri', 'car show Minnesota',
      'muscle car show', 'JDM car meet', 'truck show', 'motorcycle rally',
      'electric vehicle show', 'import car show', 'lowrider show',
      'car show near me',
    ];
    const isFullRefresh = req.query.full === '1' || req.query.full === 'true' || req.body?.full === true;
    const queries = isFullRefresh ? [...coreQueries, ...extendedQueries] : coreQueries;
    logger.info('Event refresh mode', { full: isFullRefresh, queryCount: queries.length, requestId: req.requestId });
    const searchUrl = (q) => `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(q)}&location=United+States&api_key=${encodeURIComponent(SERPAPI_KEY)}`;

    const fetchSerpApi = async (query) => {
      const url = searchUrl(query);
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) {
        throw new Error(`SerpAPI HTTP ${resp.status} for query "${query}"`);
      }
      const json = await resp.json();
      return { query, json };
    };

    const settled = await Promise.allSettled(queries.map(fetchSerpApi));

    const allDocs = [];
    const results = [];
    for (const r of settled) {
      if (r.status !== 'fulfilled') {
        const query = queries[settled.indexOf(r)];
        logger.warn('SerpAPI query failed', { query, error: r.reason?.message || r.reason });
        results.push({ query, found: 0, error: String(r.reason?.message || r.reason) });
        continue;
      }
      const { query, json } = r.value;
      const eventsResults = Array.isArray(json?.events_results) ? json.events_results : [];
      for (const ev of eventsResults) {
        const dateText = ev?.date?.when || ev?.date?.start_date || (typeof ev?.date === 'string' ? ev.date : null);
        // Try parsing the full "when" text first; fall back to start_date which is often "Jul 25"
        let parsedDate = parseSerpApiDateText(ev?.date?.when);
        if (!parsedDate && ev?.date?.start_date) {
          parsedDate = parseSerpApiDateText(ev.date.start_date);
        }
        const addressArr = Array.isArray(ev?.address) ? ev.address : [];
        const venueName = ev?.venue?.name || '';
        const cityMatch = addressArr.find((a) => /,\s*[A-Z]{2}/.test(a || ''));
        let city = '';
        let state = '';
        if (cityMatch) {
          const parts = cityMatch.split(',').map((s) => s.trim());
          city = parts[0] || '';
          const stateZip = (parts[1] || '').trim().split(/\s+/);
          state = stateZip[0] || '';
        }
        allDocs.push({
          title: ev?.title || 'Untitled event',
          dateText: dateText || '',
          dateStart: parsedDate,
          location: {
            name: venueName,
            address: addressArr,
            city,
            state,
          },
          link: ev?.link || '',
          thumbnail: ev?.thumbnail || ev?.image || '',
          description: ev?.description || '',
          searchQuery: query,
          source: 'google_events',
        });
      }
      results.push({ query, found: eventsResults.length });
    }

    // Create REAL Event records from SerpAPI data.
    // These are actual events that show up in the main events list, on the
    // calendar, and support RSVP — not a separate "discovered" section.
    // They are tagged with 'discovered' so we can identify and replace them
    // on each refresh cycle.
    let createdCount = 0;
    if (mongoose.connection.readyState === 1 && EventModel) {
      // Delete previously discovered events (tagged with 'discovered')
      // and their associated forum threads/posts
      const oldDiscovered = await EventModel.find({ tags: 'discovered' }).lean();
      const oldThreadIds = oldDiscovered.filter(e => e.threadId).map(e => e.threadId);
      if (oldThreadIds.length > 0) {
        await ForumPost.deleteMany({ threadId: { $in: oldThreadIds } });
        await ForumThread.deleteMany({ _id: { $in: oldThreadIds } });
      }
      await EventModel.deleteMany({ tags: 'discovered' });
      // Also remove from in-memory cache
      for (let i = events.length - 1; i >= 0; i--) {
        if (Array.isArray(events[i].tags) && events[i].tags.includes('discovered')) {
          events.splice(i, 1);
        }
      }

      // Find or create a system user to be the "creator" of discovered events
      let systemUser = await UserModel.findOne({ username: 'CarMatch_Discovered' }).lean();
      if (!systemUser) {
        systemUser = await UserModel.create({
          mockId: '0',
          username: 'CarMatch_Discovered',
          email: 'discovered@carmatch.internal',
          password: await bcrypt.hash(Math.random().toString(36), saltRounds),
          name: 'CarMatch Events',
          displayTag: 'CarMatch',
          gender: 'prefer_not_to_say',
          location: { city: 'USA', state: 'US', geoCoordinates: { lat: 0, lon: 0 } },
          role: 'admin',
          developerOverride: false,
          premiumStatus: true,
          biography: 'Automated event discovery via SerpAPI',
          profileImage: '',
          carInterests: [],
        });
      }
      const systemUserId = systemUser._id;

      // Create real Event records from SerpAPI data
      for (const doc of allDocs) {
        try {
          const nextId = await computeNextEventId();
          // Build a readable location string
          const locParts = [];
          if (doc.location.name) locParts.push(doc.location.name);
          if (doc.location.city) locParts.push(doc.location.city);
          if (doc.location.state) locParts.push(doc.location.state);
          const locationStr = locParts.join(', ') || 'See event link for details';

          // Build description with link to original source
          let desc = doc.description || '';
          if (doc.dateText) desc = (desc ? desc + '\n\n' : '') + `📅 ${doc.dateText}`;
          if (doc.link) desc = (desc ? desc + '\n' : '') + `🔗 ${doc.link}`;

          const eventDoc = await EventModel.create({
            id: nextId,
            name: doc.title,
            title: doc.title,
            description: desc,
            date: doc.dateStart ? doc.dateStart.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            location: locationStr,
            image: doc.thumbnail || '',
            thumbnail: doc.thumbnail || '',
            tags: ['discovered', doc.searchQuery.replace(/\s+/g, '-')],
            createdByUserId: systemUserId,
            createdByUsername: 'CarMatch_Discovered',
            rsvps: [],
            comments: [],
          });

          // Auto-create a discussion thread for this event
          try {
            const thread = await ForumThread.create({
              categoryId: 'cat3',
              title: doc.title,
              authorId: systemUserId,
              authorUsername: 'CarMatch_Discovered',
            });
            await EventModel.updateOne({ _id: eventDoc._id }, { $set: { threadId: thread._id } });
            // Introductory post with event details
            const introBody = `📅 ${doc.dateText || doc.dateStart?.toDateString() || 'Date TBD'}\n📍 ${locationStr}\n\n${doc.description || ''}${doc.link ? '\n\n🔗 More info: ' + doc.link : ''}`;
            await ForumPost.create({
              threadId: thread._id,
              authorId: systemUserId,
              authorUsername: 'CarMatch_Discovered',
              body: introBody,
            });
          } catch (te) {
            logger.warn('Auto thread create failed for discovered event', { title: doc.title, error: te?.message });
          }

          // Also add to in-memory cache
          events.push(normalizeEventRecord(eventDoc));
          createdCount++;
        } catch (e) {
          logger.warn('Failed to create discovered event', { title: doc.title, error: e?.message });
        }
      }
    } else {
      logger.warn('refresh-discovered: MongoDB not connected, events not created', { count: allDocs.length });
    }

    logger.info('Discovered events created as real events', { count: createdCount, total: allDocs.length, queries: queries.length, requestId: req.requestId });
    return res.json({
      message: 'Discovered events refreshed',
      count: createdCount,
      total: allDocs.length,
      queries: queries.length,
      results,
    });
  } catch (error) {
    logger.error('POST /events/refresh-discovered error', { error: error?.message || error, requestId: req.requestId });
    return res.status(500).json({ message: 'Error refreshing discovered events' });
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
