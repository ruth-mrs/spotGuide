const express = require('express');
const POI = require('../models/poi');

const router = express.Router();

// Búsqueda general
router.get('/', async (req, res) => {
  try {
    const {
      q = '',
      category,
      lat,
      lng,
      radius = 10000,
      limit = 20
    } = req.query;

    let query = { isPublic: true };

    // Búsqueda de texto
    if (q.trim()) {
      query.$text = { $search: q.trim() };
    }

    // Filtro por categoría
    if (category && category !== 'all') {
      query.category = category;
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

    const pois = await POI.find(query)
      .limit(parseInt(limit))
      .populate('createdBy', 'username name avatar')
      .lean();

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
      rating: poi.rating,
      createdBy: poi.createdBy
    }));

    res.json({
      success: true,
      data: formattedPois,
      total: formattedPois.length
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
