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

    // Verificar si el usuario es propietario del POI (solo para POIs personalizados)
    let isPoiOwner = false;
    if (req.user) {
      const firstComment = comments[0];
      if (firstComment && firstComment.poiType === 'custom') {
        const CustomPoi = require('../models/customPoi');
        const customPoi = await CustomPoi.findById(poiId);
        if (customPoi && customPoi.createdBy.toString() === req.user._id.toString()) {
          isPoiOwner = true;
        }
      }
    }

    const formattedComments = comments.map(comment => ({
      id: comment._id,
      poiId: comment.poiId,
      userId: comment.userId._id,
      userName: comment.userId.name,
      userAvatar: comment.userId.avatar || 'assets/avatars/default-avatar.png',
      rating: comment.rating,
      text: comment.text,
      date: comment.createdAt,
      isOwn: req.user && comment.userId._id.toString() === req.user._id.toString(),
      canDelete: req.user && (
        // Puede eliminar si es el creador del comentario
        comment.userId._id.toString() === req.user._id.toString() ||
        // O si es el propietario del POI personalizado
        (comment.poiType === 'custom' && isPoiOwner)
      )
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

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    console.log('Attempting to delete comment:', commentId, 'by user:', req.user.name);

    // Buscar el comentario
    const comment = await Comment.findById(commentId)
      .populate('userId', 'name avatar');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    // Verificar permisos
    let canDelete = false;
    let deleteReason = '';

    // 1. Si es el creador del comentario
    if (comment.userId._id.toString() === req.user._id.toString()) {
      canDelete = true;
      deleteReason = 'Creador del comentario';
    }
    
    // 2. Si es el propietario del POI personalizado
    if (!canDelete && comment.poiType === 'custom') {
      const CustomPoi = require('../models/customPoi');
      const customPoi = await CustomPoi.findById(comment.poiId);
      
      if (customPoi && customPoi.createdBy.toString() === req.user._id.toString()) {
        canDelete = true;
        deleteReason = 'Propietario del POI';
      }
    }

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este comentario'
      });
    }

    // Eliminar el comentario
    await Comment.findByIdAndDelete(commentId);

    console.log(`Comment deleted successfully by ${deleteReason}:`, commentId);

    res.status(200).json({
      success: true,
      message: 'Comentario eliminado exitosamente',
      deletedBy: deleteReason
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando comentario'
    });
  }
};

module.exports = {
  getCommentsByPoi,
  addComment,
  getUserComments,
  deleteComment
};