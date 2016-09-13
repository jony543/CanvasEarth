const Controller = require('../../lib/controller');
const petModel  = require('./pet-facade');


class PetController extends Controller {}

module.exports = new PetController(petModel);
