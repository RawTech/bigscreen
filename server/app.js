var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

var app = express();
app.disable("x-powered-by");

app.use(favicon(path.join(__dirname, '../client', 'favicon.ico')));
app.use(express.static("./client"));
app.use(express.static("./node_modules/"));
app.use(logger('dev'));

// api routes
app.use('/api/rundeck', require('./routes/rundeckapi'));

// send the rest to angular
app.use(function(req, res) {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// init data collectors
require('./rundeck/rundeck').init();

module.exports = app;
