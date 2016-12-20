const Router = require('express').Router;
const router = new Router();

// const user  = require('./model/user/user-router');
// const pet  = require('./model/pet/pet-router');
const art = require('./model/art/art-router');
const canvas = require('./model/canvas/canvas-router');

router.route('/').get((req, res) => {
  res.json({ message: 'Welcome to canvas-earth-server API!' });
});

// router.use('/user', user);
// router.use('/pet', pet);
router.use('/art', art);
router.use('/canvas', canvas);

module.exports = router;
