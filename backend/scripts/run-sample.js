require('dotenv').config();
require('../app_api/models/db');
const { seedSample } = require('./seeder');

async function run() {
  try {
    await seedSample();
    console.log('✅ Seeding de muestra completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();