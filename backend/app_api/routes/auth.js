const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authController = require('../controllers/auth');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     description: Crea una nueva cuenta de usuario en el sistema SpotGuide
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - name
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 1
 *                 description: Nombre de usuario único
 *                 example: "usuario123"
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Nombre completo del usuario
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Dirección de email válida
 *                 example: "juan@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña (mínimo 6 caracteres)
 *                 example: "password123"
 *               description:
 *                 type: string
 *                 description: Descripción opcional del perfil
 *                 example: "Amante de los viajes y la fotografía"
 *               avatar:
 *                 type: string
 *                 description: URL del avatar (opcional, por defecto usa avatar predeterminado)
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
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
 *                   example: "Usuario registrado exitosamente"
 *                 token:
 *                   type: string
 *                   description: Token JWT válido por 7 días
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     username:
 *                       type: string
 *                       example: "usuario123"
 *                     name:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     email:
 *                       type: string
 *                       example: "juan@example.com"
 *                     description:
 *                       type: string
 *                       example: "Amante de los viajes y la fotografía"
 *                     avatar:
 *                       type: string
 *                       example: "assets/avatars/default-avatar.png"
 *                     joinDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Error de validación o usuario ya existe
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
 *                     message: "Todos los campos obligatorios son requeridos"
 *                 short_password:
 *                   value:
 *                     success: false
 *                     message: "La contraseña debe tener al menos 6 caracteres"
 *                 email_exists:
 *                   value:
 *                     success: false
 *                     message: "El email ya está registrado"
 *                 username_exists:
 *                   value:
 *                     success: false
 *                     message: "El nombre de usuario ya está en uso"
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
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y devuelve un token JWT válido por 7 días
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario (se convierte a minúsculas automáticamente)
 *                 example: "juan@example.com"
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
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
 *                   example: "Login exitoso"
 *                 token:
 *                   type: string
 *                   description: Token JWT válido por 7 días
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     username:
 *                       type: string
 *                       example: "usuario123"
 *                     name:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     email:
 *                       type: string
 *                       example: "juan@example.com"
 *                     description:
 *                       type: string
 *                       example: "Amante de los viajes y la fotografía"
 *                     avatar:
 *                       type: string
 *                       example: "assets/avatars/default-avatar.png"
 *                     joinDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Datos faltantes
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
 *                   example: "Email y contraseña son requeridos"
 *       401:
 *         description: Credenciales inválidas
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
 *                   example: "Credenciales inválidas"
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
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verificar token de autenticación
 *     description: Verifica si el token JWT proporcionado es válido y devuelve los datos del usuario
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     username:
 *                       type: string
 *                       example: "usuario123"
 *                     name:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     email:
 *                       type: string
 *                       example: "juan@example.com"
 *                     description:
 *                       type: string
 *                       example: "Amante de los viajes y la fotografía"
 *                     avatar:
 *                       type: string
 *                       example: "assets/avatars/default-avatar.png"
 *                     joinDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Token inválido, expirado o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token inválido"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error verificando token"
 */
router.get('/verify', auth, authController.verify);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Invalida la sesión del usuario (el token debe ser eliminado del lado del cliente)
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
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
 *                   example: "Logout exitoso"
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
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
 */
router.post('/logout', auth, authController.logout);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario
 *     description: Obtiene los datos completos del perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     username:
 *                       type: string
 *                       example: "usuario123"
 *                     name:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     email:
 *                       type: string
 *                       example: "juan@example.com"
 *                     description:
 *                       type: string
 *                       example: "Amante de los viajes y la fotografía"
 *                     avatar:
 *                       type: string
 *                       example: "assets/avatars/default-avatar.png"
 *                     joinDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
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
 *                   example: "Error obteniendo perfil"
 */
router.get('/profile', auth, authController.getProfile);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     description: Actualiza los datos del perfil del usuario autenticado (solo name, description y avatar)
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre completo del usuario
 *                 example: "Juan Carlos Pérez"
 *               description:
 *                 type: string
 *                 description: Descripción del perfil
 *                 example: "Fotógrafo profesional y amante de los viajes"
 *               avatar:
 *                 type: string
 *                 description: URL del avatar del usuario
 *                 example: "https://example.com/new-avatar.jpg"
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
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
 *                   example: "Perfil actualizado exitosamente"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a7b8c9d1234567890abcde"
 *                     username:
 *                       type: string
 *                       example: "usuario123"
 *                     name:
 *                       type: string
 *                       example: "Juan Carlos Pérez"
 *                     email:
 *                       type: string
 *                       example: "juan@example.com"
 *                     description:
 *                       type: string
 *                       example: "Fotógrafo profesional y amante de los viajes"
 *                     avatar:
 *                       type: string
 *                       example: "https://example.com/new-avatar.jpg"
 *                     joinDate:
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
 *               examples:
 *                 no_fields:
 *                   value:
 *                     success: false
 *                     message: "No hay campos para actualizar"
 *                 validation_error:
 *                   value:
 *                     success: false
 *                     message: "Error de validación en los datos"
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
 *                   example: "Error actualizando perfil"
 */
router.put('/profile', auth, authController.updateProfile);

module.exports = router;