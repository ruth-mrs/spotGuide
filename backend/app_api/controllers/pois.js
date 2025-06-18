const POI = require('../models/poi');
const User = require('../models/user');
const { validationResult } = require('express-validator');

// Obtener todos los POIs públicos con paginación y filtros
const getPois = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      lat,
      lng,
      radius = 10000, // 10km por defecto
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir query
    let query = { isPublic: true };

    // Filtro por categoría
    if (category && category !== 'all') {
      query.category = category;
    }

    // Búsqueda de texto
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Filtro geográfico
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusNum = parseInt(radius);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusNum
          }
        };
      }
    }

    // Configurar ordenamiento
    let sort = {};
    if (sortBy === 'distance' && lat && lng) {
      // El ordenamiento por distancia se maneja automáticamente con $near
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Ejecutar query con paginación
    const pois = await POI.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'username name avatar')
      .lean();

    // Contar total para paginación
    const total = await POI.countDocuments(query);

    // Formatear respuesta
    const formattedPois = pois.map(poi => ({
      id: poi._id,
      name: poi.name,
      description: poi.description,
      category: poi.category,
      location: {
        lat: poi.location.coordinates[1],
        lng: poi.location.coordinates[0]
      },
      address: poi.address,
      images: poi.images,
      rating: poi.rating,
      tags: poi.tags,
      createdBy: poi.createdBy,
      createdAt: poi.createdAt,
      stats: poi.stats
    }));

    res.json({
      success: true,
      data: formattedPois,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo POIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener POI por ID
const getPoiById = async (req, res) => {
  try {
    const { id } = req.params;

    const poi = await POI.findById(id)
      .populate('createdBy', 'username name avatar')
      .lean();

    if (!poi || !poi.isPublic) {
      return res.status(404).json({
        success: false,
        message: 'POI no encontrado'
      });
    }

    // Incrementar vistas (sin esperar)
    POI.findByIdAndUpdate(id, { $inc: { 'stats.views': 1 } }).exec();

    // Formatear respuesta
    const formattedPoi = {
      id: poi._id,
      name: poi.name,
      description: poi.description,
      category: poi.category,
      location: {
        lat: poi.location.coordinates[1],
        lng: poi.location.coordinates[0]
      },
      address: poi.address,
      contact: poi.contact,
      images: poi.images,
      rating: poi.rating,
      tags: poi.tags,
      schedule: poi.schedule,
      priceRange: poi.priceRange,
      createdBy: poi.createdBy,
      createdAt: poi.createdAt,
      updatedAt: poi.updatedAt,
      stats: poi.stats
    };

    res.json({
      success: true,
      data: formattedPoi
    });

  } catch (error) {
    console.error('Error obteniendo POI:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo POI
const createPoi = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      category,
      lat,
      lng,
      address,
      contact,
      images,
      tags,
      schedule,
      priceRange,
      isPublic = true
    } = req.body;

    // Crear POI
    const poi = new POI({
      name,
      description,
      category,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      address,
      contact,
      images: images || [],
      tags: tags || [],
      schedule,
      priceRange,
      isPublic,
      createdBy: req.userId
    });

    await poi.save();

    // Actualizar estadísticas del usuario
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.poisCreated': 1 }
    });

    // Populate para respuesta
    await poi.populate('createdBy', 'username name avatar');

    const formattedPoi = {
      id: poi._id,
      name: poi.name,
      description: poi.description,
      category: poi.category,
      location: {
        lat: poi.location.coordinates[1],
        lng: poi.location.coordinates[0]
      },
      address: poi.address,
      contact: poi.contact,
      images: poi.images,
      tags: poi.tags,
      schedule: poi.schedule,
      priceRange: poi.priceRange,
      createdBy: poi.createdBy,
      createdAt: poi.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'POI creado exitosamente',
      data: formattedPoi
    });

  } catch (error) {
    console.error('Error creando POI:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener POIs del usuario autenticado
const getMyPois = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = { createdBy: req.userId };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const pois = await POI.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await POI.countDocuments(query);

    const formattedPois = pois.map(poi => ({
      id: poi._id,
      name: poi.name,
      description: poi.description,
      category: poi.category,
      location: {
        lat: poi.location.coordinates[1],
        lng: poi.location.coordinates[0]
      },
      images: poi.images,
      isPublic: poi.isPublic,
      createdAt: poi.createdAt,
      stats: poi.stats
    }));

    res.json({
      success: true,
      data: formattedPois,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error obteniendo POIs del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getPois,
  getPoiById,
  createPoi,
  getMyPois
};