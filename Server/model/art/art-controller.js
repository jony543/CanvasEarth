const Controller = require('../../lib/controller');
const artModel  = require('./art-facade');
const config = require('../../config');

var fs = require('fs');
var async = require('async');
var request = require('request');

var entiti = require('../../lib/entiti');
var uploadImageToS3 = require('../../lib/uploadImageToS3');

var entitiProjects = {};
entitiProjects['canvas_1.jpg'] = '44651b7f-6e87-4c5e-9035-df5350471bdd';
entitiProjects['canvas_2.jpg'] = '5adbfa60-662f-4c0c-aae4-f301f5b38722';

class ArtController extends Controller {
    augment(req, res) {
        var fileName = req.body.artName.split(' ').join('_');

        async.parallel({
            canvas: function (callback) {
                if (req.body.canvasData) {
                    if (req.body.canvasData.length < 50) {
                        callback(null, { name: req.body.canvasData, isNew : false });
                    } else {
                        uploadImageToS3(req.body.canvasData, config.storage.images.canvas + fileName, function (err, data) {
                            if (err) {
                                console.log('[ERROR]failed uploading canvas to S3: ' + fileName);
                                callback("Canvas upload failed");
                            }

                            callback(null, {name : data.uploadedImageName, isNew: true });
                        });
                    }
                } else {
                    callback("No canvas data")
                }
            },

            art: function (callback) {
                if (req.body.artData) {
                    if (req.body.artData < 50) {
                        callback(null, req.body.artData);
                    } else {
                        uploadImageToS3(req.body.artData, config.storage.images.art + fileName, function (err, data){
                            if (err) {
                                console.log('[ERROR]failed uploading art to S3: ' + fileName);
                                callback("Canvas upload failed");
                            }
                            callback(null, data.uploadedImageName);
                        });
                    }
                } else {
                    callback("No art data")
                }
            }

        }, function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            if (result.canvas.isNew) {
                console.log('[INFO]creating new art record in db: ' + fileName);
                artModel.create({
                    title: fileName,

                    canvas_file: result.canvas.name,
                    art_file: result.art,

                    visible: false,

                    lat: req.body.lat,
                    lng: req.body.lng
                })
                .then(doc => {
                    console.log('[INFO]art created with id: ' + doc.id);
                    return res.sendStatus(201);
                })
                .catch(err => {
                    console.log('[INFO]failed creating art: ' + err);
                    return res.status(500).json(err);
                });
            } else {
                var project = entitiProjects[req.body.canvasData];
                if (!project) {
                    console.log('[ERROR]Could not find project with canvas: ' + req.body.canvasData);
                    res.status(500).json({msg: 'Could not find project with canvas: ' + req.body.canvasData});
                }
                entiti.overrideProjectImage(project, req.body.artData, 'art', function(err, result) {
                   if (err)
                       return res.status(500).json(err);
                    else
                        return res.sendStatus(200);
                });
            }
        });
    }
}

module.exports = new ArtController(artModel);
