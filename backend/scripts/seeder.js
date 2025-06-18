const FoursquareClient = require('./foursquare-client');
const { transformPoi } = require('./poi-transformer');
const { CITIES, SAMPLE_CITIES, CATEGORIES } = require('./config');
const POI = require('../app_api/models/poi');

async function seedPois(citiesCount = 1, poisPerCategory = 5) {
  console.log('🚀 Iniciando seeding...');
  
  const client = new FoursquareClient(process.env.FOURSQUARE_API_KEY);
  const stats = { inserted: 0, skipped: 0, errors: 0 };
  
  const citiesToProcess = CITIES.slice(0, citiesCount);
  
  for (const city of citiesToProcess) {
    console.log(`📍 Procesando ${city.name}...`);
    
    for (const category of CATEGORIES) {
      try {
        const pois = await client.searchPois(city, category, poisPerCategory);
        console.log(`🔍 Encontrados ${pois.length} ${category.spanish} en ${city.name}`);
        
        for (const fsqPoi of pois) {
          try {
            const poi = transformPoi(fsqPoi, category, city);
            
            // Verificar si ya existe usando externalId (Foursquare ID)
            const existing = await POI.findOne({ externalId: poi.externalId });
            if (existing) {
              stats.skipped++;
              console.log(`⏭️ Ya existe: ${poi.name}`);
              continue;
            }
            
            // Guardar nuevo POI
            const savedPoi = await POI.create(poi);
            stats.inserted++;
            console.log(`✅ Guardado: ${poi.name} (ID: ${savedPoi._id})`);
            
          } catch (error) {
            stats.errors++;
            console.error(`❌ Error guardando POI "${fsqPoi.name}":`, error.message);
          }
        }
        
        // Pausa entre categorías
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        stats.errors++;
        console.error(`❌ Error procesando ${category.spanish} en ${city.name}:`, error.message);
      }
    }
  }
  
  console.log('\n📊 === ESTADÍSTICAS FINALES ===');
  console.log(`✅ POIs insertados: ${stats.inserted}`);
  console.log(`⏭️ POIs ya existentes: ${stats.skipped}`);
  console.log(`❌ Errores: ${stats.errors}`);
  
  return stats;
}

// Funciones específicas
async function seedSample() {
  return await seedPois(1, 5); // 1 ciudad, 5 POIs por categoría
}

async function seedFull() {
  return await seedPois(4, 15); // 4 ciudades, 15 POIs por categoría
}

// Funciones con nombres alternativos para compatibilidad
async function seedSamplePois() {
  return await seedSample();
}

async function seedFoursquarePois() {
  return await seedFull();
}

module.exports = {
  seedSample,
  seedFull,
  seedSamplePois,
  seedFoursquarePois
};