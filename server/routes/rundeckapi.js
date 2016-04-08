var express = require('express');
var router = express.Router();
var rundeck = require('../rundeck/rundeck');

router.get('/recent', function(req, res) {
    res.send(rundeck.getRecent());
});

router.get('/failures', function(req, res) {
    res.send(rundeck.getFailures());
});

module.exports = router;
