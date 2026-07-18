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

const ForumCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
});

const ForumReportSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.Mixed, required: true },
  reportedBy: { type: mongoose.Schema.Types.Mixed, required: true },
  reportedByUsername: { type: String },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
});

const ForumThread = mongoose.models.ForumThread || mongoose.model('ForumThread', ForumThreadSchema);
const ForumPost = mongoose.models.ForumPost || mongoose.model('ForumPost', ForumPostSchema);
const ForumCategory = mongoose.models.ForumCategory || mongoose.model('ForumCategory', ForumCategorySchema);
const ForumReport = mongoose.models.ForumReport || mongoose.model('ForumReport', ForumReportSchema);

module.exports = { ForumThread, ForumPost, ForumCategory, ForumReport };
