var request = require('request');
const config = require('../config');
var fs = require('fs');
var Readable = require('stream').Readable;
var Base64Decode = require('base64-stream').decode;
var base64 = require('base64-img');
var async = require('async');

var token = '123';

module.exports.renewToken = function(callback) {
    request.post(config.entiti.token_url, {
        form: {
            username: config.entiti.username,
            password: config.entiti.password,
            grant_type: 'password'
        }
    }, function (err, httpResponse, body) {
        if (httpResponse.statusCode != 200 || err) {
            if (!err)
                err = body;
            callback(err, body);
        }
        else {
            token = JSON.parse(body).access_token;
            if (callback)
                callback(null, body);

        }
    });
};

module.exports.overrideProjectImage = function (project, art, filename, done) {
    // var s = new Readable;
    // s.push(art);
    // s.pipe(Base64Decode());

    base64.img(art, '', filename,  function(err, filepath) {

        async.waterfall([
            function(callback) {
                var readable = fs.createReadStream(filepath);
                request.post(config.entiti.overrideProjectImage_url,
                    {
                        formData: {
                            projectId: project,
                            file: readable
                        },
                        auth: {
                            'bearer': token
                        }
                    }, function optionalCallback(err, httpResponse, body) {
                        if (!err && httpResponse.statusCode == 200)
                            return done(err, body);
                        else {
                            if (httpResponse.statusCode == 401) {
                                callback(null);
                            } else {
                                if (!err)
                                    err = body;
                                return done(err);
                            }
                        }
                    });
            },
            function(callback) {
                module.exports.renewToken(function (err, result) {
                    if (err)
                        return done(err);
                    else
                        return callback(null);
                });
            },
            function (callback) {
                var readable = fs.createReadStream(filepath);
                request.post(config.entiti.overrideProjectImage_url,
                    {
                        formData: {
                            projectId: project,
                            file: readable
                        },
                        auth: {
                            'bearer': token
                        }
                    }, function (err, httpResponse, body) {
                        if (!err && httpResponse.statusCode == 200)
                            return done(err, body);
                        else {
                            if (!err)
                                err = body;
                            return done(err);
                        }
                    });
            }
        ]);
    });
};