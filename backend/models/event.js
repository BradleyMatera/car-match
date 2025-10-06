const mongoose = require('mongoose');

const ScheduleItemSchema = new mongoose.Schema({ time: String, activity: String }, { _id: false });
const CommentSchema = new mongoose.Schema({
  id: Number,
  user: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  timestamp: String,
}, { _id: false });

const EventSchema = new mongoose.Schema({
  id: Number,
  title: String,
  name: String, // some mock items use name
  date: String, // keep as string (YYYY-MM-DD)
  location: String,
  description: String,
  organizerId: String,
  organizerUsername: String,
  rsvpCount: Number,
  tags: [String],
  image: String,
  thumbnail: String,
  schedule: [ScheduleItemSchema],
  testimonials: [{}],
  comments: [CommentSchema],
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdByUsername: { type: String, required: true },
  rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // user ids (string/number)
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread' },
}, { timestamps: true });

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
