var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({ 
    message: 'SpotGuide Backend API',
    version: '1.0.0',
    endpoints: '/api'
  });
});

module.exports = router;