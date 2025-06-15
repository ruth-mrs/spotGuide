// filepath: c:\Users\ruthr\Documents\Git\spotGuide\backend\app_api\models\comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para optimizar consultas
commentSchema.index({ poiId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);