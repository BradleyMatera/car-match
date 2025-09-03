require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import cors
const mongoose = require('mongoose');
const { ForumThread, ForumPost } = require('./models/forum');
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// JWT: require secret in non-dev, allow fallback only in development
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_VERSION = process.env.TOKEN_VERSION || '1';
if (!JWT_SECRET) {
  if (process.env.NODE_ENV !== 'development') {
    console.error('FATAL: JWT_SECRET is required in production.');
    process.exit(1);
  } else {
    console.warn('WARNING: Using insecure development JWT secret');
  }
}

// CORS hardening: allow only configured origins (comma-separated). Allow localhost in dev.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl/postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && localhostRegex.test(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('Hello from the Car Match backend!');
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
        activityMetadata: { messageCountToday: 0, lastMessageDate: null },
        tierSpecificHistory: {}, createdAt: new Date().toISOString()
      });
    });

    // Basic sample events to show if frontend switches to real events
    const now = new Date();
    const fmt = (d) => d.toISOString().slice(0,10);
    events.push(
      { id: 1, name: 'Demo Cars & Coffee', description: 'Meet local enthusiasts.', date: fmt(new Date(now.getTime()+7*86400000)), location: 'Los Angeles, CA', createdByUserId: 1, createdByUsername: 'demo', rsvps: [] },
      { id: 2, name: 'Track Day Intro', description: 'Beginner-friendly track event.', date: fmt(new Date(now.getTime()+14*86400000)), location: 'San Francisco, CA', createdByUserId: 2, createdByUsername: 'jane', rsvps: [] }
    );
  } catch (e) {
    console.error('Seeding error:', e);
  }
};
seedDemoData();

// MongoDB connection (optional but recommended for persistence)
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      console.log('Connected to MongoDB');
      // Seed demo forum threads if none
      const count = await ForumThread.countDocuments();
      if (count === 0) {
        await ForumThread.create([
          { categoryId: 'cat1', title: 'Welcome to CarMatch Forums!', authorUsername: 'car_lover', createdAt: new Date(), lastPostAt: new Date(), replies: 0 },
          { categoryId: 'cat2', title: '1968 Mustang Fastback Restoration Log', authorUsername: 'car_lover', createdAt: new Date(), lastPostAt: new Date(), replies: 0 },
        ]);
      }
    })
    .catch(err => {
      console.error('MongoDB connection failed:', err.message);
    });
} else {
  console.warn('MONGODB_URI not set; forums will not persist across restarts.');
}

// --- Forums API ---
app.get('/forums/categories', (req, res) => {
  res.json(forumCategories);
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
    console.error('List threads error:', e);
    res.status(500).json({ message: 'Error fetching threads' });
  }
});

app.post('/forums/threads', authenticateToken, async (req, res) => {
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
    console.error('Create thread error:', e);
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
      return res.json({ thread, posts });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    console.error('Get thread error:', e);
    res.status(500).json({ message: 'Error fetching thread' });
  }
});

app.post('/forums/threads/:threadId/posts', authenticateToken, async (req, res) => {
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
    console.error('Add post error:', e);
    res.status(500).json({ message: 'Error adding post' });
  }
});

app.patch('/forums/threads/:threadId/pin', authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { pinned } = req.body;
  try {
    if (mongoose.connection.readyState === 1) {
      const thread = await ForumThread.findByIdAndUpdate(threadId, { pinned: !!pinned }, { new: true }).lean();
      if (!thread) return res.status(404).json({ message: 'Thread not found' });
      return res.json({ ok: true, thread });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    console.error('Pin thread error:', e);
    res.status(500).json({ message: 'Error pinning thread' });
  }
});

app.patch('/forums/threads/:threadId/lock', authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { locked } = req.body;
  try {
    if (mongoose.connection.readyState === 1) {
      const thread = await ForumThread.findByIdAndUpdate(threadId, { locked: !!locked }, { new: true }).lean();
      if (!thread) return res.status(404).json({ message: 'Thread not found' });
      return res.json({ ok: true, thread });
    }
    return res.status(503).json({ message: 'Database not available' });
  } catch (e) {
    console.error('Lock thread error:', e);
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
    console.error('Delete thread error:', e);
    res.status(500).json({ message: 'Error deleting thread' });
  }
});

app.post('/forums/posts/:postId/report', authenticateToken, (req, res) => {
  // Stub: accept report
  res.status(201).json({ ok: true });
});

// User registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { 
      username, 
      password, 
      name, 
      displayTag, 
      gender, 
      city, 
      state 
      // Other fields like orientation, interests, bio, profileImage can be added later or made optional
    } = req.body;

    if (!username || !password || !name || !displayTag || !gender || !city || !state) {
      return res.status(400).json({ message: 'Username, password, name, displayTag, gender, city, and state are required' });
    }

    // Check if user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = { 
      id: users.length + 1, // simple id generation
      username, 
      password: hashedPassword,
      name,
      displayTag,
      gender,
      location: { 
        city, 
        state, 
        // Mock geoCoordinates for now. In a real app, this would come from a geocoding service or user input.
        geoCoordinates: { lat: (Math.random() * 180 - 90), lon: (Math.random() * 360 - 180) } 
      },
      interests: [], // Default to empty, can be updated later
      biography: "", // Default to empty
      profileImage: "", // Default to empty
      lastLoginTimestamp: null,
      premiumStatus: false, // Default to non-premium
      developerOverride: false, // Default
      activityMetadata: { messageCountToday: 0, lastMessageDate: null }, // For daily limits
      tierSpecificHistory: {}, // Default
      createdAt: new Date().toISOString()
    };
    users.push(newUser);

    console.log('Registered User:', newUser); // For debugging
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials (user not found)' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (password mismatch)' });
    }

    // Update last login timestamp
    user.lastLoginTimestamp = new Date().toISOString();

    // Update last login timestamp
    user.lastLoginTimestamp = new Date().toISOString();

    // Include more user info in JWT payload
    const tokenPayload = { 
      userId: user.id, 
      username: user.username, 
      premiumStatus: user.premiumStatus,
      developerOverride: user.developerOverride // Add dev override to JWT
    };
    tokenPayload.tokenVersion = TOKEN_VERSION;
    const token = jwt.sign(tokenPayload, JWT_SECRET || 'dev-insecure-secret', { expiresIn: '1h' });
    
    res.json({ 
      token, 
      userId: user.id, 
      username: user.username,
      name: user.name,
      displayTag: user.displayTag,
      premiumStatus: user.premiumStatus,
      developerOverride: user.developerOverride
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // if there isn't any token
  }

  jwt.verify(token, JWT_SECRET || 'dev-insecure-secret', (err, decodedPayload) => { 
    if (err) {
      console.error('JWT verification error:', err);
      return res.sendStatus(403); // if token is no longer valid
    }
    if (decodedPayload && decodedPayload.tokenVersion && decodedPayload.tokenVersion !== TOKEN_VERSION) {
      return res.status(401).json({ message: 'Token version expired. Please re-login.' });
    }
    // Find the full user object to get the most up-to-date status, including developerOverride
    const fullUser = users.find(u => u.id === decodedPayload.userId);
    if (!fullUser) {
      return res.sendStatus(401); // User from token not found in our system
    }
    req.user = fullUser; // Attach the full, current user object
    next(); // proceed to the protected route
  });
}

// Endpoint to simulate upgrading a user to premium
app.put('/users/:userId/upgrade-to-premium', authenticateToken, (req, res) => {
  // In a real app, only an admin or a payment success callback would hit this.
  // For simulation, any authenticated user can call this on THEMSELVES if they are an admin, or if it's for dev testing.
  // For simplicity here, we'll allow an admin (or dev override user) to upgrade anyone.
  // Or a user to upgrade themselves.
  
  const targetUserId = parseInt(req.params.userId, 10);
  const actingUser = req.user; // User performing the action

  // Basic check: allow self-upgrade or admin/dev override to upgrade others
  if (actingUser.id !== targetUserId && !(actingUser.premiumStatus || actingUser.developerOverride)) {
      return res.status(403).json({ message: "Forbidden: You can only upgrade yourself or an admin/dev can upgrade others." });
  }

  const userToUpgrade = users.find(u => u.id === targetUserId);
  if (!userToUpgrade) {
    return res.status(404).json({ message: 'User to upgrade not found' });
  }

  userToUpgrade.premiumStatus = true;
  console.log(`User ${userToUpgrade.username} upgraded to premium.`);
  res.json({ message: `User ${userToUpgrade.username} is now premium. Please re-login to update JWT if needed.`, user: {id: userToUpgrade.id, username: userToUpgrade.username, premiumStatus: userToUpgrade.premiumStatus} });
});

// Endpoint to toggle developer override for a user
app.put('/users/:userId/toggle-dev-override', authenticateToken, (req, res) => {
  // Similar authorization logic as above, typically admin-only
  const targetUserId = parseInt(req.params.userId, 10);
  const actingUser = req.user;

  if (actingUser.id !== targetUserId && !(actingUser.premiumStatus || actingUser.developerOverride)) { // Simplistic admin check
      return res.status(403).json({ message: "Forbidden: Only admins/devs can toggle override for others." });
  }

  const userToToggle = users.find(u => u.id === targetUserId);
  if (!userToToggle) {
    return res.status(404).json({ message: 'User to toggle not found' });
  }

  userToToggle.developerOverride = !userToToggle.developerOverride;
  console.log(`User ${userToToggle.username} developer override set to ${userToToggle.developerOverride}.`);
  res.json({ message: `User ${userToToggle.username} developer override is now ${userToToggle.developerOverride}. Please re-login to update JWT.`, user: {id: userToToggle.id, username: userToToggle.username, developerOverride: userToToggle.developerOverride }});
});


// Example protected route
app.get('/protected', authenticateToken, (req, res) => {
  // req.user is now the full user object
  res.json({ message: 'This is a protected route', user: { id: req.user.id, username: req.user.username, premium: req.user.premiumStatus, devOverride: req.user.developerOverride } });
});

// Message sending endpoint
app.post('/messages', authenticateToken, (req, res) => {
  try {
    const { recipientUsername, text } = req.body;
    // req.user.username is the sender's username from the JWT
    const senderUsername = req.user.username; 

    if (!recipientUsername || !text) {
      return res.status(400).json({ message: 'Recipient username and text are required' });
    }

    const recipientUser = users.find(user => user.username === recipientUsername);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

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

    if (!isSenderEffectivelyPremium) {
      senderUser.activityMetadata.messageCountToday += 1;
    }

    console.log('Messages:', messages); // For debugging
    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
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

// Inbox endpoint to fetch messages for the logged-in user
app.get('/messages/inbox', authenticateToken, (req, res) => {
  try {
    const loggedInUserId = req.user.userId; // This is actually the user ID from the previous implementation
    // req.user is the full loggedInUser object
    const loggedInUser = req.user; 
    const isUserEffectivelyPremium = loggedInUser.premiumStatus || loggedInUser.developerOverride;

    let allUserRelatedMessages = messages.filter(
      msg => msg.recipientId === loggedInUser.id || msg.senderId === loggedInUser.id
    );

    // Apply premium visibility rules and categorize messages
    let processedMessages = allUserRelatedMessages.map(msg => {
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
        if (originalMessageIndex !== -1) {
          messages[originalMessageIndex].read = true; 
        }
        displayMessage.read = true; // Reflect in the copy being sent
      }
      return displayMessage;
    });
    
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
    console.error('Inbox error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Event creation endpoint
app.post('/events', authenticateToken, (req, res) => {
  try {
    const { name, description, date, location } = req.body;
    const createdByUserId = req.user.userId; // userId from JWT payload
    const createdByUsername = req.user.username;

    if (!name || !description || !date || !location) {
      return res.status(400).json({ message: 'Name, description, date, and location are required for an event' });
    }

    const newEvent = {
      id: events.length + 1, // simple id generation
      name,
      description,
      date,
      location,
      createdByUserId,
      createdByUsername,
      rsvps: [] // To store userIds who RSVPed
    };
    events.push(newEvent);

    console.log('Events:', events); // For debugging
    res.status(201).json({ message: 'Event created successfully', data: newEvent });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
});

// RSVP to an event endpoint
app.post('/events/:eventId/rsvp', authenticateToken, (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const rsvpUserId = req.user.userId; // userId from JWT payload
    const rsvpUsername = req.user.username;

    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user has already RSVPed
    const existingRsvp = rsvps.find(rsvp => rsvp.eventId === eventId && rsvp.userId === rsvpUserId);
    if (existingRsvp) {
      return res.status(409).json({ message: 'Already RSVPed to this event' });
    }
    
    // Add user to event's RSVP list (optional, could just use the rsvps array)
    if (!event.rsvps.includes(rsvpUserId)) { // Storing user ID in event's rsvp list
        event.rsvps.push(rsvpUserId);
    }

    const newRsvp = {
      id: rsvps.length + 1,
      eventId,
      userId: rsvpUserId,
      username: rsvpUsername,
      timestamp: new Date().toISOString(),
    };
    rsvps.push(newRsvp);

    console.log('RSVPs:', rsvps); // For debugging
    res.status(201).json({ message: 'RSVP successful', data: newRsvp });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ message: 'Error RSVPing to event' });
  }
});

// Get all events endpoint
app.get('/events', (req, res) => {
  try {
    // Optionally, you could populate more user details for 'createdBy' if needed
    const allEvents = events.map(event => ({
      ...event,
      // createdBy: users.find(u => u.username === event.createdBy)?.username || event.createdBy // Example if you want to ensure username is there
    }));
    res.json(allEvents);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Get user's RSVPs endpoint
app.get('/my-rsvps', authenticateToken, (req, res) => {
  try {
    const rsvpUserId = req.user.userId;
    const userRsvps = rsvps.filter(rsvp => rsvp.userId === rsvpUserId);
    
    // Optionally, enrich RSVP data with event details
    const enrichedRsvps = userRsvps.map(rsvp => {
      const event = events.find(e => e.id === rsvp.eventId);
      return {
        ...rsvp,
        eventName: event ? event.name : 'Event not found', // Handle case where event might be deleted
        eventDate: event ? event.date : null,
      };
    });

    res.json(enrichedRsvps);
  } catch (error) {
    console.error('Get my RSVPs error:', error);
    res.status(500).json({ message: 'Error fetching your RSVPs' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
