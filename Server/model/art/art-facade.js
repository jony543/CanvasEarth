const Model = require('../../lib/facade');
const artSchema  = require('./art-schema');


class ArtModel extends Model {}

module.exports = new ArtModel(artSchema);
