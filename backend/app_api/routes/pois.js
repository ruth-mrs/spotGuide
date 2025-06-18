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

/**
 * @swagger
 * /pois:
 *   get:
 *     summary: Obtener POIs públicos con filtros y paginación
 *     description: Obtiene una lista paginada de POIs públicos con múltiples filtros disponibles incluyendo búsqueda por texto, categoría, proximidad geográfica y ordenamiento.
 *     tags: [POIs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para paginación
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de elementos por página
 *         example: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ['restaurant', 'attraction', 'hotel', 'shopping', 'entertainment', 'transport', 'health', 'education', 'nature', 'culture', 'sports', 'other', 'all']
 *         description: Filtrar por categoría (usar 'all' para todas)
 *         example: "restaurant"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda de texto en nombre y descripción
 *         example: "restaurante italiano"
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: double
 *         description: Latitud para búsqueda por proximidad
 *         example: 36.8381
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: double
 *         description: Longitud para búsqueda por proximidad
 *         example: -2.4597
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 10000
 *         description: Radio de búsqueda en metros (solo si se proporcionan coordenadas)
 *         example: 5000
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: ['createdAt', 'name', 'rating', 'distance']
 *           default: 'createdAt'
 *         description: Campo por el cual ordenar (distance solo funciona con coordenadas)
 *         example: "rating"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: ['asc', 'desc']
 *           default: 'desc'
 *         description: Orden de clasificación
 *         example: "desc"
 *     responses:
 *       200:
 *         description: Lista de POIs obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "64a7b8c9d1234567890abcde"
 *                       name:
 *                         type: string
 *                         example: "Restaurante La Bella Vista"
 *                       description:
 *                         type: string
 *                         example: "Auténtica cocina italiana con vistas al mar"
 *                       category:
 *                         type: string
 *                         enum: ['restaurant', 'attraction', 'hotel', 'shopping', 'entertainment', 'transport', 'health', 'education', 'nature', 'culture', 'sports', 'other']
 *                         example: "restaurant"
 *                       location:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             format: double
 *                             example: 36.8381
 *                           lng:
 *                             type: number
 *                             format: double
 *                             example: -2.4597
 *                       address:
 *                         type: string
 *                         example: "Calle Mayor 123, Almería"
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *                       rating:
 *                         type: number
 *                         format: float
 *                         minimum: 0
 *                         maximum: 5
 *                         example: 4.5
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["italiano", "vista al mar", "terraza"]
 *                       createdBy:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64a7b8c9d1234567890abcdc"
 *                           username:
 *                             type: string
 *                             example: "juanperez"
 *                           name:
 *                             type: string
 *                             example: "Juan Pérez"
 *                           avatar:
 *                             type: string
 *                             example: "assets/avatars/default-avatar.png"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       stats:
 *                         type: object
 *                         properties:
 *                           views:
 *                             type: integer
 *                             example: 125
 *                           likes:
 *                             type: integer
 *                             example: 23
 *                           comments:
 *                             type: integer
 *                             example: 8
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       description: Total de POIs disponibles
 *                       example: 156
 *                     pages:
 *                       type: integer
 *                       description: Número total de páginas
 *                       example: 8
 *                     hasNext:
 *                       type: boolean
 *                       description: Si hay página siguiente
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       description: Si hay página anterior
 *                       example: false
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error interno del servidor"
 */
router.get('/', poisController.getPois);

/**
 * @swagger
 * /pois/{id}:
 *   get:
 *     summary: Obtener POI por ID
 *     description: Obtiene un POI específico por su ID. Solo devuelve POIs públicos e incrementa automáticamente el contador de vistas.
 *     tags: [POIs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del POI
 *         example: "64a7b8c9d1234567890abcde"
 *     responses:
 *       200:
 *         description: POI encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     name:
 *                       type: string
 *                       example: "Restaurante La Bella Vista"
 *                     description:
 *                       type: string
 *                       example: "Auténtica cocina italiana con vistas al mar y ambiente acogedor"
 *                     category:
 *                       type: string
 *                       enum: ['restaurant', 'attraction', 'hotel', 'shopping', 'entertainment', 'transport', 'health', 'education', 'nature', 'culture', 'sports', 'other']
 *                       example: "restaurant"
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                           format: double
 *                           example: 36.8381
 *                         lng:
 *                           type: number
 *                           format: double
 *                           example: -2.4597
 *                     address:
 *                       type: string
 *                       example: "Calle Mayor 123, Almería"
 *                     contact:
 *                       type: object
 *                       properties:
 *                         phone:
 *                           type: string
 *                           example: "+34 950 123 456"
 *                         email:
 *                           type: string
 *                           example: "info@labellavista.com"
 *                         website:
 *                           type: string
 *                           example: "https://www.labellavista.com"
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *                     rating:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       maximum: 5
 *                       example: 4.5
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["italiano", "vista al mar", "terraza", "romántico"]
 *                     schedule:
 *                       type: object
 *                       properties:
 *                         monday:
 *                           type: string
 *                           example: "12:00-24:00"
 *                         tuesday:
 *                           type: string
 *                           example: "12:00-24:00"
 *                         wednesday:
 *                           type: string
 *                           example: "12:00-24:00"
 *                         thursday:
 *                           type: string
 *                           example: "12:00-24:00"
 *                         friday:
 *                           type: string
 *                           example: "12:00-02:00"
 *                         saturday:
 *                           type: string
 *                           example: "12:00-02:00"
 *                         sunday:
 *                           type: string
 *                           example: "12:00-24:00"
 *                     priceRange:
 *                       type: string
 *                       enum: ['$', '$$', '$$$', '$$$$']
 *                       example: "$$"
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "64a7b8c9d1234567890abcdc"
 *                         username:
 *                           type: string
 *                           example: "juanperez"
 *                         name:
 *                           type: string
 *                           example: "Juan Pérez"
 *                         avatar:
 *                           type: string
 *                           example: "assets/avatars/default-avatar.png"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T15:45:00Z"
 *                     stats:
 *                       type: object
 *                       properties:
 *                         views:
 *                           type: integer
 *                           example: 126
 *                         likes:
 *                           type: integer
 *                           example: 23
 *                         comments:
 *                           type: integer
 *                           example: 8
 *       404:
 *         description: POI no encontrado o no es público
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "POI no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error interno del servidor"
 */
router.get('/:id', poisController.getPoiById);

/**
 * @swagger
 * /pois:
 *   post:
 *     summary: Crear nuevo POI
 *     description: Crea un nuevo POI con validaciones estrictas. Requiere autenticación y actualiza automáticamente las estadísticas del usuario.
 *     tags: [POIs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - lat
 *               - lng
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 description: Nombre del POI
 *                 example: "Restaurante La Bella Vista"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Descripción detallada del POI
 *                 example: "Auténtica cocina italiana con vistas al mar y ambiente acogedor. Especialidades en pasta fresca y pizzas al horno de leña."
 *               category:
 *                 type: string
 *                 enum: ['restaurant', 'attraction', 'hotel', 'shopping', 'entertainment', 'transport', 'health', 'education', 'nature', 'culture', 'sports', 'other']
 *                 description: Categoría del POI
 *                 example: "restaurant"
 *               lat:
 *                 type: number
 *                 format: double
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitud del POI
 *                 example: 36.8381
 *               lng:
 *                 type: number
 *                 format: double
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitud del POI
 *                 example: -2.4597
 *               address:
 *                 type: string
 *                 description: Dirección del POI
 *                 example: "Calle Mayor 123, Almería"
 *               contact:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                     example: "+34 950 123 456"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "info@labellavista.com"
 *                   website:
 *                     type: string
 *                     format: uri
 *                     example: "https://www.labellavista.com"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: URLs de imágenes del POI
 *                 example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Etiquetas descriptivas
 *                 example: ["italiano", "vista al mar", "terraza", "romántico"]
 *               schedule:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     type: string
 *                     example: "12:00-24:00"
 *                   tuesday:
 *                     type: string
 *                     example: "12:00-24:00"
 *                   wednesday:
 *                     type: string
 *                     example: "12:00-24:00"
 *                   thursday:
 *                     type: string
 *                     example: "12:00-24:00"
 *                   friday:
 *                     type: string
 *                     example: "12:00-02:00"
 *                   saturday:
 *                     type: string
 *                     example: "12:00-02:00"
 *                   sunday:
 *                     type: string
 *                     example: "12:00-24:00"
 *               priceRange:
 *                 type: string
 *                 enum: ['$', '$$', '$$$', '$$$$']
 *                 description: Rango de precios
 *                 example: "$$"
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 description: Si el POI es público
 *                 example: true
 *     responses:
 *       201:
 *         description: POI creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "POI creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     name:
 *                       type: string
 *                       example: "Restaurante La Bella Vista"
 *                     description:
 *                       type: string
 *                       example: "Auténtica cocina italiana con vistas al mar"
 *                     category:
 *                       type: string
 *                       example: "restaurant"
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                           example: 36.8381
 *                         lng:
 *                           type: number
 *                           example: -2.4597
 *                     address:
 *                       type: string
 *                       example: "Calle Mayor 123, Almería"
 *                     contact:
 *                       type: object
 *                       properties:
 *                         phone:
 *                           type: string
 *                           example: "+34 950 123 456"
 *                         email:
 *                           type: string
 *                           example: "info@labellavista.com"
 *                         website:
 *                           type: string
 *                           example: "https://www.labellavista.com"
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["https://example.com/image1.jpg"]
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["italiano", "vista al mar"]
 *                     schedule:
 *                       type: object
 *                     priceRange:
 *                       type: string
 *                       example: "$$"
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "64a7b8c9d1234567890abcdc"
 *                         username:
 *                           type: string
 *                           example: "juanperez"
 *                         name:
 *                           type: string
 *                           example: "Juan Pérez"
 *                         avatar:
 *                           type: string
 *                           example: "assets/avatars/default-avatar.png"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Datos inválidos"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "field"
 *                       value:
 *                         type: string
 *                         example: "a"
 *                       msg:
 *                         type: string
 *                         example: "El nombre debe tener entre 2 y 200 caracteres"
 *                       path:
 *                         type: string
 *                         example: "name"
 *                       location:
 *                         type: string
 *                         example: "body"
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Acceso denegado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error interno del servidor"
 */
router.post('/', authMiddleware, createPoiValidation, poisController.createPoi);

/**
 * @swagger
 * /pois/my/pois:
 *   get:
 *     summary: Obtener POIs del usuario autenticado
 *     description: Obtiene todos los POIs creados por el usuario autenticado con paginación y filtros. Incluye POIs tanto públicos como privados.
 *     tags: [POIs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para paginación
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de elementos por página
 *         example: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ['restaurant', 'attraction', 'hotel', 'shopping', 'entertainment', 'transport', 'health', 'education', 'nature', 'culture', 'sports', 'other', 'all']
 *         description: Filtrar por categoría (usar 'all' para todas)
 *         example: "restaurant"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda de texto en nombre y descripción
 *         example: "mi restaurante"
 *     responses:
 *       200:
 *         description: Lista de POIs del usuario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "64a7b8c9d1234567890abcde"
 *                       name:
 *                         type: string
 *                         example: "Mi Restaurante Favorito"
 *                       description:
 *                         type: string
 *                         example: "Lugar acogedor para cenas familiares"
 *                       category:
 *                         type: string
 *                         example: "restaurant"
 *                       location:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             example: 36.8381
 *                           lng:
 *                             type: number
 *                             example: -2.4597
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["https://example.com/image1.jpg"]
 *                       isPublic:
 *                         type: boolean
 *                         description: Si el POI es público o privado
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       stats:
 *                         type: object
 *                         properties:
 *                           views:
 *                             type: integer
 *                             example: 45
 *                           likes:
 *                             type: integer
 *                             example: 12
 *                           comments:
 *                             type: integer
 *                             example: 3
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       description: Total de POIs del usuario
 *                       example: 8
 *                     pages:
 *                       type: integer
 *                       description: Número total de páginas
 *                       example: 1
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Acceso denegado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error interno del servidor"
 */
router.get('/my/pois', authMiddleware, poisController.getMyPois);

module.exports = router;