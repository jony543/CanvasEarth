const milieu = require('milieu');

const config = milieu('canvas-earth-server', {
  environment: 'dev',
  server: {
    port: 8080
  },
  mongo: {
    url: 'mongodb://ceadmin:ceadmin@ds021046.mlab.com:21046/canvasearth1'
  }
});


module.exports = config;
