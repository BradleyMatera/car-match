#!/usr/bin/env node
/* eslint-disable no-console */
require('dotenv').config({ path: __dirname + '/../.env' });
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { extractFromSource } = require('../seed/mockData-loader');
const User = require('../models/user');
const Event = require('../models/event');
const Message = require('../models/message');
const { ForumThread, ForumPost } = require('../models/forum');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected to MongoDB');

  // Load the historical mock file from git history
  const rev = process.env.MOCK_REV || '595315c^';
  const src = execSync(`git show ${rev}:frontend/src/api/mockApi.js`, { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
  const { mockUsers = [], mockProfiles = [], mockEvents = [], mockMessages = [], mockForumCategories = [], mockForumThreads = [], mockForumPosts = [] } = extractFromSource(src);
  console.log(`Parsed mock arrays: users=${mockUsers.length}, profiles=${mockProfiles.length}, events=${mockEvents.length}, messages=${mockMessages.length}, threads=${mockForumThreads.length}`);

  // Seed Users (merge mockUsers + mockProfiles details)
  const profileMap = new Map(mockProfiles.map(p => [p.id, p]));
  const idMap = new Map(); // mockId -> db _id
  for (const mu of mockUsers) {
    const prof = profileMap.get(mu.id);
    const password = await bcrypt.hash('password123', 10);
    const doc = {
      mockId: mu.id,
      username: mu.username,
      email: mu.email || `${mu.username}@example.com`,
      password,
      name: mu.name,
      displayTag: mu.displayTag,
      gender: mu.gender,
      location: mu.location,
      premiumStatus: !!mu.premiumStatus,
      developerOverride: !!mu.developerOverride,
      activityMetadata: mu.activityMetadata || { messageCountToday: 0, lastMessageDate: null },
      biography: prof?.bio || '',
      carInterests: prof?.carInterests || [],
      cars: prof?.cars || [],
    };
    const res = await User.findOneAndUpdate({ username: doc.username }, { $set: doc }, { upsert: true, new: true });
    idMap.set(mu.id, res._id.toString());
  }
  console.log('Users seeded');

  // Seed Events
  let idCounter = 1;
  for (const e of mockEvents) {
    const mappedOwnerId = idMap.get(e.createdByUserId) || idMap.get(e.organizerId) || null;
    const base = {
      id: e.id || idCounter++,
      title: e.title || e.name,
      name: e.name || e.title,
      date: e.date,
      location: e.location,
      description: e.description,
      organizerId: mappedOwnerId || e.organizerId,
      organizerUsername: e.organizerUsername,
      rsvpCount: e.rsvpCount || 0,
      tags: e.tags || [],
      image: e.image,
      thumbnail: e.thumbnail,
      schedule: e.schedule || [],
      testimonials: e.testimonials || [],
      comments: (e.comments || []).map((comment) => ({
        ...comment,
        userId: idMap.get(comment.userId) || idMap.get(comment.userId?.id) || idMap.get(comment.user) || comment.userId || null,
      })),
      createdByUserId: mappedOwnerId,
      createdByUsername: e.createdByUsername || e.organizerUsername,
      rsvps: (e.rsvps || []).map((rid) => idMap.get(rid) || rid),
    };
    if (!base.createdByUserId && idMap.size > 0) {
      base.createdByUserId = [...idMap.values()][0];
      base.createdByUsername = base.createdByUsername || mockUsers.find(u => u.id === [...idMap.keys()][0])?.username || 'demo';
    }
    await Event.updateOne({ id: base.id }, { $set: base }, { upsert: true });
  }
  console.log('Events seeded');

  // Seed Messages
  for (const m of mockMessages) {
    const base = {
      senderId: idMap.get(m.senderId) || m.senderId,
      senderUsername: m.senderUsername,
      senderEffectivePremiumStatus: !!m.senderEffectivePremiumStatus,
      recipientId: idMap.get(m.recipientId) || m.recipientId,
      recipientUsername: m.recipientUsername,
      recipientEffectivePremiumStatus: !!m.recipientEffectivePremiumStatus,
      text: m.text,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      read: !!m.read,
      category: m.category || 'Inbox',
      systemMessage: !!m.systemMessage,
    };
    await Message.updateOne({ senderId: base.senderId, recipientId: base.recipientId, text: base.text, timestamp: base.timestamp }, { $setOnInsert: base }, { upsert: true });
  }
  console.log('Messages seeded');

  // Seed Forums (threads/posts) into the existing Mongoose models with mapping
  if (mockForumThreads.length) {
    const catMap = new Map(mockForumCategories.map(c => [c.id, c]));
    for (const th of mockForumThreads) {
      const title = th.title || 'Thread';
      const authorUsername = th.author || th.authorUsername || 'car_lover';
      const doc = await ForumThread.findOneAndUpdate(
        { title, categoryId: th.categoryId },
        { $setOnInsert: { title, categoryId: th.categoryId, authorUsername, createdAt: new Date(), lastPostAt: new Date(), replies: th.replies || 0 } },
        { upsert: true, new: true }
      );
      const posts = mockForumPosts.filter(p => p.threadId === th.id);
      for (const p of posts) {
        await ForumPost.findOneAndUpdate(
          { threadId: doc._id, body: p.body, authorUsername: p.author },
          { $setOnInsert: { threadId: doc._id, body: p.body, authorUsername: p.author, createdAt: p.createdAt ? new Date(p.createdAt) : new Date() } },
          { upsert: true }
        );
      }
    }
    console.log('Forums seeded');
  }

  await mongoose.disconnect();
  console.log('Seeding complete');
}

main().catch(err => { console.error(err); process.exit(1); });
