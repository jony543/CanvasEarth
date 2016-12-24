const milieu = require('milieu');

const config = milieu('canvas-earth-server', {
    environment: 'dev',
    server: {
        port: 8080
    },
    mongo: {
        url: '${MONGODB_URL}'
    },
    entiti: {
        token_url: 'http://104.154.22.171/token',
        username: 'orishapira1@mail.tau.ac.il',
        password: '2hapAtak',
        overrideProjectImage_url: 'http://104.154.22.171/api/files/OverrideProjectImage'
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