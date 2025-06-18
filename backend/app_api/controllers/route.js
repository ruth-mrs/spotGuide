const Route = require('../models/route');
const RouteAIService = require('../../services/route-generator');
const { validationResult } = require('express-validator');

// Generar nueva ruta con IA
const generateRoute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { pois, preferences, duration, baseLocation } = req.body;

    console.log(`🗺️ Generando ruta para usuario ${userId} con ${pois.length} POIs`);

    // Generar ruta con IA
    const aiResult = await RouteAIService.generateRoute({
      pois,
      preferences,
      duration,
      baseLocation
    });

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        message: aiResult.error || 'Error generando la ruta con IA'
      });
    }

    // Crear registro en base de datos
    const route = new Route({
      ...aiResult.route,
      createdBy: userId,
      originalRequest: {
        preferences,
        duration,
        baseLocation,
        poisCount: pois.length
      }
    });

    await route.save();

    console.log(`✅ Ruta "${route.name}" guardada con ID: ${route._id}`);

    res.status(201).json({
      success: true,
      message: 'Ruta generada exitosamente',
      route: route
    });

  } catch (error) {
    console.error('Error generando ruta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener rutas del usuario
const getUserRoutes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const routes = await Route.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Route.countDocuments({ createdBy: userId });

    res.json({
      success: true,
      data: routes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error obteniendo rutas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ruta por ID
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const route = await Route.findById(id).lean();

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
      });
    }

    // Verificar permisos
    if (!route.isPublic && route.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta ruta'
      });
    }

    // Incrementar vistas
    await Route.findByIdAndUpdate(id, { $inc: { 'stats.views': 1 } });

    res.json({
      success: true,
      data: route
    });

  } catch (error) {
    console.error('Error obteniendo ruta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar ruta
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const route = await Route.findOne({ _id: id, createdBy: userId });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada o no tienes permisos para eliminarla'
      });
    }

    await Route.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Ruta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando ruta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener rutas públicas
const getPublicRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = { isPublic: true };
    
    if (search) {
      query.$text = { $search: search };
    }

    const routes = await Route.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Route.countDocuments(query);

    res.json({
      success: true,
      data: routes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error obteniendo rutas públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  generateRoute,
  getUserRoutes,
  getRouteById,
  deleteRoute,
  getPublicRoutes
};