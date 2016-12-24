const config = require('../../config');

var async = require('async');
var size = require('http-image-size');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({region:'us-west-1'});

class CanvasController {
    find(req, res, next) {
        s3.listObjects({
            Bucket: config.storage.s3Bucket,
            Prefix: config.storage.images.gallery + "canvas_",
        }, function(err, data) {
            var result = {
                base_url: config.storage.host,
                images: []
            };

            async.each(data.Contents, function(item, callback) {
                size(config.storage.host + "/" + item.Key, function(err, dimensions, bytesRead) {
                    var img = {
                        src: config.storage.host + "/" + item.Key
                    };
                    if (!err && dimensions) {
                        img.h = dimensions.height;
                        img.w = dimensions.width;
                    } else {
                        img.h = 100;
                        img.w = 100;
                    }
                    result.images.push(img);
                    callback(null);
                });
            }, function (err) {
                if (!err)
                    return res.status(200).json(result);
                else
                    return res.status(500).json(err);
            });
        });
    }

    findById(req, res, next) {
        return res.status(200).json({ msg: 'canvas not found' });
    }
}

module.exports = new CanvasController();
