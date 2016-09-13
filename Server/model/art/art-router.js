const controller = require('./art-controller');
const Router = require('express').Router;
const router = new Router();

router.route('/')
    .get((...args) => controller.find(...args))
    .post((...args) => controller.create(...args));

router.route('/:id')
    //..put((...args) => controller.update(...args))
    .get((...args) => controller.findById(...args))
    .delete((...args) => controller.remove(...args));

router.route('/:id/files')
    .get((...args) => controller.listFiles(...args))
    .post((...args) => controller.postFile(...args));

module.exports = router;
