const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  city: String,
  state: String,
  geoCoordinates: { lat: Number, lon: Number },
}, { _id: false });

const ActivitySchema = new mongoose.Schema({
  messageCountToday: { type: Number, default: 0 },
  lastMessageDate: { type: String, default: null },
}, { _id: false });

const CarSchema = new mongoose.Schema({
  id: Number,
  name: String,
  make: String,
  model: String,
  year: Number,
  description: String,
  photos: [String],
}, { _id: false });

const UserSchema = new mongoose.Schema({
  mockId: String, // e.g., 'user1' from mock data
  username: { type: String, index: true, unique: true },
  email: { type: String },
  password: String, // bcrypt hash (default for seeded users)
  name: String,
  displayTag: String,
  gender: String,
  location: LocationSchema,
  premiumStatus: { type: Boolean, default: false },
  developerOverride: { type: Boolean, default: false },
  activityMetadata: ActivitySchema,
  biography: String,
  profileImage: String,
  carInterests: [String],
  cars: [CarSchema],
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

// Enforce email uniqueness only when email exists
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
