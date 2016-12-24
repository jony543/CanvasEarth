const Controller = require('../../lib/controller');
const artModel  = require('./art-facade');
const config = require('../../config');

var fs = require('fs');
var async = require('async');
var request = require('request');

var entiti = require('../../lib/entiti');

var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var s3Bucket = 'cepublic';

var entitiToken = undefined;
var entitiProjects = {};
entitiProjects['canvas_ny.jpg'] = 'c0b2c581-66a3-4b2f-bd46-90d9e126923f';

class ArtController extends Controller {
    augment(req, res) {
        var fileName = req.body.artName.split(' ').join('_');

        async.parallel({
            canvas: function (callback) {
                return callback(null, { name: req.body.canvasData, isNew : false });

                if (req.body.canvasData) {
                    if (req.body.canvasData.length < 50) {
                        callback(null, { name: req.body.canvasData, isNew : false });
                    } else {
                        if (typeof req.body.canvasData == 'string') {
                            callback(null, req.body.canvasData);
                        } else {
                            this.uploadImageToS3(req.canvasData, 'images/canvas/' + fileName, function (err, data) {
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
                return callback(null);

                if (req.body.artData) {
                    if (req.body.artData < 50) {
                        callback(null, req.body.artData);
                    } else {
                        this.uploadImageToS3(req.artData, 'images/canvas/' + fileName, function (err, data){
                            if (err)
                                callback("Art upload failed");

                            callback(null, data.uploadedImageName);
                        });
                    }
                } else {
                    callback("No art data")
                }
            }

        }, function (err, result) {
            if (err)
                return res.status(500).json(err);

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

    uploadImageToS3(data, key, callback) {
        var image = this.img(data);
        s3.upload({
            Bucket: s3Bucket,
            Key: key + image.extname,
            Body: image.base64,
            ContentEncoding: 'base64',
            ContentType: 'image/' + image.format,
        }, function (err, data) {
            data.uploadedImageName = key + image.extname;
            callback(err, data);
        });
    }


    img(data) {
        var reg = /^data:image\/(\w+);base64,([\s\S]+)/;
        var match = data.match(reg);
        var baseType = {
            jpeg: 'jpg'
        };

        if (!match) {
            throw new Error('image base64 data error');
        }

        var extname = baseType[match[1]] ? baseType[match[1]] : match[1];

        return {
            format: baseType,
            extname: '.' + extname,
            base64: match[2]
        };
    }
}

module.exports = new ArtController(artModel);
