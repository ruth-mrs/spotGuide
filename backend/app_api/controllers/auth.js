const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Generar JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// Registro - COMPATIBLE CON EL FRONTEND
const register = async (req, res) => {
  try {
    const { username, name, email, password, description, avatar } = req.body;

    console.log('Register request:', { username, name, email, description, avatar: avatar ? 'present' : 'not present' });

    // Validaciones
    if (!username || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si ya existe
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'El email ya está registrado' 
          : 'El nombre de usuario ya está en uso'
      });
    }

    // Crear usuario
    const user = new User({
      username: username.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      description: description?.trim() || '',
      avatar: avatar || 'assets/avatars/default-avatar.png'
    });

    await user.save();
    console.log('Usuario creado:', user.username);

    // Generar token
    const token = generateToken(user._id);

    // Respuesta EXACTA que espera el frontend
    const userResponse = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      description: user.description,
      avatar: user.avatar,
      joinDate: user.joinDate
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Login - COMPATIBLE CON EL FRONTEND
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login request:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const user = await User.findOne({ 
      email: email.trim().toLowerCase(),
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    console.log('Login exitoso para:', user.username);

    // Generar token
    const token = generateToken(user._id);

    // Respuesta EXACTA que espera el frontend
    const userResponse = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      description: user.description,
      avatar: user.avatar,
      joinDate: user.joinDate
    };

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar token - COMPATIBLE CON EL FRONTEND
const verify = async (req, res) => {
  try {
    const userResponse = {
      id: req.user._id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      description: req.user.description,
      avatar: req.user.avatar,
      joinDate: req.user.joinDate
    };

    res.status(200).json({
      valid: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      valid: false,
      message: 'Error verificando token'
    });
  }
};

// Logout
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout exitoso'
  });
};

// Obtener perfil
const getProfile = async (req, res) => {
  try {
    const userResponse = {
      id: req.user._id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      description: req.user.description,
      avatar: req.user.avatar,
      joinDate: req.user.joinDate
    };

    res.status(200).json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo perfil'
    });
  }
};

// Actualizar perfil
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'description', 'avatar'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    const userResponse = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      description: user.description,
      avatar: user.avatar,
      joinDate: user.joinDate
    };

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando perfil'
    });
  }
};

module.exports = {
  register,
  login,
  verify,
  logout,
  getProfile,
  updateProfile
};