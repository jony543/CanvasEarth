const Controller = require('../../lib/controller');
const artModel  = require('./art-facade');
const config = require('../../config');

var fs = require('fs');
var async = require('async');
var request = require('request');

var entiti = require('../../lib/entiti');
var uploadImageToS3 = require('../../lib/uploadImageToS3');

var entitiProjects = {};
entitiProjects['canvas_ny.jpg'] = 'c0b2c581-66a3-4b2f-bd46-90d9e126923f';

class ArtController extends Controller {
    augment(req, res) {
        var fileName = req.body.artName.split(' ').join('_');

        async.parallel({
            canvas: function (callback) {
                if (req.body.canvasData) {
                    if (req.body.canvasData.length < 50) {
                        callback(null, { name: req.body.canvasData, isNew : false });
                    } else {
                        if (typeof req.body.canvasData == 'string') {
                            callback(null, req.body.canvasData);
                        } else {
                            uploadImageToS3(req.body.canvasData, config.storage.images.canvas + fileName, function (err, data) {
                                if (err)
                                    callback("Canvas upload failed");

                                callback(null, {name : data.uploadedImageName, isNew: true });
                            });
                        }
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
                            if (err)
                                callback("Canvas upload failed");

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
                this.model.create({
                    title: fileName,

                    canvas_file: result.canvas,
                    art_file: result.art,

                    visible: false,

                    lat: req.body.lat,
                    lng: req.body.lng
                })
                .then(doc => {
                    return res.sendStatus(201);
                })
                .catch(err => {
                    return res.status(500).json(err);
                });
            } else {
                var project = entitiProjects[req.body.canvasData];
                if (!project)
                    res.status(500).json({ msg: 'Could not find project with canvas: ' + req.body.canvasData });

                entiti.overrideProjectImage(project, req.body.artData, 'app headline WHITE', function(err, result) {
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
