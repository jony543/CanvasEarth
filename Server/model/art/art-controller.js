const Controller = require('../../lib/controller');
const artModel  = require('./art-facade');


class ArtController extends Controller {
    listFiles(req, res, next) {
        return this.model.findById(req.params.id)
            .then(art => {
                return res.status(200).json(art);
            })
            .catch(err => next(err));
    }

    postFile(req, res, next) {
        return this.model.findById(req.params.id)
            .then(doc => {
                if (!doc) { return res.status(404).end(); }


                return res.status(200).json(doc);
            })
            .catch(err => next(err));
    }
}

module.exports = new ArtController(artModel);
