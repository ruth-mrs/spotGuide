const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const customPoisController = require('../controllers/customPois');

// Rutas públicas (con auth opcional para verificar favoritos)
router.get('/public', optionalAuth, customPoisController.getPublicPois);
router.get('/:id', optionalAuth, customPoisController.getPoiById);

// Rutas protegidas
router.post('/', auth, customPoisController.createPoi);
router.get('/my/pois', auth, customPoisController.getUserPois);
router.put('/:id', auth, customPoisController.updatePoi);
router.delete('/:id', auth, customPoisController.deletePoi);

module.exports = router;