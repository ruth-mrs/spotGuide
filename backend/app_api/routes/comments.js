const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const commentsController = require('../controllers/comments');

// Rutas públicas
router.get('/poi/:poiId', optionalAuth, commentsController.getCommentsByPoi);

// Rutas protegidas
router.post('/', auth, commentsController.addComment);
router.get('/my-comments', auth, commentsController.getUserComments);

module.exports = router;