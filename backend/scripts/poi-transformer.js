function transformPoi(fsqPoi, category, city) {
  console.log(`🔄 Transformando POI: ${fsqPoi.name}`);
  console.log(`📊 Rating original: ${fsqPoi.rating}`);
  console.log(`📸 Fotos disponibles: ${fsqPoi.photos?.length || 0}`);
  
  // Procesar fotos
  const processedImages = processPhotos(fsqPoi.photos || []);
  console.log(`✅ Fotos procesadas: ${processedImages.length}`);
  
  // CONVERTIR RATING DE 0-10 A 0-5
  const convertedRating = convertRating(fsqPoi.rating);
  console.log(`📊 Rating convertido: ${convertedRating}`);
  
  return {
    // NO establecer _id, dejar que MongoDB lo genere automáticamente
    name: fsqPoi.name || 'Sin nombre',
    description: generateDescription(fsqPoi, category, city),
    category: category.name, // Usar category.name no category.spanish
    
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
    
    // RATING CONVERTIDO DE 0-10 A 0-5
    rating: convertedRating,
    reviewCount: fsqPoi.stats?.total_ratings || generateRandomReviews(),
    
    // FOTOS MEJORADAS
    image: processedImages.length > 0 ? processedImages[0] : generateDefaultImage(category),
    images: processedImages, // Array de todas las imágenes
    
    // Campos adicionales
    website: fsqPoi.website || null,
    phone: fsqPoi.tel || null,
    email: fsqPoi.email || null,
    address: formatAddress(fsqPoi.location),
    
    // Horarios si están disponibles
    hours: formatHours(fsqPoi.hours),
    
    // Precio si está disponible
    priceLevel: fsqPoi.price || null,
    
    // Redes sociales
    socialMedia: formatSocialMedia(fsqPoi.social_media),
    
    // Metadatos
    source: 'foursquare',
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// NUEVA FUNCIÓN: Convertir rating de 0-10 a 0-5
function convertRating(foursquareRating) {
  if (!foursquareRating || foursquareRating === 0) {
    return generateRandomRating(); // 3.5-4.5 por defecto
  }
  
  // Foursquare usa escala 0-10, convertir a 0-5
  let convertedRating = (foursquareRating / 10) * 5;
  
  // Redondear a 1 decimal
  convertedRating = Math.round(convertedRating * 10) / 10;
  
  // Asegurar que esté en rango 0-5
  if (convertedRating > 5) convertedRating = 5;
  if (convertedRating < 0) convertedRating = 0;
  
  // Si es muy bajo, usar un mínimo de 3.0
  if (convertedRating < 3.0) {
    convertedRating = Math.random() * 1.5 + 3.0; // 3.0-4.5
    convertedRating = Math.round(convertedRating * 10) / 10;
  }
  
  return convertedRating;
}

function processPhotos(photos) {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    console.log('⚠️ No hay fotos para procesar');
    return [];
  }

  const processedPhotos = [];
  
  for (const photo of photos) {
    try {
      if (photo.prefix && photo.suffix) {
        // Generar diferentes tamaños
        const sizes = {
          thumbnail: `${photo.prefix}150x150${photo.suffix}`,
          medium: `${photo.prefix}300x300${photo.suffix}`,
          large: `${photo.prefix}600x600${photo.suffix}`,
          original: `${photo.prefix}original${photo.suffix}`
        };
        
        // Usar tamaño medium como principal
        processedPhotos.push(sizes.medium);
        
        console.log(`📸 Foto procesada: ${sizes.medium}`);
      } else {
        console.log('⚠️ Foto sin prefix/suffix:', photo);
      }
    } catch (error) {
      console.error('❌ Error procesando foto:', error);
    }
  }
  
  return processedPhotos;
}

function generateDescription(fsqPoi, category, city) {
  let description = '';
  
  // Usar descripción de Foursquare si existe
  if (fsqPoi.description) {
    description = fsqPoi.description;
  } else {
    // Generar descripción basada en datos disponibles
    description = `${category.spanish} en ${city.name}`;
    
    if (fsqPoi.rating) {
      const convertedRating = convertRating(fsqPoi.rating);
      description += ` con una valoración de ${convertedRating} estrellas`;
    }
    
    if (fsqPoi.stats?.total_ratings) {
      description += ` basada en ${fsqPoi.stats.total_ratings} reseñas`;
    }
  }
  
  return description;
}

function formatAddress(location) {
  if (!location) return '';
  
  const parts = [];
  if (location.address) parts.push(location.address);
  if (location.locality) parts.push(location.locality);
  if (location.region) parts.push(location.region);
  if (location.postcode) parts.push(location.postcode);
  if (location.country) parts.push(location.country);
  
  return parts.join(', ');
}

function formatHours(hours) {
  if (!hours || !hours.regular) return null;
  
  try {
    return {
      regular: hours.regular,
      display: hours.display || null,
      is_local_holiday: hours.is_local_holiday || false
    };
  } catch (error) {
    console.error('❌ Error formateando horarios:', error);
    return null;
  }
}

function formatSocialMedia(socialMedia) {
  if (!socialMedia) return null;
  
  try {
    return {
      facebook: socialMedia.facebook_id || null,
      instagram: socialMedia.instagram || null,
      twitter: socialMedia.twitter || null
    };
  } catch (error) {
    console.error('❌ Error formateando redes sociales:', error);
    return null;
  }
}

function generateDefaultImage(category) {
  // URLs de imágenes por defecto por categoría
  const defaultImages = {
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=300&fit=crop',
    tourism: 'https://www.bbva.com/wp-content/uploads/2020/12/turismo_sostenible.jpg',
    entertainment: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=300&h=300&fit=crop',
    shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
    accommodation: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=300&fit=crop'
  };
  
  return defaultImages[category.name] || defaultImages.tourism;
}

function generateRandomRating() {
  // Generar rating entre 3.0 y 4.5
  return Math.round((Math.random() * 1.5 + 3.0) * 10) / 10;
}

function generateRandomReviews() {
  // Generar número de reseñas entre 10 y 200
  return Math.floor(Math.random() * 190) + 10;
}

module.exports = { 
  transformPoi,
  processPhotos,
  generateDefaultImage,
  convertRating
};