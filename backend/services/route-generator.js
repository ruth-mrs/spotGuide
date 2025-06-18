const { z } = require('zod');
const Groq = require('groq-sdk');
require('dotenv').config();

let groq = null;

try {
  if (process.env.GROQ_API_KEY && process.env.NODE_ENV !== 'test') {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
} catch (error) {
  console.warn('⚠️ GROQ no inicializado:', error.message);
}

// Schema de validación para la respuesta de la IA
const RouteSchema = z.object({
  name: z.string().describe('Nombre atractivo de la ruta'),
  description: z.string().describe('Descripción detallada de la ruta'),
  difficulty: z.enum(['Fácil', 'Moderada', 'Difícil']).describe('Nivel de dificultad'),
  estimatedTime: z.string().describe('Tiempo estimado total (ej: "4-5 horas")'),
  totalDistance: z.string().describe('Distancia total aproximada'),
  orderedPois: z.array(z.object({
    poiId: z.string(),
    name: z.string(),
    order: z.number(),
    timeToSpend: z.string().describe('Tiempo recomendado en este lugar'),
    notes: z.string().describe('Notas específicas para este POI'),
    category: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    image: z.string().optional(),
    isCustom: z.boolean().optional()
  })).describe('POIs ordenados de forma óptima'),
  recommendations: z.array(z.string()).describe('Recomendaciones adicionales para la ruta'),
  bestTimeToVisit: z.string().describe('Mejor momento para hacer la ruta'),
  transportRecommendations: z.string().describe('Recomendaciones de transporte')
});

class RouteAIService {
  
  /**
   * Genera una ruta optimizada usando IA
   * @param {Object} request - Datos de la solicitud
   * @returns {Promise<Object>} - Ruta generada
   */
  async generateRoute(request) {
    try {
      console.log('🤖 RouteAI: Generando ruta con IA para:', request.pois.length, 'POIs');

      const prompt = this.buildPrompt(request);
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Eres un experto guía turístico y planificador de rutas. Tu trabajo es crear rutas turísticas optimizadas basadas en los POIs proporcionados.

INSTRUCCIONES:
1. Analiza los POIs proporcionados (ubicación, categoría, descripción)
2. Crea una ruta lógica considerando:
   - Proximidad geográfica para minimizar desplazamientos
   - Horarios típicos de apertura según la categoría
   - Flujo natural de actividades (ej: desayuno → actividades → almuerzo → más actividades)
   - Preferencias del usuario
3. Proporciona recomendaciones prácticas
4. Responde SOLO con un JSON válido que siga exactamente esta estructura:

{
  "name": "Nombre atractivo de la ruta",
  "description": "Descripción detallada de la experiencia",
  "difficulty": "Fácil|Moderada|Difícil",
  "estimatedTime": "Tiempo total estimado",
  "totalDistance": "Distancia aproximada",
  "orderedPois": [
    {
      "poiId": "id_del_poi",
      "name": "Nombre del POI",
      "order": 1,
      "timeToSpend": "Tiempo recomendado",
      "notes": "Consejos específicos para este lugar",
      "category": "categoría",
      "latitude": número,
      "longitude": número,
      "image": "url_imagen",
      "isCustom": boolean
    }
  ],
  "recommendations": ["Recomendación 1", "Recomendación 2"],
  "bestTimeToVisit": "Mejor momento para hacer la ruta",
  "transportRecommendations": "Cómo moverse en la ruta"
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gemma2-9b-it",
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('No se recibió respuesta de la IA');
      }

      console.log('🤖 Respuesta de IA recibida:', responseText.substring(0, 200) + '...');

      // Limpiar y parsear JSON
      let cleanedResponse = responseText.trim();
      
      // Extraer JSON si viene envuelto en texto
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      const parsedResponse = JSON.parse(cleanedResponse);
      
      // Validar con Zod
      const validatedRoute = RouteSchema.parse(parsedResponse);
      
      console.log('✅ Ruta generada exitosamente:', validatedRoute.name);
      
      return {
        success: true,
        route: validatedRoute
      };

    } catch (error) {
      console.error('❌ Error generando ruta:', error);
      
      if (error instanceof z.ZodError) {
        console.error('Error de validación:', error.errors);
        return {
          success: false,
          error: 'La IA generó una respuesta inválida. Inténtalo de nuevo.'
        };
      }
      
      if (error instanceof SyntaxError) {
        console.error('Error parsing JSON:', error.message);
        return {
          success: false,
          error: 'Error procesando la respuesta de la IA. Inténtalo de nuevo.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error generando la ruta con IA'
      };
    }
  }

  /**
   * Construye el prompt para la IA
   * @param {Object} request - Datos de la solicitud
   * @returns {string} - Prompt formateado
   */
  buildPrompt(request) {
    const { pois, preferences, duration, baseLocation } = request;
    
    const poisDetails = pois.map((poi, index) => {
      return `${index + 1}. ${poi.name}
   - Categoría: ${poi.category}
   - Descripción: ${poi.description}
   - Ubicación: ${poi.latitude}, ${poi.longitude}
   - Imagen: ${poi.image || 'No disponible'}`;
    }).join('\n\n');

    return `
GENERAR RUTA TURÍSTICA

UBICACIÓN BASE: ${baseLocation}
DURACIÓN DESEADA: ${duration}
PREFERENCIAS: ${preferences || 'Sin preferencias específicas'}

POIS DISPONIBLES (${pois.length} lugares):
${poisDetails}

REQUISITOS ESPECÍFICOS:
- Optimizar el orden de visita para minimizar desplazamientos
- Considerar horarios lógicos (restaurantes para comidas, etc.)
- Incluir tiempo realista para cada lugar
- Proporcionar consejos prácticos
- Crear una experiencia fluida y agradable
- Mantener todos los POIs proporcionados en la ruta

Por favor, genera una ruta completa y detallada siguiendo exactamente el formato JSON especificado.
    `.trim();
  }
}

module.exports = new RouteAIService();