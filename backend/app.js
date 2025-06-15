const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();

// Conectar a la base de datos ANTES que nada
require('./app_api/models/db');

console.log('🚀 Iniciando SpotGuide Backend...');

const app = express();

// CORS configuration - MUY IMPORTANTE para el frontend
app.use(cors({
  origin: ['http://localhost:8100', 'http://localhost:4200', 'http://127.0.0.1:8100'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware básico
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Health check ANTES de las rutas API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SpotGuide API is running',
    timestamp: new Date().toISOString()
  });
});

// Rutas API
try {
  const authRoutes = require('./app_api/routes/auth');
  const commentsRoutes = require('./app_api/routes/comments');
  const favoritesRoutes = require('./app_api/routes/favorites');
  const customPoisRoutes = require('./app_api/routes/customPois');

  app.use('/api/auth', authRoutes);
  app.use('/api/comments', commentsRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/custom-pois', customPoisRoutes);

  console.log('✅ Rutas API cargadas correctamente');
} catch (error) {
  console.error('❌ Error cargando rutas API:', error);
}

// Ruta de información de la API
app.get('/api', (req, res) => {
  res.json({
    name: 'SpotGuide API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify',
        profile: 'GET /api/auth/profile'
      },
      comments: {
        getByPoi: 'GET /api/comments/poi/:poiId',
        add: 'POST /api/comments',
        getUserComments: 'GET /api/comments/my-comments'
      },
      favorites: {
        getUserFavorites: 'GET /api/favorites',
        toggle: 'POST /api/favorites/toggle',
        check: 'GET /api/favorites/check/:poiId'
      },
      customPois: {
        getPublic: 'GET /api/custom-pois/public',
        create: 'POST /api/custom-pois',
        getById: 'GET /api/custom-pois/:id'
      }
    }
  });
});

// Error handling
app.use((req, res, next) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: `Ruta no encontrada: ${req.method} ${req.url}` 
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌟 SpotGuide API funcionando en puerto ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api`);
});

module.exports = app;