require('dotenv').config();
require('../app_api/models/db');
const { seedFull } = require('./seeder');

async function run() {
  try {
    await seedFull();
    console.log('✅ Seeding completo terminado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();