const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const favoritesController = require('../controllers/favorites');

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Obtener favoritos del usuario
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de favoritos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 favorites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Favorite'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', auth, favoritesController.getUserFavorites);

/**
 * @swagger
 * /favorites/toggle:
 *   post:
 *     summary: Alternar estado de favorito
 *     tags: [Favoritos]
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
 *               - poiData
 *             properties:
 *               poiId:
 *                 type: string
 *                 description: ID del POI
 *               poiData:
 *                 $ref: '#/components/schemas/POI'
 *     responses:
 *       200:
 *         description: Estado de favorito actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isFavorite:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: No autorizado
 */
router.post('/toggle', auth, favoritesController.toggleFavorite);

/**
 * @swagger
 * /favorites/check/{poiId}:
 *   get:
 *     summary: Verificar si un POI es favorito
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: poiId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del POI a verificar
 *     responses:
 *       200:
 *         description: Estado de favorito verificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *       401:
 *         description: No autorizado
 */
router.get('/check/:poiId', auth, favoritesController.checkFavorite);

module.exports = router;