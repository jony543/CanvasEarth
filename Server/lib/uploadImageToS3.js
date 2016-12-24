const config = require('../config');
var s3Bucket = config.storage.s3Bucket;

var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var base64 = require('base64-img');


function uploadImageToS3(data, key, callback) {
    var image = img(data);
    s3.upload({
        Bucket: s3Bucket,
        Key: key + image.extname,
        Body: new Buffer(image.base64, 'base64'),
        ContentEncoding: 'base64',
        ContentType: 'image/' + image.format,
    }, function (err, data) {
        data.uploadedImageName = key + image.extname;
        callback(err, data);
    });
}


function img(data) {
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

module.exports = uploadImageToS3;