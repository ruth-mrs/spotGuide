const axios = require('axios');

class FoursquareClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('FOURSQUARE_API_KEY es requerido');
    }
    
    this.apiKey = apiKey;
    this.baseURL = 'https://api.foursquare.com/v3';
    this.rateLimitDelay = 100; // 100ms entre requests
  }

  async searchPois(city, category, limit = 10) {
    try {
      console.log(`🔍 Buscando ${category.spanish} en ${city.name}...`);
      
      // Búsqueda de lugares
      const placesResponse = await this.makeRequest('/places/search', {
        ll: `${city.lat},${city.lng}`,
        categories: category.foursquareId,
        limit: limit,
        radius: 10000, // 10km
        sort: 'RATING'
      });

      if (!placesResponse.results || placesResponse.results.length === 0) {
        console.log(`⚠️ No se encontraron ${category.spanish} en ${city.name}`);
        return [];
      }

      // Obtener detalles con fotos para cada POI
      const poisWithPhotos = [];
      
      for (const place of placesResponse.results) {
        try {
          // Pausa para respetar rate limits
          await this.delay(this.rateLimitDelay);
          
          // Obtener detalles del lugar incluyendo fotos
          const details = await this.getPlaceDetails(place.fsq_id);
          
          // Combinar datos básicos con detalles
          const enrichedPoi = {
            ...place,
            ...details,
            photos: details.photos || []
          };
          
          poisWithPhotos.push(enrichedPoi);
          console.log(`📸 ${place.name}: ${details.photos?.length || 0} fotos`);
          
        } catch (error) {
          console.error(`❌ Error obteniendo detalles de ${place.name}:`, error.message);
          // Agregar el POI sin fotos si falla
          poisWithPhotos.push({
            ...place,
            photos: []
          });
        }
      }

      return poisWithPhotos;

    } catch (error) {
      console.error(`❌ Error buscando POIs:`, error.message);
      throw error;
    }
  }

  async getPlaceDetails(fsqId) {
    try {
      console.log(`📋 Obteniendo detalles de ${fsqId}...`);
      
      // Obtener detalles básicos
      const details = await this.makeRequest(`/places/${fsqId}`, {
        fields: 'name,location,geocodes,categories,rating,stats,website,tel,email,description,hours,price,menu,social_media'
      });

      // Obtener fotos por separado
      const photos = await this.getPlacePhotos(fsqId);

      return {
        ...details,
        photos: photos
      };

    } catch (error) {
      console.error(`❌ Error obteniendo detalles de ${fsqId}:`, error.message);
      return { photos: [] };
    }
  }

  async getPlacePhotos(fsqId) {
    try {
      console.log(`📸 Obteniendo fotos de ${fsqId}...`);
      
      const photosResponse = await this.makeRequest(`/places/${fsqId}/photos`, {
        limit: 5, // Máximo 5 fotos
        sort: 'POPULAR'
      });

      if (!photosResponse || photosResponse.length === 0) {
        console.log(`⚠️ No se encontraron fotos para ${fsqId}`);
        return [];
      }

      console.log(`✅ Encontradas ${photosResponse.length} fotos para ${fsqId}`);
      return photosResponse;

    } catch (error) {
      console.error(`❌ Error obteniendo fotos de ${fsqId}:`, error.message);
      return [];
    }
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        },
        params: params,
        timeout: 10000
      });

      return response.data;

    } catch (error) {
      if (error.response) {
        console.error(`❌ Foursquare API Error ${error.response.status}:`, error.response.data);
        throw new Error(`Foursquare API Error: ${error.response.status}`);
      } else if (error.request) {
        console.error('❌ No response from Foursquare API');
        throw new Error('No response from Foursquare API');
      } else {
        console.error('❌ Request setup error:', error.message);
        throw error;
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = FoursquareClient;