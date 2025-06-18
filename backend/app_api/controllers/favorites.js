const Favorite = require('../models/favorite');
const CustomPoi = require('../models/customPoi');

// Obtener favoritos del usuario
const getUserFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    const formattedFavorites = favorites.map(fav => ({
      id: fav.poiId,
      name: fav.poiData.name,
      description: fav.poiData.description,
      image: fav.poiData.image,
      category: fav.poiData.category,
      latitude: fav.poiData.latitude,
      longitude: fav.poiData.longitude,
      rating: fav.poiData.rating || 0,
      reviewCount: 0,
      distance: '0 km',
      estimatedTime: '0 min',
      isFavorite: true,
      poiType: fav.poiType,
      savedAt: fav.createdAt
    }));

    console.log(`Found ${formattedFavorites.length} favorites for user ${req.user.name}`);

    res.status(200).json({
      success: true,
      favorites: formattedFavorites
    });
  } catch (error) {
    console.error('Error getting user favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo favoritos'
    });
  }
};

// Toggle favorito
const toggleFavorite = async (req, res) => {
  try {
    const { poiId, poiData } = req.body;

    console.log('Toggle favorite for POI:', poiId, 'by user:', req.user.name);

    if (!poiId || !poiData) {
      return res.status(400).json({
        success: false,
        message: 'Datos del POI requeridos'
      });
    }

    // Verificar si ya está en favoritos
    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,
      poiId: poiId
    });

    if (existingFavorite) {
      // Remover de favoritos
      await Favorite.deleteOne({ _id: existingFavorite._id });

      // Si es POI personalizado, actualizar contador
      if (poiData.poiType === 'custom') {
        await CustomPoi.findByIdAndUpdate(poiId, {
          $inc: { totalFavorites: -1 }
        });
      }

      console.log('Removed from favorites:', poiId);

      res.status(200).json({
        success: true,
        message: 'Eliminado de favoritos',
        isFavorite: false
      });
    } else {
      // Añadir a favoritos
      const favorite = new Favorite({
        userId: req.user._id,
        poiId: poiId,
        poiName: poiData.name,
        poiType: poiData.poiType || 'foursquare',
        poiData: {
          name: poiData.name,
          description: poiData.description,
          image: poiData.image,
          category: poiData.category,
          latitude: poiData.latitude,
          longitude: poiData.longitude,
          rating: poiData.rating
        }
      });

      await favorite.save();

      // Si es POI personalizado, actualizar contador
      if (poiData.poiType === 'custom') {
        await CustomPoi.findByIdAndUpdate(poiId, {
          $inc: { totalFavorites: 1 }
        });
      }

      console.log('Added to favorites:', poiId);

      res.status(201).json({
        success: true,
        message: 'Añadido a favoritos',
        isFavorite: true
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando favorito'
    });
  }
};

// Verificar si un POI está en favoritos
const checkFavorite = async (req, res) => {
  try {
    const { poiId } = req.params;

    const favorite = await Favorite.findOne({
      userId: req.user._id,
      poiId: poiId
    });

    res.status(200).json({
      success: true,
      isFavorite: !!favorite
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando favorito'
    });
  }
};

module.exports = {
  getUserFavorites,
  toggleFavorite,
  checkFavorite
};