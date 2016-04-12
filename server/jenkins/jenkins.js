var _ = require('lodash');
var http = require('http');
var moment = require('moment');
var config = require('../config');
var jobs = {};
var socket = null;
var displayConfig = {};

/**
 * TODO this mess needs cleaning up.
 * (C&P'd) from the old devboard.
 */

function init() {
    _.forEach(config.view, function(viewSettings, screenName) {
        if (screenName.indexOf('jenkins') > -1) {
            _.forEach(viewSettings, function(jobDefinitions) {
                _.forEach(jobDefinitions, function(jobDefinition) {
                    displayConfig[jobDefinition.name] = {
                        displayName: jobDefinition.displayName,
                        width: jobDefinition.width
                    };
                });
            });
        }
    });

    setInterval(loop, 2000);

    loop();
}

function loop() {
    var options = {
        host: config.jenkins.hostname,
        port: config.jenkins.port,
        path: config.jenkins.path
    };

    var callback = function(response) {
        var data = '';

        response.on('data', function(chunk) {
            data += chunk;
        });

        response.on('end', function() {
            var unsortedJobs = [];

            JSON.parse(data).jobs.forEach(function(element){
                var job = {
                    name: element.name,
                    status: 'idle',
                    progress: 0,
                    colour: 'grey'
                };

                var lastBuild = element.lastBuild;
                var lastStable = element.lastStableBuild;
                var lastFailed = element.lastFailedBuild;

                if (lastBuild !== null) {
                    switch (lastBuild.result){
                        case 'FAILURE':
                            job.status = 'failed';
                            break;
                        case 'SUCCESS':
                            job.status = 'success';
                            break;
                        case 'ABORTED':
                            job.status = 'aborted';
                            break;
                        default:
                            job.status = 'building';
                            var lastDuration = 0;

                            if (lastStable !== null && lastStable.number == lastBuild.number-1) {
                                lastDuration = lastStable.duration;
                                job.pastStatus = 'success';
                            } else if (lastFailed !== null && lastFailed.number == lastBuild.number-1) {
                                lastDuration = lastFailed.duration;
                                job.pastStatus = 'failed';
                            } else {
                                job.pastStatus = 'idle';
                            }

                            if (lastDuration) {
                                job.progress = moment().diff(moment.unix(lastBuild.timestamp / 1000)) / lastDuration;
                                job.eta = moment(0).to(moment(lastDuration - (moment().unix() * 1000 - lastBuild.timestamp)));

                                if (job.progress > 1) {
                                    job.progress = 1;
                                }
                            }
                    }

                    job.duration = moment(0).to(lastBuild.duration, true);
                    job.start = moment(lastBuild.timestamp).fromNow();
                    job.timestamp = lastBuild.timestamp;
                    job.number = lastBuild.number;
                }

                if (displayConfig.hasOwnProperty(job.name)) {
                    var display = displayConfig[job.name];

                    job.displayName = display.displayName;
                    job.width = display.width;
                }

                switch (job.status) {
                    case 'success':
                        job.colour = 'green darken-4';
                        break;
                    case 'failed':
                        job.colour = 'red darken-4';
                        break;
                    case 'aborted':
                        job.colour = 'grey darken-2';
                        break;
                    case 'building':
                        switch (job.pastStatus) {
                            case 'success':
                                job.colour = 'green darken-3';
                                break;
                            case 'failed':
                                job.colour = 'red';
                                break;
                        }
                        break;
                }

                unsortedJobs.push(job);
            });

            unsortedJobs.sort(function(a, b){
                if (a.timestamp < b.timestamp) return 1;
                if (a.timestamp > b.timestamp) return -1;

                return 0;
            });

            jobs = {};

            _.forEach(unsortedJobs, function(job) {
                jobs[job.name] = job;
            });

            if (socket !== undefined) {
                socket.emit('screen-data', {type: 'jenkins-jobs', data: jobs});
            }
        });
    };

    http.request(options, callback).end();
}

module.exports = {
    init: init,
    getJobs: function () {
        return jobs;
    },
    setSocket: function (webSocket) {
        socket = webSocket;
    }
};
