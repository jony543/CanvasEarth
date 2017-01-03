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
entitiProjects['canvas_3.jpg'] = '22496499-62ea-4250-b82e-a9a55f7de7ef';
entitiProjects['canvas_4.jpg'] = '452be3ec-0310-49ee-99dc-c10a417e02e1';
entitiProjects['canvas_5.jpg'] = 'b847712c-cc23-46af-a0cb-cee15b7ada8f';
entitiProjects['canvas_6.jpg'] = 'b31e1704-ee5b-4037-9c6c-3e9c27b9b1ff';

entitiProjects['canvas_7.jpg'] = 'dac2d7bc-f1a2-4e30-8186-d65cba3beb4f';

entitiProjects['canvas_8.jpg'] = '72dac290-af84-46cb-831b-4de2b6982fe3';

entitiProjects['canvas_9.jpg'] = '1fb21fea-b92a-44f9-a235-91aa65d133e3';

entitiProjects['canvas_10.jpg'] = 'ecee3dab-fde4-426d-9590-90fb56cc84f0';

entitiProjects['canvas_11.jpg'] = '89527d77-1c94-4655-9dc7-036c884bc95b';

entitiProjects['canvas_12.jpg'] = '9b7cff11-faee-4a20-bda2-a0631ac22e9d';

entitiProjects['canvas_13.jpg'] = '/ea728f77-de73-4515-b079-75497ad6b64f';

entitiProjects['canvas_14.jpg'] = '4fd47c8e-34af-4754-a007-a68ec2d4666f';

entitiProjects['canvas_15.jpg'] = '9c8e92b5-2698-48f1-86b8-edfb2612f808';

entitiProjects['canvas_16.jpg'] = '3d223709-1c31-41fc-aa47-bbb474768075';

entitiProjects['canvas_17.jpg'] = 'a3044de4-b647-4f2b-95f2-2b62e7c6fa05';

entitiProjects['canvas_18.jpg'] = '7ef2574f-93a0-4552-99c0-fe74c6033023';

entitiProjects['canvas_19.jpg'] = 'dcd59e84-2d7f-42e5-9e5c-9915fc81bcaf';

entitiProjects['canvas_20.jpg'] = 'c9f8ae99-205f-41ff-a8d7-05dfbb20fa31';

entitiProjects['canvas_21.jpg'] = 'f4bf50e0-6853-49e1-b235-142b24c6a66b';

entitiProjects['canvas_22.jpg'] = '7a1cf79d-2e90-4207-9f26-468560e7f118';

entitiProjects['canvas_23.jpg'] = '8c62d668-deb1-4952-8d1b-1e8721473c1d';

entitiProjects['canvas_24.jpg'] = '5f70b4de-9e09-400e-b516-b594e9668375';

entitiProjects['canvas_25.jpg'] = '0820a5f0-e5f7-4c91-af1b-ace5fc4468bc';

entitiProjects['canvas_26.jpg'] = '5e58ba25-0b15-4d7e-950b-fe919195cb48';

entitiProjects['canvas_27.jpg'] = 'f7b6fafa-b3b2-449c-8bf1-c6a62ebd0c38';

entitiProjects['canvas_28.jpg'] = '882955b2-9e70-4078-b9ef-c1ea9b8b9bd5';

entitiProjects['canvas_29.jpg'] = 'e01f8962-6159-4c40-9ffa-b554d3b8da04';

entitiProjects['canvas_30.jpg'] = '2b513ca5-b0dd-438a-8558-1b5cc71ffa22';

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
