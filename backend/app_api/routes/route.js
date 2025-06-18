const express = require('express');
const { body } = require('express-validator');
const routesController = require('../controllers/route');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validaciones
const generateRouteValidation = [
  body('pois')
    .isArray({ min: 2 })
    .withMessage('Se requieren al menos 2 POIs'),
  
  body('pois.*.id')
    .notEmpty()
    .withMessage('ID del POI requerido'),
  
  body('pois.*.name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Nombre del POI requerido'),
  
  body('pois.*.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  
  body('pois.*.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida'),
  
  body('duration')
    .isIn(['medio día', '1 día', '2 días', 'fin de semana'])
    .withMessage('Duración inválida'),
  
  body('baseLocation')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Ubicación base requerida')
];

// Rutas
router.post('/', authMiddleware.auth, generateRouteValidation, routesController.generateRoute);
router.get('/my', authMiddleware.auth, routesController.getUserRoutes);
router.get('/public', routesController.getPublicRoutes);
router.get('/:id', authMiddleware.optionalAuth, routesController.getRouteById);
router.delete('/:id', authMiddleware.auth, routesController.deleteRoute);

module.exports = router;