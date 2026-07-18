const mongoose = require('mongoose');

// Business Directory + Marketplace features:
// - BusinessModel: automotive business listings (repair shops, parts stores, etc.)
// - ReviewModel: reviews/ratings left on businesses
// - MarketplaceModel: classified listings (parts, vehicles, tools, services)

const BusinessSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  ownerUsername: { type: String },
  businessName: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['repair-shop', 'parts-store', 'performance-shop', 'fabrication', 'roadside-service', 'detailing', 'towing', 'general-automotive', 'other'],
  },
  description: { type: String },
  services: { type: [String], default: [] },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  geoCoordinates: { lat: Number, lon: Number },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  hours: { type: String },
  logo: { type: String },
  photos: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
  verified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ReviewSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  reviewerId: { type: String },
  reviewerUsername: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const MarketplaceSchema = new mongoose.Schema({
  sellerId: { type: String, required: true },
  sellerUsername: { type: String },
  sellerType: { type: String, enum: ['individual', 'business'], default: 'individual' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['parts', 'vehicles', 'tools', 'services', 'other'],
  },
  price: { type: Number },
  condition: { type: String, enum: ['new', 'used', 'refurbished', 'for-parts'] },
  location: { city: String, state: String },
  photos: { type: [String], default: [] },
  contactPhone: { type: String },
  contactEmail: { type: String },
  status: { type: String, enum: ['active', 'sold', 'removed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BusinessModel = mongoose.models.Business || mongoose.model('Business', BusinessSchema);
const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const MarketplaceModel = mongoose.models.Marketplace || mongoose.model('Marketplace', MarketplaceSchema);

module.exports = { BusinessModel, ReviewModel, MarketplaceModel };
