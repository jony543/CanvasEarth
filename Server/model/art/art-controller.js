const Controller = require('../../lib/controller');
const artModel  = require('./art-facade');

var fs = require('fs');
var async = require('async');
var AWS = require('aws-sdk');
AWS.config.update({region:'us-west-1'});
var s3 = new AWS.S3();
var s3Bucket = 'cepublic';

class ArtController extends Controller {
    augment(req, res) {
        var fileName = req.body.artName.split(' ').join('_');
        
        async.parallel({
            canvas: function (callback) {
                if (req.body.canvasData) {
                    if (typeof req.body.canvasData == 'string') {
                        callback(null, req.body.canvasData);
                    } else {
                        this.uploadImageToS3(req.canvasData, 'images/canvas/' + fileName, function (err, data){
                            if (err)
                                callback("Canvas upload failed");

                            callback(null, data.uploadedImageName);
                        });
                    }
                } else {
                    callback("No canvas data")
                }
            },

            art: function (callback) {
                if (req.body.artData) {
                    if (typeof req.body.artData == 'string') {
                        callback(null, req.body.artData);
                    } else {
                        this.uploadImageToS3(req.artData, 'images/canvas/' + fileName, function (err, data){
                            if (err)
                                callback("Art upload failed");

                            callback(null, data.ETag);
                        });
                    }
                } else {
                    callback("No art data")
                }
            }
            
            // entityAPI: function (callback) {
            //
            // },
            //
            // dbEntry: function (callback) {
            //
            // }

        }, function (err, result) {
            if (err)
                return res.status(500).json(err);
            

            // TODO - async waterfall - send to entity api and then save link to db

            this.model.create({
                title: fileName,
                canvas_file: result.canvas,
                art_file: result.art,
                
                lat: 32.283889,
                lng: 34.9075
            })
            .then(doc => {
                callback(null, doc);
            })
            .catch(err => {
                callback(err);
            });

            return res.sendStatus(201);
        });

        // base64Img.img(req.body.canvasData, global.appRoot + '/web/resources/images/canvas', fileName + "_canvas", function(err, filePath) {
        //     if (filePath)
        //         console.log(filePath);
        //     if (err)
        //         console.log(err);
        // });
        //
        // base64Img.img(req.body.artData, global.appRoot + '/web/resources/images/art', fileName + "_art", function(err, filePath) {
        //     if (filePath)
        //         console.log(filePath);
        //     if (err)
        //         console.log(err);
        // });
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
