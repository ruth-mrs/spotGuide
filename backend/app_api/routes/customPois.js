const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const customPoisController = require('../controllers/customPois');

/**
 * @swagger
 * /custom-pois/public:
 *   get:
 *     summary: Obtener POIs personalizados públicos
 *     description: Obtiene una lista paginada de POIs personalizados públicos. Incluye búsqueda por proximidad geográfica y verifica favoritos si el usuario está autenticado.
 *     tags: [POIs Personalizados]
 *     security:
 *       - bearerAuth: []
 *       - {}
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
 *         name: lat
 *         schema:
 *           type: number
 *           format: double
 *         description: Latitud para búsqueda por proximidad (opcional)
 *         example: 36.8381
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: double
 *         description: Longitud para búsqueda por proximidad (opcional)
 *         example: -2.4597
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 10000
 *         description: Radio de búsqueda en metros (solo si se proporcionan coordenadas)
 *         example: 5000
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
 *                 pois:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "64a7b8c9d1234567890abcde"
 *                       name:
 *                         type: string
 *                         example: "Mi restaurante favorito"
 *                       description:
 *                         type: string
 *                         example: "Un lugar acogedor con comida mediterránea excelente"
 *                       category:
 *                         type: string
 *                         enum: ['restaurante', 'ocio', 'cultura', 'naturaleza', 'compras', 'deporte', 'general']
 *                         example: "restaurante"
 *                       image:
 *                         type: string
 *                         example: "https://example.com/image.jpg"
 *                       imageType:
 *                         type: string
 *                         enum: ['url', 'camera']
 *                         example: "url"
 *                       latitude:
 *                         type: number
 *                         format: double
 *                         example: 36.8381
 *                       longitude:
 *                         type: number
 *                         format: double
 *                         example: -2.4597
 *                       rating:
 *                         type: number
 *                         format: float
 *                         example: 4.2
 *                       reviewCount:
 *                         type: integer
 *                         example: 15
 *                       distance:
 *                         type: string
 *                         example: "0 km"
 *                       estimatedTime:
 *                         type: string
 *                         example: "0 min"
 *                       isFavorite:
 *                         type: boolean
 *                         description: Si es favorito del usuario actual (solo si está autenticado)
 *                         example: false
 *                       userId:
 *                         type: string
 *                         description: ID del usuario creador
 *                         example: "64a7b8c9d1234567890abcdc"
 *                       userName:
 *                         type: string
 *                         description: Nombre del usuario creador
 *                         example: "Juan Pérez"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       isCustom:
 *                         type: boolean
 *                         example: true
 *                       isPublic:
 *                         type: boolean
 *                         example: true
 *                       totalFavorites:
 *                         type: integer
 *                         example: 8
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
 *                       example: 45
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
 *                   example: "Error obteniendo POIs públicos"
 */
router.get('/public', optionalAuth, customPoisController.getPublicPois);

/**
 * @swagger
 * /custom-pois/{id}:
 *   get:
 *     summary: Obtener POI personalizado por ID
 *     description: Obtiene un POI personalizado específico por su ID. Solo devuelve POIs públicos (isPublic = true) y verifica si el usuario puede editarlo.
 *     tags: [POIs Personalizados]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del POI personalizado
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
 *                 poi:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     name:
 *                       type: string
 *                       example: "Mi restaurante favorito"
 *                     description:
 *                       type: string
 *                       example: "Un lugar acogedor con comida mediterránea excelente"
 *                     category:
 *                       type: string
 *                       enum: ['restaurante', 'ocio', 'cultura', 'naturaleza', 'compras', 'deporte', 'general']
 *                       example: "restaurante"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *                     imageType:
 *                       type: string
 *                       enum: ['url', 'camera']
 *                       example: "url"
 *                     latitude:
 *                       type: number
 *                       format: double
 *                       example: 36.8381
 *                     longitude:
 *                       type: number
 *                       format: double
 *                       example: -2.4597
 *                     rating:
 *                       type: number
 *                       format: float
 *                       example: 4.2
 *                     reviewCount:
 *                       type: integer
 *                       example: 15
 *                     distance:
 *                       type: string
 *                       example: "0 km"
 *                     estimatedTime:
 *                       type: string
 *                       example: "0 min"
 *                     isFavorite:
 *                       type: boolean
 *                       description: Si es favorito del usuario actual (solo si está autenticado)
 *                       example: false
 *                     userId:
 *                       type: string
 *                       description: ID del usuario creador
 *                       example: "64a7b8c9d1234567890abcdc"
 *                     userName:
 *                       type: string
 *                       description: Nombre del usuario creador
 *                       example: "Juan Pérez"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     isCustom:
 *                       type: boolean
 *                       example: true
 *                     isPublic:
 *                       type: boolean
 *                       example: true
 *                     totalFavorites:
 *                       type: integer
 *                       example: 8
 *                     canEdit:
 *                       type: boolean
 *                       description: Si el usuario actual puede editar este POI (solo el creador)
 *                       example: false
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
 *                   example: "Error obteniendo POI"
 */
router.get('/:id', optionalAuth, customPoisController.getPoiById);

/**
 * @swagger
 * /custom-pois:
 *   post:
 *     summary: Crear POI personalizado
 *     description: Crea un nuevo POI personalizado. Se valida la longitud del nombre (≤100) y descripción (≤500). El POI se marca como público por defecto y se asigna al usuario autenticado.
 *     tags: [POIs Personalizados]
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
 *               - image
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nombre del POI (se recorta automáticamente)
 *                 example: "Mi restaurante favorito"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción del POI (se recorta automáticamente)
 *                 example: "Un lugar acogedor con comida mediterránea excelente y precios razonables"
 *               category:
 *                 type: string
 *                 enum: ['restaurante', 'ocio', 'cultura', 'naturaleza', 'compras', 'deporte', 'general']
 *                 description: Categoría del POI
 *                 example: "restaurante"
 *               image:
 *                 type: string
 *                 description: URL de la imagen o imagen en base64
 *                 example: "https://example.com/image.jpg"
 *               imageType:
 *                 type: string
 *                 enum: ['url', 'camera']
 *                 default: 'url'
 *                 description: Tipo de imagen
 *                 example: "url"
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Latitud del POI
 *                 example: 36.8381
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Longitud del POI
 *                 example: -2.4597
 *               createdFromLocation:
 *                 type: object
 *                 description: Información adicional de ubicación (opcional)
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
 *                 poi:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     name:
 *                       type: string
 *                       example: "Mi restaurante favorito"
 *                     description:
 *                       type: string
 *                       example: "Un lugar acogedor con comida mediterránea excelente"
 *                     category:
 *                       type: string
 *                       example: "restaurante"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *                     imageType:
 *                       type: string
 *                       example: "url"
 *                     latitude:
 *                       type: number
 *                       example: 36.8381
 *                     longitude:
 *                       type: number
 *                       example: -2.4597
 *                     rating:
 *                       type: number
 *                       example: 0
 *                     reviewCount:
 *                       type: integer
 *                       example: 0
 *                     distance:
 *                       type: string
 *                       example: "0 km"
 *                     estimatedTime:
 *                       type: string
 *                       example: "0 min"
 *                     isFavorite:
 *                       type: boolean
 *                       example: false
 *                     userId:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcdc"
 *                     userName:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     isCustom:
 *                       type: boolean
 *                       example: true
 *                     isPublic:
 *                       type: boolean
 *                       example: true
 *                     totalFavorites:
 *                       type: integer
 *                       example: 0
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
 *               examples:
 *                 missing_fields:
 *                   value:
 *                     success: false
 *                     message: "Todos los campos son requeridos"
 *                 name_too_long:
 *                   value:
 *                     success: false
 *                     message: "El nombre no puede exceder 100 caracteres"
 *                 description_too_long:
 *                   value:
 *                     success: false
 *                     message: "La descripción no puede exceder 500 caracteres"
 *                 invalid_category:
 *                   value:
 *                     success: false
 *                     message: "Categoría no válida"
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
 *                   example: "Error creando POI"
 */
router.post('/', auth, customPoisController.createPoi);

/**
 * @swagger
 * /custom-pois/my/pois:
 *   get:
 *     summary: Obtener POIs del usuario
 *     description: Obtiene todos los POIs personalizados creados por el usuario autenticado, ordenados por fecha de creación (más recientes primero)
 *     tags: [POIs Personalizados]
 *     security:
 *       - bearerAuth: []
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
 *                 pois:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "64a7b8c9d1234567890abcde"
 *                       name:
 *                         type: string
 *                         example: "Mi restaurante favorito"
 *                       description:
 *                         type: string
 *                         example: "Un lugar acogedor con comida mediterránea excelente"
 *                       category:
 *                         type: string
 *                         example: "restaurante"
 *                       image:
 *                         type: string
 *                         example: "https://example.com/image.jpg"
 *                       imageType:
 *                         type: string
 *                         example: "url"
 *                       latitude:
 *                         type: number
 *                         example: 36.8381
 *                       longitude:
 *                         type: number
 *                         example: -2.4597
 *                       rating:
 *                         type: number
 *                         example: 4.2
 *                       reviewCount:
 *                         type: integer
 *                         example: 15
 *                       distance:
 *                         type: string
 *                         example: "0 km"
 *                       estimatedTime:
 *                         type: string
 *                         example: "0 min"
 *                       isFavorite:
 *                         type: boolean
 *                         description: Siempre false ya que no puedes tener tu propio POI como favorito
 *                         example: false
 *                       userId:
 *                         type: string
 *                         description: ID del usuario (el mismo que está autenticado)
 *                         example: "64a7b8c9d1234567890abcdc"
 *                       userName:
 *                         type: string
 *                         description: Nombre del usuario autenticado
 *                         example: "Juan Pérez"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       isCustom:
 *                         type: boolean
 *                         example: true
 *                       isPublic:
 *                         type: boolean
 *                         example: true
 *                       totalFavorites:
 *                         type: integer
 *                         example: 8
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
 *                   example: "Error obteniendo POIs del usuario"
 */
router.get('/my/pois', auth, customPoisController.getUserPois);

/**
 * @swagger
 * /custom-pois/{id}:
 *   put:
 *     summary: Actualizar POI personalizado
 *     description: Actualiza un POI personalizado existente. Solo el creador del POI puede actualizarlo. Se pueden actualizar name, description, category, image, imageType y coordenadas.
 *     tags: [POIs Personalizados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del POI a actualizar
 *         example: "64a7b8c9d1234567890abcde"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nuevo nombre del POI
 *                 example: "Mi restaurante favorito actualizado"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Nueva descripción del POI
 *                 example: "Descripción actualizada con más detalles"
 *               category:
 *                 type: string
 *                 enum: ['restaurante', 'ocio', 'cultura', 'naturaleza', 'compras', 'deporte', 'general']
 *                 description: Nueva categoría del POI
 *                 example: "ocio"
 *               image:
 *                 type: string
 *                 description: Nueva imagen del POI
 *                 example: "https://example.com/new-image.jpg"
 *               imageType:
 *                 type: string
 *                 enum: ['url', 'camera']
 *                 description: Nuevo tipo de imagen
 *                 example: "url"
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Nueva latitud (actualiza la ubicación)
 *                 example: 36.8400
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Nueva longitud (actualiza la ubicación)
 *                 example: -2.4600
 *     responses:
 *       200:
 *         description: POI actualizado exitosamente
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
 *                   example: "POI actualizado exitosamente"
 *                 poi:
 *                   type: object
 *                   description: POI actualizado con populate de createdBy
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     name:
 *                       type: string
 *                       example: "Mi restaurante favorito actualizado"
 *                     description:
 *                       type: string
 *                       example: "Descripción actualizada con más detalles"
 *                     category:
 *                       type: string
 *                       example: "ocio"
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "64a7b8c9d1234567890abcdc"
 *                         name:
 *                           type: string
 *                           example: "Juan Pérez"
 *                         avatar:
 *                           type: string
 *                           example: "assets/avatars/default-avatar.png"
 *       403:
 *         description: Sin permisos para actualizar
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
 *                   example: "No tienes permisos para actualizar este POI"
 *       404:
 *         description: POI no encontrado
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
 *       401:
 *         description: No autorizado
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
 *                   example: "Error actualizando POI"
 *   delete:
 *     summary: Eliminar POI personalizado
 *     description: Elimina un POI personalizado y todos sus comentarios y favoritos asociados. Solo el creador del POI puede eliminarlo.
 *     tags: [POIs Personalizados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del POI a eliminar
 *         example: "64a7b8c9d1234567890abcde"
 *     responses:
 *       200:
 *         description: POI eliminado exitosamente
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
 *                   example: "POI eliminado exitosamente"
 *       403:
 *         description: Sin permisos para eliminar
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
 *                   example: "No tienes permisos para eliminar este POI"
 *       404:
 *         description: POI no encontrado
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
 *       401:
 *         description: No autorizado
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
 *                   example: "Error eliminando POI"
 */
router.put('/:id', auth, customPoisController.updatePoi);
router.delete('/:id', auth, customPoisController.deletePoi);

module.exports = router;