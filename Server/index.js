const express    = require('express');
const mongoose   = require('mongoose');
const helmet     = require('helmet');
const bodyParser = require('body-parser');
const morgan     = require('morgan');
const bluebird   = require('bluebird');
var path = require('path');

var AWS = require('aws-sdk');
AWS.config.update({region:'us-west-1'});


const config = require('./config');
const routes = require('./routes');

global.appRoot = path.resolve(__dirname);

const app  = express();

var port = process.env.PORT ||config.server.port || 8080;  // set the port

mongoose.Promise = bluebird;
mongoose.connect(config.mongo.url);

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(morgan('tiny'));
app.use('/api', routes);

// serve static wikitude files
app.use('/', express.static( __dirname + '/web'));

app.listen(port, function () {
    console.log(`Magic happens on port ` + port);
});

module.exports = app;