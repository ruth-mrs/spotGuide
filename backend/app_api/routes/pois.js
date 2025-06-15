const express = require('express');
const { body } = require('express-validator');
const poisController = require('../controllers/pois');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validaciones
const createPoiValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
  
  body('category')
    .isIn([
      'restaurant', 'attraction', 'hotel', 'shopping', 
      'entertainment', 'transport', 'health', 'education',
      'nature', 'culture', 'sports', 'other'
    ])
    .withMessage('Categoría inválida'),
  
  body('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  
  body('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida')
];

// Rutas públicas
router.get('/', poisController.getPois);
router.get('/:id', poisController.getPoiById);

// Rutas protegidas
router.post('/', authMiddleware, createPoiValidation, poisController.createPoi);
router.get('/my/pois', authMiddleware, poisController.getMyPois);

module.exports = router;
