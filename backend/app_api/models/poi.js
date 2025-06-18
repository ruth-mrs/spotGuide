const mongoose = require('mongoose');

const poiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  externalId: {
    type: String, // ID de Foursquare si aplica
    unique: true,
    sparse: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  image: String,
  website: String,
  phone: String,
  address: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

poiSchema.index({ location: '2dsphere' });
poiSchema.index({ externalId: 1 });

module.exports = mongoose.model('Poi', poiSchema);