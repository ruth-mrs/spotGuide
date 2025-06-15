const Comment = require('../models/comment');
const User = require('../models/user');

// Obtener comentarios de un POI
const getCommentsByPoi = async (req, res) => {
  try {
    const { poiId } = req.params;
    
    console.log('Getting comments for POI:', poiId);
    
    const comments = await Comment.find({ poiId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedComments = comments.map(comment => ({
      id: comment._id,
      poiId: comment.poiId,
      userId: comment.userId._id,
      userName: comment.userId.name,
      userAvatar: comment.userId.avatar || 'assets/avatars/default-avatar.png',
      rating: comment.rating,
      text: comment.text,
      date: comment.createdAt,
      isOwn: req.user && comment.userId._id.toString() === req.user._id.toString()
    }));

    console.log(`Found ${formattedComments.length} comments for POI ${poiId}`);

    res.status(200).json({
      success: true,
      comments: formattedComments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comentarios'
    });
  }
};

// Añadir comentario
const addComment = async (req, res) => {
  try {
    const { poiId, poiName, poiType, rating, text } = req.body;

    console.log('Adding comment:', { poiId, poiName, poiType, rating, textLength: text?.length });

    if (!poiId || !poiName || !poiType || !rating || !text) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'El rating debe estar entre 1 y 5'
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'El comentario no puede exceder 500 caracteres'
      });
    }

    const comment = new Comment({
      userId: req.user._id,
      poiId,
      poiName,
      poiType,
      rating,
      text: text.trim()
    });

    await comment.save();

    // Poblar información del usuario para la respuesta
    await comment.populate('userId', 'name avatar');

    const formattedComment = {
      id: comment._id,
      poiId: comment.poiId,
      userId: comment.userId._id,
      userName: comment.userId.name,
      userAvatar: comment.userId.avatar || 'assets/avatars/default-avatar.png',
      rating: comment.rating,
      text: comment.text,
      date: comment.createdAt,
      isOwn: true
    };

    console.log('Comment added successfully for POI:', poiId);

    res.status(201).json({
      success: true,
      message: 'Comentario añadido exitosamente',
      comment: formattedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error añadiendo comentario'
    });
  }
};

// Obtener comentarios del usuario
const getUserComments = async (req, res) => {
  try {
    const comments = await Comment.find({ userId: req.user._id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    const formattedComments = comments.map(comment => ({
      id: comment._id,
      poiId: comment.poiId,
      poiName: comment.poiName,
      poiType: comment.poiType,
      rating: comment.rating,
      text: comment.text,
      date: comment.createdAt
    }));

    res.status(200).json({
      success: true,
      comments: formattedComments
    });
  } catch (error) {
    console.error('Error getting user comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comentarios del usuario'
    });
  }
};

module.exports = {
  getCommentsByPoi,
  addComment,
  getUserComments
};