const mongoose = require('mongoose');

// Usuarios de prueba
const testUsers = [
  {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser1',
    name: 'Test User 1',
    email: 'test1@example.com',
    password: '$2b$10$encrypted.password.hash'
  },
  {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser2',
    name: 'Test User 2',
    email: 'test2@example.com',
    password: '$2b$10$encrypted.password.hash'
  }
];

// POIs custom de prueba
const testCustomPois = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Restaurante de Prueba',
    description: 'Un excelente restaurante para testing',
    category: 'restaurante',
    image: 'http://example.com/restaurant.jpg',
    imageType: 'url',
    location: {
      type: 'Point',
      coordinates: [-2.4597, 36.8381]
    },
    createdBy: testUsers[0]._id,
    isPublic: true,
    rating: 4.5,
    reviewCount: 10,
    totalFavorites: 5
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'POI Privado',
    description: 'Este POI es privado',
    category: 'ocio',
    image: 'http://example.com/private.jpg',
    imageType: 'url',
    location: {
      type: 'Point',
      coordinates: [-2.4600, 36.8385]
    },
    createdBy: testUsers[0]._id,
    isPublic: false,
    rating: 3.8,
    reviewCount: 3,
    totalFavorites: 1
  }
];

// POIs de Foursquare de prueba
const testFoursquarePois = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Café Foursquare',
    description: 'Café importado de Foursquare',
    category: 'restaurant',
    location: {
      type: 'Point',
      coordinates: [-2.4590, 36.8375]
    },
    rating: 4.2,
    reviewCount: 15,
    externalId: 'fsq_test123456789',
    address: 'Calle Test, 123, Almería',
    website: 'http://cafe-test.com',
    phone: '+34123456789'
  }
];

// Datos válidos para crear POI
const validPoiData = {
  name: 'Nuevo POI Test',
  description: 'Descripción del POI de prueba',
  category: 'restaurante',
  image: 'http://example.com/test-image.jpg',
  imageType: 'url',
  latitude: 36.8381,
  longitude: -2.4597
};

// Datos inválidos para testing
const invalidPoiData = {
  tooLongName: {
    ...validPoiData,
    name: 'a'.repeat(101)
  },
  tooLongDescription: {
    ...validPoiData,
    description: 'a'.repeat(501)
  },
  invalidCategory: {
    ...validPoiData,
    category: 'categoria-inexistente'
  },
  missingRequired: {
    description: 'Falta el nombre',
    category: 'restaurante'
  }
};

module.exports = {
  testUsers,
  testCustomPois,
  testFoursquarePois,
  validPoiData,
  invalidPoiData
};