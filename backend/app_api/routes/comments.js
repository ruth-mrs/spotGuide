const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const commentsController = require('../controllers/comments');

// Actualizar la documentación del GET /comments/poi/{poiId} para incluir canDelete:

/**
 * @swagger
 * /comments/poi/{poiId}:
 *   get:
 *     summary: Obtener comentarios de un POI
 *     description: Obtiene hasta 50 comentarios de un POI específico, ordenados por fecha (más recientes primero). La autenticación es opcional para marcar comentarios propios y permisos de eliminación.
 *     tags: [Comentarios]
 *     parameters:
 *       - in: path
 *         name: poiId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del POI del cual obtener comentarios
 *         example: "64a7b8c9d1234567890abcde"
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: Lista de comentarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: ID único del comentario
 *                         example: "64a7b8c9d1234567890abcdf"
 *                       poiId:
 *                         type: string
 *                         description: ID del POI comentado
 *                         example: "64a7b8c9d1234567890abcde"
 *                       userId:
 *                         type: string
 *                         description: ID del usuario que comentó
 *                         example: "64a7b8c9d1234567890abcdc"
 *                       userName:
 *                         type: string
 *                         description: Nombre del usuario que comentó
 *                         example: "Juan Pérez"
 *                       userAvatar:
 *                         type: string
 *                         description: Avatar del usuario (por defecto usa avatar predeterminado)
 *                         example: "assets/avatars/default-avatar.png"
 *                       rating:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 5
 *                         description: Valoración dada (1-5 estrellas)
 *                         example: 4
 *                       text:
 *                         type: string
 *                         description: Texto del comentario
 *                         example: "Lugar increíble, muy recomendado para visitar con familia"
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha de creación del comentario
 *                         example: "2024-01-15T10:30:00Z"
 *                       isOwn:
 *                         type: boolean
 *                         description: Si el comentario pertenece al usuario autenticado (solo si hay token)
 *                         example: false
 *                       canDelete:
 *                         type: boolean
 *                         description: Si el usuario actual puede eliminar este comentario (creador del comentario o propietario del POI personalizado)
 *                         example: true
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
 *                   example: "Error obteniendo comentarios"
 */
router.get('/poi/:poiId', optionalAuth, commentsController.getCommentsByPoi);

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Añadir comentario a un POI
 *     description: Crea un nuevo comentario para un POI específico. El texto se recorta automáticamente y se valida la longitud.
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - poiId
 *               - poiName
 *               - poiType
 *               - rating
 *               - text
 *             properties:
 *               poiId:
 *                 type: string
 *                 description: ID del POI a comentar
 *                 example: "64a7b8c9d1234567890abcde"
 *               poiName:
 *                 type: string
 *                 description: Nombre del POI (para referencia)
 *                 example: "Alcazaba de Almería"
 *               poiType:
 *                 type: string
 *                 enum: ['foursquare', 'custom']
 *                 description: Tipo de POI
 *                 example: "foursquare"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valoración del POI (1-5 estrellas)
 *                 example: 5
 *               text:
 *                 type: string
 *                 maxLength: 500
 *                 minLength: 1
 *                 description: Texto del comentario (máximo 500 caracteres, se recorta automáticamente)
 *                 example: "Lugar increíble con una vista espectacular de la ciudad. La arquitectura árabe está muy bien conservada y la visita guiada es muy informativa. Totalmente recomendado."
 *     responses:
 *       201:
 *         description: Comentario añadido exitosamente
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
 *                   example: "Comentario añadido exitosamente"
 *                 comment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcdf"
 *                     poiId:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     userId:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcdc"
 *                     userName:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     userAvatar:
 *                       type: string
 *                       example: "assets/avatars/default-avatar.png"
 *                     rating:
 *                       type: integer
 *                       example: 5
 *                     text:
 *                       type: string
 *                       example: "Lugar increíble con una vista espectacular de la ciudad."
 *                     date:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     isOwn:
 *                       type: boolean
 *                       example: true
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
 *                 invalid_rating:
 *                   value:
 *                     success: false
 *                     message: "El rating debe estar entre 1 y 5"
 *                 text_too_long:
 *                   value:
 *                     success: false
 *                     message: "El comentario no puede exceder 500 caracteres"
 *       401:
 *         description: No autorizado (token requerido)
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
 *                   example: "Error añadiendo comentario"
 */
router.post('/', auth, commentsController.addComment);

/**
 * @swagger
 * /comments/my-comments:
 *   get:
 *     summary: Obtener comentarios del usuario
 *     description: Obtiene hasta 100 comentarios realizados por el usuario autenticado, ordenados por fecha (más recientes primero)
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comentarios del usuario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: ID único del comentario
 *                         example: "64a7b8c9d1234567890abcdf"
 *                       poiId:
 *                         type: string
 *                         description: ID del POI comentado
 *                         example: "64a7b8c9d1234567890abcde"
 *                       poiName:
 *                         type: string
 *                         description: Nombre del POI comentado
 *                         example: "Alcazaba de Almería"
 *                       poiType:
 *                         type: string
 *                         enum: ['foursquare', 'custom']
 *                         description: Tipo del POI comentado
 *                         example: "foursquare"
 *                       rating:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 5
 *                         description: Valoración dada
 *                         example: 5
 *                       text:
 *                         type: string
 *                         description: Texto del comentario
 *                         example: "Lugar increíble con una vista espectacular de la ciudad."
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha del comentario
 *                         example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: No autorizado (token requerido)
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
 *                   example: "Error obteniendo comentarios del usuario"
 */
router.get('/my-comments', auth, commentsController.getUserComments);

/**
 * @swagger
 * /comments/{commentId}:
 *   delete:
 *     summary: Eliminar comentario
 *     description: Elimina un comentario. Solo puede hacerlo el creador del comentario o el propietario del POI personalizado.
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario a eliminar
 *         example: "64a7b8c9d1234567890abcdf"
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
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
 *                   example: "Comentario eliminado exitosamente"
 *                 deletedBy:
 *                   type: string
 *                   enum: ['Creador del comentario', 'Propietario del POI']
 *                   description: Razón por la cual se pudo eliminar
 *                   example: "Creador del comentario"
 *       401:
 *         description: No autorizado (token requerido)
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
 *                   example: "No tienes permisos para eliminar este comentario"
 *       404:
 *         description: Comentario no encontrado
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
 *                   example: "Comentario no encontrado"
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
 *                   example: "Error eliminando comentario"
 */
router.delete('/:commentId', auth, commentsController.deleteComment);

module.exports = router;