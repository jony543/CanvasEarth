var fs = require('fs');
var base64Img = require('base64-img');

const controller = require('./art-controller');
const Router = require('express').Router;
const router = new Router();

router.route('/')
    .get((...args) => controller.find(...args))
    .post((...args) => controller.create(...args));

router.route('/:id')
    //..put((...args) => controller.update(...args))
    .get((...args) => controller.findById(...args));
    // .delete((...args) => controller.remove(...args));

// router.route('/:id/files')
//     .get((...args) => controller.listFiles(...args))
//     .post((...args) => controller.postFile(...args));

router.post('/augment', function(req, res) {
    var fileName = req.body.artName.split(' ').join('_');

    base64Img.img(req.body.canvasData, global.appRoot + '/web/resources/images/canvas', fileName + "_canvas", function(err, filePath) {
        if (filePath)
            console.log(filePath);
        if (err)
            console.log(err);
    });

    base64Img.img(req.body.artData, global.appRoot + '/web/resources/images/art', fileName + "_art", function(err, filePath) {
        if (filePath)
            console.log(filePath);
        if (err)
            console.log(err);
    });

    return res.sendStatus(201);
});

module.exports = router;
