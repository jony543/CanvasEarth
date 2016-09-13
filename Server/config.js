const milieu = require('milieu');

const config = milieu('canvas-earth-server', {
  environment: 'dev',
  server: {
    port: 8080
  },
  mongo: {
    url: 'mongodb://localhost/CanvasEarthDB'
  }
});


module.exports = config;
