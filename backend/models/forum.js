const mongoose = require('mongoose');

const ForumThreadSchema = new mongoose.Schema({
  categoryId: { type: String, required: true },
  title: { type: String, required: true },
  // Accept numeric in-memory ids and Mongo _id strings
  authorId: { type: mongoose.Schema.Types.Mixed },
  authorUsername: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastPostAt: { type: Date, default: Date.now },
  replies: { type: Number, default: 0 },
  pinned: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
});

const ForumPostSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true },
  authorId: { type: mongoose.Schema.Types.Mixed },
  authorUsername: { type: String },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ForumThread = mongoose.models.ForumThread || mongoose.model('ForumThread', ForumThreadSchema);
const ForumPost = mongoose.models.ForumPost || mongoose.model('ForumPost', ForumPostSchema);

module.exports = { ForumThread, ForumPost };
