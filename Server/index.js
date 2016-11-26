const express    = require('express');
const mongoose   = require('mongoose');
const helmet     = require('helmet');
const bodyParser = require('body-parser');
const morgan     = require('morgan');
const bluebird   = require('bluebird');

const config = require('./config');
const routes = require('./routes');

const app  = express();

var port = process.env.PORT ||config.server.port || 8080;  // set the port

mongoose.Promise = bluebird;
mongoose.connect(config.mongo.url);

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use('/', routes);

// serve static website files
app.use('/ar', express.static('web'));

app.listen(port, function () {
    console.log(`Magic happens on port ` + port);
});

module.exports = app;