const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  // Información básica
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Metadatos de la ruta
  difficulty: {
    type: String,
    enum: ['Fácil', 'Moderada', 'Difícil'],
    required: true
  },
  
  estimatedTime: {
    type: String,
    required: true
  },
  
  totalDistance: {
    type: String,
    required: true
  },
  
  // POIs ordenados
  orderedPois: [{
    poiId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    timeToSpend: {
      type: String,
      required: true
    },
    notes: {
      type: String
    },
    category: {
      type: String,
      required: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    image: {
      type: String
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  }],
  
  // Recomendaciones y consejos
  recommendations: [{
    type: String
  }],
  
  bestTimeToVisit: {
    type: String,
    required: true
  },
  
  transportRecommendations: {
    type: String,
    required: true
  },
  
  // Usuario que creó la ruta
  createdBy: {
    type: String, // Firebase UID
    required: true
  },
  
  // Configuración original
  originalRequest: {
    preferences: String,
    duration: String,
    baseLocation: String,
    poisCount: Number
  },
  
  // Metadatos
  isPublic: {
    type: Boolean,
    default: true
  },
  
  stats: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shared: {
      type: Number,
      default: 0
    }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
routeSchema.index({ createdBy: 1, createdAt: -1 });
routeSchema.index({ isPublic: 1, createdAt: -1 });
routeSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Route', routeSchema);