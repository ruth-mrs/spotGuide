const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const favoritesController = require('../controllers/favorites');

// Todas las rutas requieren autenticación
router.get('/', auth, favoritesController.getUserFavorites);
router.post('/toggle', auth, favoritesController.toggleFavorite);
router.get('/check/:poiId', auth, favoritesController.checkFavorite);

module.exports = router;