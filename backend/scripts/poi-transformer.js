function transformPoi(fsqPoi, category, city) {
  return {
    // NO establecer _id, dejar que MongoDB lo genere automáticamente
    name: fsqPoi.name || 'Sin nombre',
    description: `${category.spanish} en ${city.name}`,
    category: category.name,
    
    // El modelo poi.js usa location con coordinates [lng, lat]
    location: {
      type: 'Point',
      coordinates: [
        fsqPoi.geocodes?.main?.longitude || city.lng, // longitude primero
        fsqPoi.geocodes?.main?.latitude || city.lat    // latitude segundo
      ]
    },
    
    // Usar externalId para el ID de Foursquare
    externalId: fsqPoi.fsq_id,
    
    rating: fsqPoi.rating || 0,
    reviewCount: 0,
    
    // Campos opcionales del modelo poi.js
    image: fsqPoi.photos?.[0] ? `${fsqPoi.photos[0].prefix}300x300${fsqPoi.photos[0].suffix}` : null,
    website: fsqPoi.website || null,
    phone: fsqPoi.tel || null,
    address: formatAddress(fsqPoi.location),
    
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function formatAddress(location) {
  if (!location) return '';
  
  const parts = [];
  if (location.address) parts.push(location.address);
  if (location.locality) parts.push(location.locality);
  if (location.region) parts.push(location.region);
  if (location.country) parts.push(location.country);
  
  return parts.join(', ');
}

module.exports = { transformPoi };