const mongoose = require('mongoose');

const discoveredEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  dateText: String,          // raw date text from SerpAPI (e.g. "Tomorrow, 11:00 am – 5:00 pm")
  dateStart: Date,           // parsed start date if possible
  location: {
    name: String,
    address: [String],
    city: String,
    state: String,
  },
  link: String,
  thumbnail: String,
  description: String,
  searchQuery: String,       // which keyword found this event
  source: { type: String, default: 'google_events' },
  createdAt: { type: Date, default: Date.now },
});

const DiscoveredEventModel = mongoose.models.DiscoveredEvent || mongoose.model('DiscoveredEvent', discoveredEventSchema);

module.exports = { DiscoveredEventModel };
