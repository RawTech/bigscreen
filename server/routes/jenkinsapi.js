var express = require('express');
var router = express.Router();
var jenkins = require('../jenkins/jenkins');

router.get('/jobs', function(req, res) {
    res.send(jenkins.getJobs());
});

module.exports = router;
