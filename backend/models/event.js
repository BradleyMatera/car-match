const mongoose = require('mongoose');

const ScheduleItemSchema = new mongoose.Schema({ time: String, activity: String }, { _id: false });
const CommentSchema = new mongoose.Schema({ id: Number, user: String, text: String, timestamp: String }, { _id: false });

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
  createdByUserId: Number,
  createdByUsername: String,
  rsvps: [mongoose.Schema.Types.Mixed], // user ids (string/number)
}, { timestamps: true });

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
