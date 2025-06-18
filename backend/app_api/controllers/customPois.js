const CustomPoi = require('../models/customPoi');
const Favorite = require('../models/favorite');
const POI = require('../models/poi'); 
const Comment = require('../models/comment');

// Obtener todos los POIs públicos
const getPublicPois = async (req, res) => {
  try {
    const { page = 1, limit = 20, lat, lng, radius = 10000 } = req.query;
    
    // ✅ QUERY PARA CUSTOM POIS
    let customQuery = { isPublic: true };
    if (lat && lng) {
      customQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    // ✅ QUERY PARA POIS DE FOURSQUARE EN BD
    let foursquareQuery = {};
    if (lat && lng) {
      foursquareQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    // ✅ OBTENER AMBOS TIPOS DE POIS EN PARALELO
    const [customPois, foursquarePois] = await Promise.all([
      CustomPoi.find(customQuery)
        .populate('createdBy', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(Math.ceil(limit / 2))
        .skip(Math.ceil((page - 1) * limit / 2)),
      
      POI.find(foursquareQuery)
        .sort({ createdAt: -1 })
        .limit(Math.ceil(limit / 2))
        .skip(Math.ceil((page - 1) * limit / 2))
    ]);

    console.log(`📍 Encontrados ${customPois.length} Custom POIs + ${foursquarePois.length} Foursquare POIs`);

    // ✅ FORMATEAR CUSTOM POIS
    const formattedCustomPois = await Promise.all(customPois.map(async (poi) => {
      let isFavorite = false;
      if (req.user) {
        const favorite = await Favorite.findOne({
          userId: req.user._id,
          poiId: poi._id.toString()
        });
        isFavorite = !!favorite;
      }

      return {
        id: poi._id,
        name: poi.name,
        description: poi.description,
        category: poi.category,
        image: poi.image,
        imageType: poi.imageType,
        latitude: poi.location.coordinates[1],
        longitude: poi.location.coordinates[0],
        rating: poi.rating,
        reviewCount: poi.reviewCount,
        distance: '0 km',
        estimatedTime: '0 min',
        isFavorite,
        userId: poi.createdBy._id,
        userName: poi.createdBy.name,
        createdAt: poi.createdAt,
        isCustom: true,
        isPublic: poi.isPublic,
        source: 'user', // ✅ IDENTIFICAR COMO POI DE USUARIO
        totalFavorites: poi.totalFavorites
      };
    }));

    // ✅ FORMATEAR FOURSQUARE POIS
    const formattedFoursquarePois = await Promise.all(foursquarePois.map(async (poi) => {
      let isFavorite = false;
      if (req.user) {
        const favorite = await Favorite.findOne({
          userId: req.user._id,
          poiId: poi._id.toString()
        });
        isFavorite = !!favorite;
      }

      return {
        id: poi._id,
        name: poi.name,
        description: poi.description,
        category: poi.category,
        image: poi.image || '',
        imageType: 'url',
        latitude: poi.location.coordinates[1],
        longitude: poi.location.coordinates[0],
        rating: poi.rating || 0,
        reviewCount: poi.reviewCount || 0,
        distance: '0 km',
        estimatedTime: '0 min',
        isFavorite,
        userId: null, // ✅ POIs de Foursquare no tienen usuario específico
        userName: 'Foursquare',
        createdAt: poi.createdAt,
        isCustom: true, // ✅ TRATARLOS COMO CUSTOM PARA EL FRONTEND
        isPublic: true,
        source: 'foursquare', // ✅ IDENTIFICAR COMO POI DE FOURSQUARE
        totalFavorites: 0,
        // ✅ CAMPOS ADICIONALES DE FOURSQUARE
        externalId: poi.externalId,
        address: poi.address,
        website: poi.website,
        phone: poi.phone
      };
    }));

    // ✅ COMBINAR Y MEZCLAR RESULTADOS
    const allPois = [...formattedCustomPois, ...formattedFoursquarePois];
    
    // ✅ ORDENAR POR FECHA DE CREACIÓN (MÁS RECIENTES PRIMERO)
    allPois.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ✅ APLICAR LÍMITE FINAL
    const finalPois = allPois.slice(0, parseInt(limit));

    console.log(`🎯 Enviando ${finalPois.length} POIs totales (${formattedCustomPois.length} custom + ${formattedFoursquarePois.length} foursquare)`);

    res.status(200).json({
      success: true,
      pois: finalPois,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allPois.length,
        customTotal: formattedCustomPois.length,
        foursquareTotal: formattedFoursquarePois.length
      }
    });
  } catch (error) {
    console.error('Error getting public POIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo POIs públicos',
      details: error.message
    });
  }
};

// Obtener POI por ID
const getPoiById = async (req, res) => {
  try {
    const { id } = req.params;

    const poi = await CustomPoi.findById(id)
      .populate('createdBy', 'name avatar');

    if (!poi || !poi.isPublic) {
      return res.status(404).json({
        success: false,
        message: 'POI no encontrado'
      });
    }

    // Verificar si está en favoritos
    let isFavorite = false;
    if (req.user) {
      const favorite = await Favorite.findOne({
        userId: req.user._id,
        poiId: poi._id.toString()
      });
      isFavorite = !!favorite;
    }

    const formattedPoi = {
      id: poi._id,
      name: poi.name,
      description: poi.description,
      category: poi.category,
      image: poi.image,
      imageType: poi.imageType,
      latitude: poi.location.coordinates[1],
      longitude: poi.location.coordinates[0],
      rating: poi.rating,
      reviewCount: poi.reviewCount,
      distance: '0 km',
      estimatedTime: '0 min',
      isFavorite,
      userId: poi.createdBy._id,
      userName: poi.createdBy.name,
      createdAt: poi.createdAt,
      isCustom: true,
      isPublic: poi.isPublic,
      totalFavorites: poi.totalFavorites,
      canEdit: req.user && poi.createdBy._id.toString() === req.user._id.toString()
    };

    res.status(200).json({
      success: true,
      poi: formattedPoi
    });
  } catch (error) {
    console.error('Error getting POI by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo POI'
    });
  }
};

// Crear POI personalizado
const createPoi = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      image,
      imageType,
      latitude,
      longitude,
      createdFromLocation
    } = req.body;

    console.log('Creating POI:', { name, category, latitude, longitude });

    // Validaciones
    if (!name || !description || !category || !image || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre no puede exceder 100 caracteres'
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'La descripción no puede exceder 500 caracteres'
      });
    }

    const validCategories = ['restaurante', 'ocio', 'cultura', 'naturaleza', 'compras', 'deporte', 'general'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida'
      });
    }

    const poi = new CustomPoi({
      name: name.trim(),
      description: description.trim(),
      category,
      image,
      imageType: imageType || 'url',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      createdBy: req.user._id
    });

    await poi.save();
    await poi.populate('createdBy', 'name avatar');

    const formattedPoi = {
      id: poi._id,
      name: poi.name,
      description: poi.description,
      category: poi.category,
      image: poi.image,
      imageType: poi.imageType,
      latitude: poi.location.coordinates[1],
      longitude: poi.location.coordinates[0],
      rating: poi.rating,
      reviewCount: poi.reviewCount,
      distance: '0 km',
      estimatedTime: '0 min',
      isFavorite: false,
      userId: poi.createdBy._id,
      userName: poi.createdBy.name,
      createdAt: poi.createdAt,
      isCustom: true,
      isPublic: poi.isPublic,
      totalFavorites: poi.totalFavorites
    };

    console.log('POI created successfully:', poi.name);

    res.status(201).json({
      success: true,
      message: 'POI creado exitosamente',
      poi: formattedPoi
    });
  } catch (error) {
    console.error('Error creating POI:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando POI'
    });
  }
};

// Obtener POIs del usuario
const getUserPois = async (req, res) => {
  try {
    const pois = await CustomPoi.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    const formattedPois = pois.map(poi => ({
      id: poi._id,
      name: poi.name,
      description: poi.description,
      category: poi.category,
      image: poi.image,
      imageType: poi.imageType,
      latitude: poi.location.coordinates[1],
      longitude: poi.location.coordinates[0],
      rating: poi.rating,
      reviewCount: poi.reviewCount,
      distance: '0 km',
      estimatedTime: '0 min',
      isFavorite: false,
      userId: req.user._id,
      userName: req.user.name,
      createdAt: poi.createdAt,
      isCustom: true,
      isPublic: poi.isPublic,
      totalFavorites: poi.totalFavorites
    }));

    res.status(200).json({
      success: true,
      pois: formattedPois
    });
  } catch (error) {
    console.error('Error getting user POIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo POIs del usuario'
    });
  }
};

// Actualizar POI
const updatePoi = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const poi = await CustomPoi.findById(id);

    if (!poi) {
      return res.status(404).json({
        success: false,
        message: 'POI no encontrado'
      });
    }

    // Solo el creador puede actualizar
    if (poi.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este POI'
      });
    }

    // Actualizar campos permitidos
    const allowedUpdates = ['name', 'description', 'category', 'image', 'imageType'];
    const updateData = {};

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Si se actualiza ubicación
    if (updates.latitude && updates.longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(updates.longitude), parseFloat(updates.latitude)]
      };
    }

    const updatedPoi = await CustomPoi.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'POI actualizado exitosamente',
      poi: updatedPoi
    });
  } catch (error) {
    console.error('Error updating POI:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando POI'
    });
  }
};

// Eliminar POI
const deletePoi = async (req, res) => {
  try {
    const { id } = req.params;

    const poi = await CustomPoi.findById(id);

    if (!poi) {
      return res.status(404).json({
        success: false,
        message: 'POI no encontrado'
      });
    }

    // Solo el creador puede eliminar
    if (poi.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este POI'
      });
    }

    // Eliminar POI
    await CustomPoi.findByIdAndDelete(id);

    // Eliminar comentarios y favoritos relacionados
    await Comment.deleteMany({ poiId: id });
    await Favorite.deleteMany({ poiId: id });

    res.status(200).json({
      success: true,
      message: 'POI eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting POI:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando POI'
    });
  }
};

module.exports = {
  getPublicPois,
  getPoiById,
  createPoi,
  getUserPois,
  updatePoi,
  deletePoi
};