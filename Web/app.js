var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var fs = require('fs');
const morgan     = require('morgan');

var app = express();


app.use(bodyParser.json({limit: '50mb'}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(morgan('tiny'));

app.use('/web', express.static('web'));
app.use('/', express.static('web'));


//app.get('/sphere', function(req, res){
//    var urlParts = url.parse(req.url);
//    var urlQuery = urlParts.search || (urlParts.query) ? '?' + urlParts.query : '';
//    res.redirect('/web/sphere.html/' + urlQuery);
//});

app.post('/share', function(req, res){
    var base64Data = req.body.imageData.replace(/^data:image\/png;base64,/, "");

    var fileName = req.body.imageName.split(' ').join('_');

    var imageUrl = '/web/resources/' + fileName + '.png';
    if (req.body.panorama){
        imageUrl = '/sphere.html?imgUrl=/web/resources/' + fileName + '.png';
    }

    fs.writeFile(__dirname + '/web/resources/' + fileName + ".png", base64Data, 'base64', function(err) {
        console.log(err);
    });

    fs.readFile(__dirname + '/web/resources/locations.json', 'utf8', function (err, data){
        var j = JSON.parse(data);
        j.locations.push({
            "id": j.locations.length,
            "lat": req.body.lat,
            "lng": req.body.lng,
            "title": req.body.imageName,
            "info": "this is some more info",
            "img_url": imageUrl // '/web/resources/' + fileName + '.png'
        });

        fs.writeFile(__dirname + '/web/resources/locations.json', JSON.stringify(j), 'utf8', function(err) {
            console.log(err);
        });
    });

    return res.sendStatus(200);
});

// default route
app.use(function(req, res){
    var urlParts = url.parse(req.url);
    var urlQuery = urlParts.search || (urlParts.query) ? '?' + urlParts.query : '';
    res.redirect('/web/' + urlQuery);
});


app.listen(8080, function () {
    console.log('Example app listening on port 8080!');
});