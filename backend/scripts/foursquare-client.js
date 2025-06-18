const axios = require('axios');

class FoursquareClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.foursquare.com/v3/places';
  }

  async searchPois(city, category, limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: { 'Authorization': this.apiKey },
        params: {
          ll: `${city.lat},${city.lng}`,
          categories: category.fsq_id,
          limit: limit,
          radius: 5000
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error(`Error buscando POIs en ${city.name}:`, error.message);
      return [];
    }
  }
}

module.exports = FoursquareClient;