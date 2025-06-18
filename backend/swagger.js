const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SpotGuide API',
    version: '1.0.0',
    description: 'API para la aplicación SpotGuide - Descubre lugares únicos en Almería',
    contact: {
      name: 'SpotGuide Team',
      email: 'contact@spotguide.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desarrollo'
    },
    {
      url: 'https://api.spotguide.com/api',
      description: 'Servidor de producción'
    }
  ],
  tags: [
    {
      name: 'Autenticación',
      description: 'Operaciones de autenticación y autorización'
    },
    {
      name: 'POIs',
      description: 'Operaciones con Points of Interest'
    },
    {
      name: 'POIs Personalizados',
      description: 'Gestión de POIs creados por usuarios'
    },
    {
      name: 'Favoritos',
      description: 'Gestión de POIs favoritos del usuario'
    },
    {
      name: 'Comentarios',
      description: 'Sistema de comentarios y valoraciones'
    },
    {
      name: 'Usuarios',
      description: 'Gestión de perfiles de usuario'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['username', 'name', 'email'],
        properties: {
          id: {
            type: 'string',
            description: 'ID único del usuario'
          },
          username: {
            type: 'string',
            description: 'Nombre de usuario único'
          },
          name: {
            type: 'string',
            description: 'Nombre completo del usuario'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email del usuario'
          },
          description: {
            type: 'string',
            description: 'Descripción opcional del usuario'
          },
          avatar: {
            type: 'string',
            description: 'URL del avatar del usuario'
          },
          joinDate: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de registro'
          }
        }
      },
      POI: {
        type: 'object',
        required: ['id', 'name', 'description', 'category', 'latitude', 'longitude'],
        properties: {
          id: {
            type: 'string',
            description: 'ID único del POI'
          },
          name: {
            type: 'string',
            description: 'Nombre del POI'
          },
          description: {
            type: 'string',
            description: 'Descripción del POI'
          },
          image: {
            type: 'string',
            description: 'URL de la imagen del POI'
          },
          category: {
            type: 'string',
            enum: ['historical', 'nature', 'restaurant', 'entertainment', 'shopping', 'culture', 'sports', 'health', 'education', 'transport', 'general'],
            description: 'Categoría del POI'
          },
          latitude: {
            type: 'number',
            format: 'double',
            description: 'Latitud del POI'
          },
          longitude: {
            type: 'number',
            format: 'double',
            description: 'Longitud del POI'
          },
          rating: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 5,
            description: 'Valoración del POI (0-5)'
          },
          reviewCount: {
            type: 'integer',
            description: 'Número de reseñas'
          },
          distance: {
            type: 'string',
            description: 'Distancia desde el punto de referencia'
          },
          estimatedTime: {
            type: 'string',
            description: 'Tiempo estimado de visita'
          },
          isFavorite: {
            type: 'boolean',
            description: 'Si es favorito del usuario actual'
          },
          poiType: {
            type: 'string',
            enum: ['foursquare', 'custom'],
            description: 'Tipo de POI'
          }
        }
      },
      CustomPOI: {
        allOf: [
          { $ref: '#/components/schemas/POI' },
          {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'ID del usuario creador'
              },
              userName: {
                type: 'string',
                description: 'Nombre del usuario creador'
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Fecha de creación'
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Fecha de última actualización'
              },
              totalFavorites: {
                type: 'integer',
                description: 'Número total de favoritos'
              },
              isCustom: {
                type: 'boolean',
                default: true,
                description: 'Indica si es un POI personalizado'
              }
            }
          }
        ]
      },
      // Actualizar el esquema Comment para incluir canDelete:

Comment: {
  type: 'object',
  required: ['id', 'poiId', 'userId', 'userName', 'rating', 'text', 'date'],
  properties: {
    id: {
      type: 'string',
      description: 'ID único del comentario',
      example: '64a7b8c9d1234567890abcdf'
    },
    poiId: {
      type: 'string',
      description: 'ID del POI comentado',
      example: '64a7b8c9d1234567890abcde'
    },
    poiName: {
      type: 'string',
      description: 'Nombre del POI (solo en comentarios del usuario)',
      example: 'Alcazaba de Almería'
    },
    poiType: {
      type: 'string',
      enum: ['foursquare', 'custom'],
      description: 'Tipo del POI (solo en comentarios del usuario)',
      example: 'foursquare'
    },
    userId: {
      type: 'string',
      description: 'ID del usuario que comentó',
      example: '64a7b8c9d1234567890abcdc'
    },
    userName: {
      type: 'string',
      description: 'Nombre del usuario que comentó',
      example: 'Juan Pérez'
    },
    userAvatar: {
      type: 'string',
      description: 'Avatar del usuario (por defecto usa avatar predeterminado)',
      example: 'assets/avatars/default-avatar.png'
    },
    rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Valoración dada (1-5 estrellas)',
      example: 4
    },
    text: {
      type: 'string',
      maxLength: 500,
      description: 'Texto del comentario',
      example: 'Lugar increíble, muy recomendado para visitar con familia'
    },
    date: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha de creación del comentario',
      example: '2024-01-15T10:30:00Z'
    },
    isOwn: {
      type: 'boolean',
      description: 'Si el comentario pertenece al usuario autenticado (solo en GET comentarios de POI)',
      example: false
    },
    canDelete: {
      type: 'boolean',
      description: 'Si el usuario actual puede eliminar este comentario (creador o propietario del POI)',
      example: true
    }
  }
},
      Favorite: {
        type: 'object',
        required: ['poiId', 'poiData'],
        properties: {
          id: {
            type: 'string',
            description: 'ID único del favorito'
          },
          userId: {
            type: 'string',
            description: 'ID del usuario'
          },
          poiId: {
            type: 'string',
            description: 'ID del POI'
          },
          poiData: {
            $ref: '#/components/schemas/POI'
          },
          savedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha en que se guardó como favorito'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Si la operación fue exitosa'
          },
          message: {
            type: 'string',
            description: 'Mensaje de respuesta'
          },
          data: {
            type: 'object',
            description: 'Datos de respuesta'
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          pois: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/POI'
            }
          },
          total: {
            type: 'integer',
            description: 'Total de resultados disponibles'
          },
          page: {
            type: 'integer',
            description: 'Página actual'
          },
          limit: {
            type: 'integer',
            description: 'Elementos por página'
          },
          hasMore: {
            type: 'boolean',
            description: 'Si hay más páginas disponibles'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            default: false
          },
          message: {
            type: 'string',
            description: 'Mensaje de error'
          },
          error: {
            type: 'string',
            description: 'Detalles del error'
          }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: [
    './app_api/routes/*.js',
    './app_api/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;