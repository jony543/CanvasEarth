const controller = require('./art-controller');
const Router = require('express').Router;
const router = new Router();

router.route('/')
    .get((...args) => controller.find(...args))
    .post((...args) => controller.create(...args))
;

router.route('/:id')
    .get((...args) => controller.findById(...args))
    .put((...args) => controller.update(...args))
    // .delete((...args) => controller.remove(...args))
;

router.post('/augment', function(req, res) {
    controller.augment(req,res);
});

module.exports = router;
