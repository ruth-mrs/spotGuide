const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  poiId: {
    type: String,  // Puede ser ID de Foursquare o custom POI
    required: true
  },
  poiName: {
    type: String,
    required: true
  },
  poiType: {
    type: String,
    enum: ['foursquare', 'custom'],
    required: true
  },
  poiData: {
    name: String,
    description: String,
    image: String,
    category: String,
    latitude: Number,
    longitude: Number,
    rating: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice único para evitar duplicados
favoriteSchema.index({ userId: 1, poiId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);