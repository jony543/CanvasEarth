var request = require('request');
const config = require('../config');
var fs = require('fs');
var base64 = require('base64-img');
var async = require('async');

var token = 'sometoken';

module.exports.projects = {
    "canvas1.jpg": '44651b7f-6e87-4c5e-9035-df5350471bdd',
    "canvas2.jpg": '5adbfa60-662f-4c0c-aae4-f301f5b38722'
};

module.exports.renewToken = function(callback) {
    console.log('[INFO]renewToken called:');
    request.post(config.entiti.token_url, {
        form: {
            username: config.entiti.username,
            password: config.entiti.password,
            grant_type: 'password'
        }
    }, function (err, httpResponse, body) {
        if (err) {
            console.log('[ERROR]entiti token renewal failed: ' + JSON.stringify(err));
        } else {
            if (httpResponse.statusCode != 200) {
                console.log('[ERROR]entiti token renewal failed: ' + body``);
                return callback(body);
            } else {
                token = JSON.parse(body).access_token;
                console.log('[INFO]entiti token renewed: ' + token);
                if (callback)
                    callback(null, body);
            }
        }
    });
};

module.exports.overrideProjectImage = function (project, art, filename, done) {
    console.log('[INFO]overrideProjectImage called for project: ' + project + ', file: ' + filename);
    var d = new Date();
    var dateString = d.getMonth()+'-'+d.getDate()+'-'+d.getYear()+'T'+ d.getHours() +'-'+d.getMinutes() + '-' + d.getSeconds() + '-' + d.getMilliseconds();
    base64.img(art, 'temp', filename + '_' + dateString,  function(err, filepath) {
        if (err) {
            console.log("[ERROR]could not write file: " + filename);
            return done(err);
        }

        async.waterfall([
            function(callback) {
                var readable = fs.createReadStream(filepath);
                request.post(config.entiti.overrideProjectImage_url,
                    {
                        formData: {
                            projectId: project,
                            file: {
                                value: readable,
                                options: {
                                    filename: filename + '.png',
                                    contentType: 'image/png'
                                }
                            }
                        },
                        auth: {
                            'bearer': token
                        }
                    }, function optionalCallback(err, httpResponse, body) {
                        if (err){
                            return done(err)
                        } else {
                            if (httpResponse.statusCode == 200) {
                                console.log('[INFO]overrideProjectImage success');
                                return done(err, body);
                            }
                            else {
                                if (httpResponse.statusCode == 401) {
                                    console.log('[WARNING]overrideProjectImage unauthorized');
                                    callback(null);
                                } else {
                                    console.log('[WARNING]overrideProjectImage error: ' + body);
                                    return done(body);
                                }
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
                            file: {
                                value: readable,
                                options: {
                                    filename: filename + '.png',
                                    contentType: 'image/png'
                                }
                            }
                        },
                        auth: {
                            'bearer': token
                        }
                    }, function (err, httpResponse, body) {
                        if (!err && httpResponse.statusCode == 200) {
                            console.log('[INFO]overrideProjectImage success');
                            return done(err, body);
                        }
                        else {
                            if (!err)
                                err = body;
                            console.log('[WARNING]overrideProjectImage error: ' + error);
                            return done(err);
                        }
                    });
            }
        ]);
    });
};