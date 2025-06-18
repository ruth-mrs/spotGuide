const jwt = require('jsonwebtoken');
const User = require('../../app_api/models/user');
const CustomPoi = require('../../app_api/models/customPoi');
const mongoose = require('mongoose');

const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, 'test-secret', { expiresIn: '1h' });
};

const createTestUser = async () => {
  const userData = {
    _id: new mongoose.Types.ObjectId(),
    username: `u${Math.random().toString(36).substr(2, 8)}`,
    name: `Test User`,
    email: `t${Date.now()}@test.com`,
    password: '$2b$10$test.hash'
  };
  
  try {
    const user = await User.create(userData);
    const token = generateTestToken(user._id);
    return { user, token };
  } catch (error) {
    const user = { _id: userData._id, username: userData.username };
    const token = generateTestToken(user._id);
    return { user, token };
  }
};

const createTestPoi = async (userId) => {
  try {
    const poi = await CustomPoi.create({
      name: 'Test POI',
      description: 'Test description',
      category: 'restaurante',
      image: 'http://test.com/image.jpg',
      imageType: 'url',
      location: {
        type: 'Point',
        coordinates: [-2.4597, 36.8381]
      },
      createdBy: userId,
      isPublic: true,
      rating: 4.5,
      reviewCount: 10,
      totalFavorites: 5
    });
    return poi;
  } catch (error) {
    return { _id: new mongoose.Types.ObjectId(), name: 'Test POI' };
  }
};

module.exports = {
  generateTestToken,
  createTestUser,
  createTestPoi
};