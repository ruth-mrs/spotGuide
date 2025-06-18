const mongoose = require('mongoose');

const customPoiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['restaurante', 'ocio', 'cultura', 'naturaleza', 'compras', 'deporte', 'general']
  },
  image: {
    type: String,
    required: true
  },
  imageType: {
    type: String,
    enum: ['url', 'camera'],
    default: 'url'
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  totalFavorites: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice geoespacial para búsquedas por ubicación
customPoiSchema.index({ location: '2dsphere' });
customPoiSchema.index({ createdBy: 1 });
customPoiSchema.index({ isPublic: 1 });

module.exports = mongoose.model('CustomPoi', customPoiSchema);