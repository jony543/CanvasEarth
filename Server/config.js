const milieu = require('milieu');

const config = milieu('canvas-earth-server', {
    environment: 'dev',
    server: {
        port: 8080
    },
    mongo: {
        url: '${MONGODB_URL}'
    },
    storage: {
        host: '${FILE_SERVER_URL}',
        s3Bucket: 'cepublic',
        images: {
            gallery: 'canvas_gallery/',
            canvas: 'iamges/canvas/',
            art: 'images/art/'
        }
    }
});


module.exports = config;