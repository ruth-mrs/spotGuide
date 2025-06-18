const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const routeGenerator = require('./services/route-generator');
const { seedFoursquarePois, seedSamplePois } = require('./scripts/seeder');


// Conectar a la base de datos ANTES que nada
require('./app_api/models/db');

console.log('🚀 Iniciando SpotGuide Backend...');

const app = express();

// CORS configuration - MUY IMPORTANTE para el frontend
app.use(cors({
  origin: ['http://localhost:8100', 'http://localhost:4200', 'http://127.0.0.1:8100', 'https://ruth-mrs.github.io/spotGuide'],
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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SpotGuide API Documentation'
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rutas API
try {
  const authRoutes = require('./app_api/routes/auth');
  const commentsRoutes = require('./app_api/routes/comments');
  const favoritesRoutes = require('./app_api/routes/favorites');
  const customPoisRoutes = require('./app_api/routes/customPois');
  const routeGeneratorRoutes = require('./app_api/routes/route');

  app.use('/api/auth', authRoutes);
  app.use('/api/comments', commentsRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/custom-pois', customPoisRoutes);
  
  if (process.env.GROQ_API_KEY && process.env.NODE_ENV !== 'test') {
    const routeGeneratorRoutes = require('./app_api/routes/route');
    app.use('/api/routes', routeGeneratorRoutes);
    console.log('✅ Rutas con IA habilitadas');
  } else {
    console.log('⚠️ Rutas con IA deshabilitadas (GROQ_API_KEY no disponible)');
  }

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

app.post('/generate-route', async (req, res) => {
  try {
    console.log('🗺️ Generando nueva ruta...');
    
    const { pois, preferences, duration, baseLocation } = req.body;

    // Validaciones básicas
    if (!pois || !Array.isArray(pois) || pois.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un POI para generar una ruta'
      });
    }

    if (pois.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren al menos 2 POIs para generar una ruta'
      });
    }

    console.log(`📍 Generando ruta con ${pois.length} POIs`);
    console.log('🎯 Preferencias:', preferences || 'ninguna especificada');
    console.log('⏰ Duración:', duration || '1 día');

    // Generar la ruta usando IA
    const result = await routeGenerator.generateRoute({
      pois,
      baseLocation: baseLocation || 'Almería, España',
      preferences: preferences || 'turismo general',
      duration: duration || '1 día'
    });

    console.log('✅ Ruta generada exitosamente:', result.route.name);

    // Agregar datos completos de POIs a la respuesta
    const enrichedRoute = {
      ...result.route,
      orderedPois: result.route.orderedPois.map(orderedPoi => {
        const originalPoi = pois.find(p => p.id === orderedPoi.poiId || p.name === orderedPoi.name);
        return {
          ...orderedPoi,
          ...originalPoi, // Mantener todos los datos originales del POI
          order: orderedPoi.order,
          reason: orderedPoi.reason,
          timeToSpend: orderedPoi.timeToSpend,
          notes: orderedPoi.notes
        };
      })
    };

    res.json({
      success: true,
      message: 'Ruta generada exitosamente',
      route: enrichedRoute,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalPois: pois.length,
        aiModel: 'gemma2-9b-it'
      }
    });

  } catch (error) {
    console.error('❌ Error generando ruta:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno generando la ruta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para validar POIs antes de generar ruta
app.post('/validate-pois', (req, res) => {
  try {
    const { pois } = req.body;

    if (!pois || !Array.isArray(pois)) {
      return res.status(400).json({
        success: false,
        message: 'Lista de POIs inválida'
      });
    }

    const validPois = pois.filter(poi => 
      poi.name && 
      poi.id &&
      (poi.latitude || poi.lat) &&
      (poi.longitude || poi.lng)
    );

    const invalidPois = pois.length - validPois.length;

    res.json({
      success: true,
      valid: validPois.length >= 2,
      validPois: validPois.length,
      invalidPois,
      message: validPois.length >= 2 
        ? `${validPois.length} POIs válidos para generar ruta`
        : `Se necesitan al menos 2 POIs válidos (tienes ${validPois.length})`
    });

  } catch (error) {
    console.error('❌ Error validando POIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando POIs'
    });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.post('/api/admin/seed-sample', async (req, res) => {
    try {
      console.log('🧪 Iniciando seed de muestra...');
      const result = await seedSamplePois();
      res.json({
        success: true,
        message: 'Seed de muestra completado',
        stats: result
      });
    } catch (error) {
      console.error('❌ Error en seed de muestra:', error);
      res.status(500).json({
        success: false,
        message: 'Error en seed de muestra',
        error: error.message
      });
    }
  });

  app.post('/api/admin/seed-full', async (req, res) => {
    try {
      console.log('🚀 Iniciando seed completo...');
      const result = await seedFoursquarePois();
      res.json({
        success: true,
        message: 'Seed completo terminado',
        stats: result
      });
    } catch (error) {
      console.error('❌ Error en seed completo:', error);
      res.status(500).json({
        success: false,
        message: 'Error en seed completo',
        error: error.message
      });
    }
  });
}

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